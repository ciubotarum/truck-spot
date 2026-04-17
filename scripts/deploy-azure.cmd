@echo off
setlocal

REM Simple wrapper so you can run from cmd.exe
REM Usage:
REM   scripts\deploy-azure.cmd
REM   scripts\deploy-azure.cmd -Location westeurope -ResourceGroup truckspot-rg -NamePrefix truckspot

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-azure.ps1" %*
