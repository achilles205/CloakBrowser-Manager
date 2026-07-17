param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8080,
    [switch]$Install
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

if ($env:OS -ne "Windows_NT") {
    throw "run-windows.ps1 is intended for native Windows. Use Docker on Linux/macOS."
}

$venvDir = Join-Path $PSScriptRoot ".venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"
$createdVenv = $false

if (-not (Test-Path -LiteralPath $venvPython)) {
    $python = Get-Command "py" -ErrorAction SilentlyContinue
    if ($python) {
        & $python.Source -3 -m venv $venvDir
    } else {
        $python = Get-Command "python" -ErrorAction SilentlyContinue
        if (-not $python) {
            throw "Python 3.12 is required. Install it from python.org and run this script again."
        }
        & $python.Source -m venv $venvDir
    }
    $createdVenv = $true
}

if ($createdVenv -or $Install) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r (Join-Path $PSScriptRoot "backend\requirements.txt")

    Write-Host "Downloading the CloakBrowser binary..." -ForegroundColor Cyan
    & $venvPython -c "from cloakbrowser.download import ensure_binary; ensure_binary()"
}

$frontendDir = Join-Path $PSScriptRoot "frontend"
$frontendDist = Join-Path $frontendDir "dist\index.html"
if ($Install -or -not (Test-Path -LiteralPath $frontendDist)) {
    $npm = Get-Command "npm" -ErrorAction SilentlyContinue
    if (-not $npm) {
        throw "Node.js 20+ is required to build the dashboard. Install it and run this script again."
    }

    Write-Host "Building the dashboard..." -ForegroundColor Cyan
    Push-Location $frontendDir
    try {
        & $npm.Source ci
        & $npm.Source run build
    } finally {
        Pop-Location
    }
}

$env:CLOAK_VIEW_MODE = "native"

Write-Host ""
Write-Host "CloakBrowser Manager is starting in native Windows mode." -ForegroundColor Green
Write-Host "Dashboard: http://localhost:$Port"
if ($env:CLOAK_DATA_DIR) {
    Write-Host "Data: $env:CLOAK_DATA_DIR"
} else {
    Write-Host "Data: $env:LOCALAPPDATA\CloakBrowser Manager"
}
Write-Host "Browser profiles will open as normal Windows desktop windows."
Write-Host ""

& $venvPython -m uvicorn backend.main:app --host 127.0.0.1 --port $Port --loop asyncio
