<#
.SYNOPSIS
Deploys ParkEat to Azure from the command prompt using Azure CLI.

.DESCRIPTION
- Backend: Azure App Service (Linux) + zip deploy
- Frontend: Azure Storage Static Website + blob upload

This avoids GitHub Actions/Static Web Apps requirements and works well for student subscriptions.

PREREQUISITES
- Azure CLI installed: https://learn.microsoft.com/cli/azure/install-azure-cli
- Node.js + npm installed
- You are logged in: az login

USAGE
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-azure.ps1

Optional:
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-azure.ps1 -Location westeurope -ResourceGroup parkeat-rg
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-azure.ps1 -BackendName myapi -PlanName myplan -StorageAccountName mystorage

NOTES
- The script reads backend/.env by default and uploads values to Web App settings (excluding PORT and CORS_ORIGIN).
- If you don’t want that, pass -SkipBackendEnv.
- Some endpoints (agents/payments) require secrets like GROQ/Stripe; set them in backend/.env before running, or later via `az webapp config appsettings set`.
#>

[CmdletBinding()]
param(
  [string]$Location = "westeurope",
  [string]$ResourceGroup = "parkeat-rg",
  [string]$NamePrefix = "parkeat",
  [ValidateSet('B1','F1','S1')][string]$BackendSku = "B1",
  [ValidateSet('NODE:20-lts','NODE:22-lts','NODE:24-lts')][string]$BackendRuntime = "NODE:22-lts",
  [string]$BackendName,
  [string]$PlanName,
  [string]$StorageAccountName,
  [switch]$Destroy,
  [switch]$Reset,
  [switch]$Force,
  [switch]$SkipBackendEnv,
  [switch]$SkipBackend,
  [switch]$SkipFrontend
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err([string]$Message)  { Write-Host "[ERROR] $Message" -ForegroundColor Red }

if (-not ("Win32Path" -as [type])) {
  Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class Win32Path {
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  private static extern uint GetLongPathName(string shortPath, StringBuilder longPath, uint longPathLength);

  public static string ToLongPath(string path) {
    if (string.IsNullOrWhiteSpace(path)) return path;
    var sb = new StringBuilder(32768);
    uint res = GetLongPathName(path, sb, (uint)sb.Capacity);
    if (res == 0) return path;
    return sb.ToString();
  }
}
"@
}

function Get-LongFullPath([string]$path) {
  $resolved = (Resolve-Path -LiteralPath $path).Path
  return [Win32Path]::ToLongPath($resolved)
}

function Assert-Command([string]$Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Required command not found: $Name. Please install it and retry."
  }
}

function Get-RepoRoot {
  # Assume script lives under <repo>/scripts/
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Normalize-Name([string]$s) {
  return ($s -replace '[^a-zA-Z0-9-]', '-').Trim('-').ToLowerInvariant()
}

function Get-StorageAccountName([string]$prefix) {
  $p = ($prefix -replace '[^a-zA-Z0-9]', '').ToLowerInvariant()
  if ($p.Length -lt 3) { $p = "parkeat" }
  $name = ($p + "web").ToLowerInvariant()
  if ($name.Length -gt 24) { $name = $name.Substring(0,24) }
  if ($name.Length -lt 3) { $name = ($name + "abc").Substring(0,3) }
  return $name
}

function Read-DotEnv([string]$envPath) {
  $map = @{}
  if (-not (Test-Path $envPath)) { return $map }

  Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith('#')) { return }

    # KEY=VALUE (no export)
    $m = [regex]::Match($line, '^(?<k>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<v>.*)$')
    if (-not $m.Success) { return }

    $k = $m.Groups['k'].Value
    $v = $m.Groups['v'].Value

    # Strip surrounding quotes
    if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
      $v = $v.Substring(1, $v.Length - 2)
    }

    $map[$k] = $v
  }

  return $map
}

function Copy-BackendToStaging([string]$backendPath, [string]$stagingPath) {
  if (Test-Path $stagingPath) { Remove-Item -Recurse -Force $stagingPath }
  New-Item -ItemType Directory -Path $stagingPath | Out-Null

  # Copy file-by-file so we can reliably exclude folders (robocopy arg handling can be brittle in scripts)
  $excludeDirNames = @('node_modules', 'var', '.git')
  $excludeFileNames = @('.env')

  $backendPath = Get-LongFullPath $backendPath
  $backendPrefix = $backendPath.TrimEnd([char]'\', [char]'/') + '\'

  $files = Get-ChildItem -Path $backendPath -Recurse -Force -File
  foreach ($file in $files) {
    $filePath = Get-LongFullPath $file.FullName
    if (-not $filePath.StartsWith($backendPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Unexpected path while staging backend files. Base='$backendPrefix' File='$filePath'"
    }

    $relative = $filePath.Substring($backendPrefix.Length)
    if ([string]::IsNullOrWhiteSpace($relative)) { continue }

    $parts = $relative -split '[\\/]'
    if ($parts | Where-Object { $_ -in $excludeDirNames }) { continue }
    if ($excludeFileNames -contains $file.Name) { continue }

    $dest = Join-Path $stagingPath $relative
    $destDir = Split-Path -Path $dest -Parent
    if (-not (Test-Path $destDir)) {
      New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item -Path $file.FullName -Destination $dest -Force
  }
}

function New-ZipFromDirectory([string]$sourceDir, [string]$zipPath) {
  if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $sourceDir = Get-LongFullPath $sourceDir
  $sourcePrefix = $sourceDir.TrimEnd([char]'\', [char]'/') + '\'
  $zipDir = Split-Path -Parent $zipPath
  if (-not (Test-Path $zipDir)) { New-Item -ItemType Directory -Path $zipDir -Force | Out-Null }

  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    $files = Get-ChildItem -Path $sourceDir -Recurse -Force -File
    foreach ($file in $files) {
      # Normalize to long path so relative path calculation is stable
      $filePath = Get-LongFullPath $file.FullName
      if (-not $filePath.StartsWith($sourcePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unexpected path while zipping. Base='$sourcePrefix' File='$filePath'"
      }

      $relative = $filePath.Substring($sourcePrefix.Length)
      if ([string]::IsNullOrWhiteSpace($relative)) { continue }

      # Normalize to forward slashes so Linux App Service can resolve paths correctly.
      $entryName = ($relative -replace '\\', '/')

      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $filePath, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
  } finally {
    $zip.Dispose()
  }
}

function Assert-ZipHasEntries([string]$zipPath, [string[]]$requiredEntries) {
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $names = @{}
    foreach ($e in $zip.Entries) {
      # Compare in a case-sensitive-ish way (Linux), but also tolerate case from Windows zip tools.
      $names[$e.FullName] = $true
    }

    foreach ($req in $requiredEntries) {
      if (-not $names.ContainsKey($req)) {
        $sample = ($zip.Entries | Select-Object -First 25 -ExpandProperty FullName) -join ', '
        throw "Deployment zip is missing '$req'. This would cause App Service to fail at runtime. Sample entries: $sample"
      }
    }
  } finally {
    $zip.Dispose()
  }
}

Assert-Command az
Assert-Command npm
Assert-Command node

$repoRoot = Get-RepoRoot
$backendPath = Join-Path $repoRoot 'backend'
$frontendPath = Join-Path $repoRoot 'frontend'

if (-not (Test-Path $backendPath)) { throw "Missing backend folder at $backendPath" }
if (-not (Test-Path $frontendPath)) { throw "Missing frontend folder at $frontendPath" }

# Ensure logged in
try {
  $null = az account show --output none 2>$null
} catch {
  Write-Info "Not logged in to Azure yet. Opening interactive login..."
  az login --output none | Out-Null
}

if ($Destroy -and $Reset) {
  throw "Use either -Destroy or -Reset (not both)."
}

if ($Destroy -or $Reset) {
  if (-not $Force) {
    Write-Warn "You are about to delete resource group '$ResourceGroup' (this deletes ALL resources inside it)."
    $confirm = Read-Host "Type DELETE to confirm"
    if ($confirm -ne 'DELETE') {
      throw "Aborted by user."
    }
  }

  Write-Info "Deleting resource group '$ResourceGroup'..."
  az group delete -n $ResourceGroup --yes --output none | Out-Null

  if ($Destroy) {
    Write-Host "==== Destroy complete ===="
    Write-Host "Deleted resource group: $ResourceGroup"
    exit 0
  }
}

if ($BackendName) {
  $backendAppName = Normalize-Name $BackendName
} else {
  $backendAppName = Normalize-Name "$NamePrefix-api"
}

if ($PlanName) {
  $planName = Normalize-Name $PlanName
} else {
  $planName = Normalize-Name "$NamePrefix-plan"
}

if ($StorageAccountName) {
  $storageName = ($StorageAccountName -replace '[^a-zA-Z0-9]', '').ToLowerInvariant()
  if ($storageName.Length -gt 24) { $storageName = $storageName.Substring(0,24) }
  if ($storageName.Length -lt 3) { $storageName = ($storageName + "abc").Substring(0,3) }
} else {
  $storageName = Get-StorageAccountName $NamePrefix
}

Write-Info "Repo root: $repoRoot"
Write-Info "Resource group: $ResourceGroup ($Location)"
Write-Info "Backend web app: $backendAppName (SKU $BackendSku, Runtime $BackendRuntime)"
Write-Info "Frontend storage account: $storageName"

Write-Info "Creating (or updating) resource group..."
az group create -n $ResourceGroup -l $Location --output none | Out-Null

$backendUrl = "https://$backendAppName.azurewebsites.net"

if (-not $SkipBackend) {
  Write-Info "Creating App Service plan (Linux) + Web App..."
  # NOTE: Free tier (F1) is typically not available for Linux; B1 is the safer default.
  az appservice plan create -g $ResourceGroup -n $planName --is-linux --sku $BackendSku --output none | Out-Null

  # Runtime strings are based on: az webapp list-runtimes --os linux
  az webapp create -g $ResourceGroup -p $planName -n $backendAppName --runtime $BackendRuntime --output none | Out-Null

  $settings = @(
    "NODE_ENV=production"
  )

  if (-not $SkipBackendEnv) {
    $envFile = Join-Path $backendPath '.env'
    $envMap = Read-DotEnv $envFile

    foreach ($k in $envMap.Keys) {
      if ($k -in @('PORT','CORS_ORIGIN','NODE_ENV')) { continue }
      $val = $envMap[$k]
      if ([string]::IsNullOrWhiteSpace($val)) { continue }
      $settings += ("$k=$val")
    }
  }

  # Apply settings (CORS set later after frontend is deployed)
  if ($settings.Count -gt 0) {
    Write-Info "Configuring backend app settings..."
    az webapp config appsettings set -g $ResourceGroup -n $backendAppName --settings @settings --output none | Out-Null
  }

  Write-Info "Preparing backend zip for deployment (excluding node_modules and .env)..."
  $staging = Join-Path $env:TEMP "parkeat-backend"
  Copy-BackendToStaging -backendPath $backendPath -stagingPath $staging

  Write-Info "Installing production dependencies in staging area..."
  Push-Location $staging
  # Relax error preference: npm writes deprecation warnings to stderr which PS 5.1
  # wraps into NativeCommandError records, causing Stop mode to halt the script.
  $ErrorActionPreference = 'Continue'
  try {
    npm install --omit=dev --loglevel=error
  } finally {
    Pop-Location
    $ErrorActionPreference = 'Stop'
  }

  $zipPath = Join-Path $env:TEMP "parkeat-backend.zip"
  New-ZipFromDirectory -sourceDir $staging -zipPath $zipPath
  Assert-ZipHasEntries -zipPath $zipPath -requiredEntries @('server.js','src/app.js','node_modules/express/index.js')

  Write-Info "Deploying backend via zip deploy..."
  # Set explicit startup command so Azure doesn't fall back to default-static-site.js
  az webapp config set -g $ResourceGroup -n $backendAppName --startup-file "node server.js" --output none | Out-Null

  # Use publishing credentials (basic auth) for Kudu zip deploy.
  # az webapp deploy and az webapp deployment source config-zip both require an
  # appservice.azure.com-scoped OAuth token that conditional access may block.
  # Publishing credentials come from the ARM API (management.azure.com) — no extra
  # scope needed — and Kudu accepts them as HTTP Basic auth on its REST endpoint.
  #
  # Basic auth to the SCM endpoint is disabled by default on new App Service instances;
  # enable it first via an ARM sub-resource update (uses only management.azure.com token).
  Write-Info "Enabling basic auth on SCM endpoint..."
  az resource update -g $ResourceGroup `
      --name "$backendAppName/basicPublishingCredentialsPolicies/scm" `
      --resource-type "Microsoft.Web/sites/basicPublishingCredentialsPolicies" `
      --set properties.allow=true --output none | Out-Null

  Write-Info "Fetching publishing credentials..."
  $pubCredsJson = az webapp deployment list-publishing-credentials -g $ResourceGroup -n $backendAppName -o json
  $pubCreds = $pubCredsJson | ConvertFrom-Json
  $kuduAuth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$($pubCreds.publishingUserName):$($pubCreds.publishingPassword)"))
  $kuduUri = "https://$backendAppName.scm.azurewebsites.net/api/zipdeploy"
  Write-Info "Uploading zip to Kudu ($kuduUri)..."
  $null = Invoke-WebRequest -Uri $kuduUri -Method POST `
      -Headers @{ Authorization = "Basic $kuduAuth" } `
      -InFile $zipPath -ContentType "application/zip" -UseBasicParsing
  Write-Info "Zip uploaded. Waiting 20 s for extraction to complete..."
  Start-Sleep -Seconds 20

  Write-Info "Backend deployed: $backendUrl"
}

$frontendUrl = $null

if (-not $SkipFrontend) {
  Write-Info "Building frontend (Vite) with VITE_API_URL=$backendUrl ..."

  Push-Location $frontendPath
  try {
    $env:VITE_API_URL = $backendUrl
    npm install | Out-Host
    npm run build | Out-Host
  } finally {
    Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
    Pop-Location
  }

  $distPath = Join-Path $frontendPath 'dist'
  if (-not (Test-Path $distPath)) {
    throw "Frontend build output not found at $distPath"
  }

  Write-Info "Creating storage account + enabling static website hosting..."
  az storage account create -g $ResourceGroup -n $storageName -l $Location --sku Standard_LRS --kind StorageV2 --output none | Out-Null
  az storage blob service-properties update --account-name $storageName --static-website --index-document index.html --404-document index.html --output none | Out-Null

  $frontendUrl = (az storage account show -g $ResourceGroup -n $storageName --query "primaryEndpoints.web" -o tsv).Trim()
  if ($frontendUrl.EndsWith('/')) { $frontendUrl = $frontendUrl.Substring(0, $frontendUrl.Length - 1) }

  Write-Info "Uploading frontend assets to static website..."
  # Use account key auth — avoids needing storage.azure.com or graph.microsoft.com tokens,
  # which conditional access policies may block when using a shared/student tenant.
  $storageKey = (az storage account keys list -g $ResourceGroup -n $storageName --query "[0].value" -o tsv).Trim()
  az storage blob upload-batch --account-name $storageName --account-key $storageKey -d '$web' -s $distPath --overwrite true --output none | Out-Null

  Write-Info "Frontend deployed: $frontendUrl"
}

if (-not $SkipBackend -and $frontendUrl) {
  Write-Info "Configuring backend CORS_ORIGIN + FRONTEND_URL..."
  az webapp config appsettings set -g $ResourceGroup -n $backendAppName --settings "CORS_ORIGIN=$frontendUrl" "FRONTEND_URL=$frontendUrl" --output none | Out-Null
  az webapp restart -g $ResourceGroup -n $backendAppName --output none | Out-Null
}

Write-Host ""
Write-Host "==== Deployment complete ===="
Write-Host "Backend:  $backendUrl"
if ($frontendUrl) { Write-Host "Frontend: $frontendUrl" }
Write-Host "Health:   $backendUrl/health"
Write-Host ""
Write-Host "If /api/agents or /api/payments fail, set GROQ/Stripe secrets in App Settings:"
Write-Host "  az webapp config appsettings set -g $ResourceGroup -n $backendAppName --settings GROQ_API_KEY=... STRIPE_SECRET_KEY=..."
