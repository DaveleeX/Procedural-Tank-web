# Windows entry that calls the shared serve.py (same as serve.sh on macOS).
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8124 -NoBrowser
param(
  [int]$Port = 8123,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
$serve = Join-Path $PSScriptRoot "serve.py"

$extra = @("--port", "$Port")
if ($NoBrowser) { $extra += "--no-browser" }

if (Get-Command python -ErrorAction SilentlyContinue) {
  & python $serve @extra
  exit $LASTEXITCODE
}
if (Get-Command py -ErrorAction SilentlyContinue) {
  & py -3 $serve @extra
  exit $LASTEXITCODE
}
if (Get-Command python3 -ErrorAction SilentlyContinue) {
  & python3 $serve @extra
  exit $LASTEXITCODE
}

Write-Host "Need Python 3 on PATH."
Write-Host "Install from https://www.python.org/downloads/ and tick 'Add python.exe to PATH'."
exit 1
