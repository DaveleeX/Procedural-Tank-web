param(
  [Parameter(Mandatory=$false)][string]$Repo,
  [Parameter(Mandatory=$false)][string]$Target = "procedural-cad-workspace",
  [Parameter(Mandatory=$false)][ValidateSet("codex","claude","opencode","")][string]$Agent = "",
  [Parameter(Mandatory=$false)][string]$ForgeCADVersion = "latest",
  [Parameter(Mandatory=$false)][switch]$SkipRun,
  [Parameter(Mandatory=$false)][switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
  Write-Output "bootstrap.ps1 -Repo <git-url> [-Target <folder>] [-Agent codex|claude|opencode] [-ForgeCADVersion <version>] [-SkipRun]"
  exit 0
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "Node.js/npm is required. Install Node.js LTS, then rerun this bootstrap."
}

$targetParent = Split-Path -Parent $Target
$targetLeaf = Split-Path -Leaf $Target
if (-not $targetParent) { $targetParent = "." }
New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
$resolvedParent = (Resolve-Path -LiteralPath $targetParent).Path
$targetPath = Join-Path $resolvedParent $targetLeaf
if ($Repo) {
  if (Test-Path -LiteralPath (Join-Path $targetPath ".git")) {
    & git -C $targetPath pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw "Git pull failed." }
  } elseif (Test-Path -LiteralPath $targetPath) {
    $entries = Get-ChildItem -LiteralPath $targetPath -Force
    if ($entries.Count -gt 0) { throw "Target exists and is not an empty Git checkout: $targetPath" }
    & git clone --depth 1 $Repo $targetPath
    if ($LASTEXITCODE -ne 0) { throw "Git clone failed." }
  } else {
    & git clone --depth 1 $Repo $targetPath
    if ($LASTEXITCODE -ne 0) { throw "Git clone failed." }
  }
} elseif (-not (Test-Path -LiteralPath $targetPath)) {
  New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
}

$toolsPath = Join-Path $targetPath ".tools"
New-Item -ItemType Directory -Path $toolsPath -Force | Out-Null
& npm.cmd install --prefix $toolsPath "forgecad@$ForgeCADVersion" --no-audit --no-fund --fetch-retries=2 --fetch-timeout=60000
if ($LASTEXITCODE -ne 0) { throw "Local ForgeCAD installation failed." }

$forgecad = Join-Path $toolsPath "node_modules\.bin\forgecad.cmd"
if (-not (Test-Path -LiteralPath $forgecad)) { throw "ForgeCAD executable was not installed: $forgecad" }

$statePath = Join-Path $targetPath ".bootstrap"
New-Item -ItemType Directory -Path $statePath -Force | Out-Null
Set-Content -LiteralPath (Join-Path $statePath "forgecad-path.txt") -Value $forgecad -Encoding UTF8

if ($Agent) {
  & $forgecad skill install --target $Agent
  if ($LASTEXITCODE -ne 0) { throw "ForgeCAD skill installation failed for $Agent." }
}

$main = Join-Path $targetPath "main.forge.js"
if (-not $SkipRun) {
  if (-not (Test-Path -LiteralPath $main)) { throw "Project downloaded, but main.forge.js is missing: $main" }
  & $forgecad run $main --quality live
  if ($LASTEXITCODE -ne 0) { throw "ForgeCAD project validation failed." }
}

Write-Output "BOOTSTRAP READY"
Write-Output "PROJECT=$targetPath"
Write-Output "FORGECAD=$forgecad"
