param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
  throw "Codex CLI was not found. Install/sign in before running this script."
}

$branch = (git branch --show-current).Trim()
if ($branch -eq "main" -or [string]::IsNullOrWhiteSpace($branch)) {
  throw "Run Phase 0 on a dedicated branch/worktree, not main."
}

if (-not $AllowDirty) {
  $dirty = git status --porcelain
  if ($dirty) {
    throw "Working tree is not clean. Commit/stash changes or pass -AllowDirty deliberately."
  }
}

$runDir = Join-Path $RepoRoot "runs/phase-00/codex"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$rules = Get-Content (Join-Path $RepoRoot "AGENTS.md") -Raw
$task = Get-Content (Join-Path $RepoRoot "tasks/00-baseline.md") -Raw
$prompt = @"
You are the Codex Builder for DaveleeX/Procedural-Tank-web.

Follow the repository rules and implement only the active task.
Do not modify protected files. Do not start a later roadmap phase.
Inspect the existing code before editing, make the smallest coherent change,
run every required command, and leave the worktree in a reviewable state.

=== REPOSITORY RULES ===
$rules

=== ACTIVE TASK ===
$task
"@

$events = Join-Path $runDir "events.jsonl"
$stderr = Join-Path $runDir "stderr.log"
$last = Join-Path $runDir "last-message.md"

$prompt | & codex exec --sandbox workspace-write --json --output-last-message $last - 1> $events 2> $stderr
if ($LASTEXITCODE -ne 0) {
  throw "Codex exited with code $LASTEXITCODE. See $stderr"
}

Write-Host "Codex Phase 0 completed."
Write-Host "Events: $events"
Write-Host "Summary: $last"
Write-Host "Next: inspect the diff, run npm run verify:phase0, then scripts/run-cursor-review.ps1"
