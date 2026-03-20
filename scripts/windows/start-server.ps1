#!/usr/bin/env pwsh
# GrandStay Hotel - Start the full-stack app in a new PowerShell window

$port = 5001
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$backendPath = Join-Path $projectRoot 'backend'

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GrandStay Hotel - Server Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host "[OK] GrandStay is already running on http://localhost:$port" -ForegroundColor Green
    Start-Process "http://localhost:$port"
    exit 0
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not available in PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $backendPath 'node_modules'))) {
    Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $projectRoot
    npm --prefix backend install
    $installExitCode = $LASTEXITCODE
    Pop-Location

    if ($installExitCode -ne 0) {
        Write-Host "[ERROR] Failed to install backend dependencies." -ForegroundColor Red
        exit $installExitCode
    }
}

Write-Host "[INFO] Starting backend from $backendPath using TypeScript runtime" -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $projectRoot -ArgumentList @(
    '-NoExit',
    '-Command',
    'npm --prefix backend start'
)

Start-Sleep -Seconds 2
Write-Host "[SUCCESS] GrandStay is starting." -ForegroundColor Green
Write-Host "Website: http://localhost:$port" -ForegroundColor Yellow
Start-Process "http://localhost:$port"
