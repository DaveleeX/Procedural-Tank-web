param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [string]$Phase = "phase-00"
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

if (-not (Get-Command agent -ErrorAction SilentlyContinue)) {
  throw "Cursor Agent CLI was not found. Install/sign in before running this script."
}

$runDir = Join-Path $RepoRoot "runs/$Phase/cursor"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$before = (git status --porcelain) -join "`n"
$reviewPrompt = Get-Content (Join-Path $RepoRoot "agents/prompts/cursor-phase-review.md") -Raw
$prompt = @"
$reviewPrompt

Active phase: $Phase
Active task: tasks/00-baseline.md
Current repository root: $RepoRoot
Write no files. Return JSON only.
"@

$output = Join-Path $runDir "review.json"
$errorLog = Join-Path $runDir "stderr.log"

& agent -p --mode=ask --output-format json --workspace $RepoRoot --trust $prompt 1> $output 2> $errorLog
if ($LASTEXITCODE -ne 0) {
  throw "Cursor review exited with code $LASTEXITCODE. See $errorLog"
}

$after = (git status --porcelain) -join "`n"
if ($after -ne $before) {
  throw "Cursor review changed the working tree. Treat the review as invalid and inspect git status."
}

Write-Host "Cursor read-only review completed: $output"
