param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

function Require-Command([string]$Name, [string]$InstallHint) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Missing command '$Name'. $InstallHint"
  }
  return $cmd.Source
}

$checks = [ordered]@{}
$checks.git = Require-Command "git" "Install Git for Windows."
$checks.node = Require-Command "node" "Install Node.js 20 or newer."
$checks.npm = Require-Command "npm" "Install Node.js 20 or newer."
$checks.codex = Require-Command "codex" "Run: npm i -g @openai/codex"
$checks.cursorAgent = Require-Command "agent" "Run: irm 'https://cursor.com/install?win32=true' | iex"

$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) {
  $checks.python = $python.Source
  $checks.pythonCommand = "py -3"
} else {
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) {
    throw "Python 3 was not found. Install Python for Windows and enable PATH/py launcher."
  }
  $checks.python = $python.Source
  $checks.pythonCommand = "python"
}

$nodeVersion = (& node --version).Trim().TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 20) {
  throw "Node.js $nodeVersion is too old. Install Node.js 20 or newer."
}
$checks.nodeVersion = $nodeVersion
$checks.codexVersion = (& codex --version 2>&1 | Select-Object -First 1).ToString().Trim()
$checks.cursorVersion = (& agent --version 2>&1 | Select-Object -First 1).ToString().Trim()

$branch = (git branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($branch) -or $branch -eq "main") {
  throw "Checkout feat/codex-cursor-qoder-loop or another dedicated worktree branch; never run the loop on main."
}
$checks.branch = $branch
$checks.head = (git rev-parse HEAD).Trim()
$checks.origin = (git remote get-url origin).Trim()

$cacheDir = Join-Path $RepoRoot ".tools-cache/agent-loop"
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
$checks | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $cacheDir "prerequisites.json")

Write-Host "Agent prerequisites are available."
Write-Host "Branch: $branch"
Write-Host "Node: $nodeVersion"
Write-Host "Codex: $($checks.codexVersion)"
Write-Host "Cursor: $($checks.cursorVersion)"
Write-Host "QoderWork desktop is verified manually by opening this folder; its MCP connection is added in Phase 5."
