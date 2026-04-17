# Deploy to Azure (CLI / Student-friendly)

This project deploys cleanly without GitHub Actions by using:
- **Backend**: Azure App Service (Linux) + zip deploy
- **Frontend**: Azure Storage Static Website + blob upload

## Prereqs
- Azure CLI (`az`)
- Node.js + npm
- Logged in: `az login`

## One-command deploy (Windows)
From the repo root:

- CMD:
  - `scripts\deploy-azure.cmd`

- PowerShell:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-azure.ps1`

## Common options
- Change region / RG / naming:
  - `scripts\deploy-azure.cmd -Location westeurope -ResourceGroup truckspot-rg -NamePrefix truckspot`

- Delete everything in the resource group and redeploy cleanly:
  - `scripts\deploy-azure.cmd -Reset -Force`

- Destroy resources only (no redeploy):
  - `scripts\deploy-azure.cmd -Destroy -Force`

- Avoid copying secrets from `backend/.env` into Azure App Settings:
  - `scripts\deploy-azure.cmd -SkipBackendEnv`

- Use a different backend SKU (default is `B1`):
  - `scripts\deploy-azure.cmd -BackendSku B1`

## After deploy
The script prints:
- Backend URL and `/health`
- Frontend URL

If the backend can’t start, the script now fails early if the backend zip is missing `server.js` or `src/app.js`.

If AI/payments endpoints fail, set secrets in the Web App settings:
- `az webapp config appsettings set -g <rg> -n <app> --settings GROQ_API_KEY=... STRIPE_SECRET_KEY=...`
