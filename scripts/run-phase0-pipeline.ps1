param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [switch]$SkipCodex,
  [switch]$SkipCursor
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

$phase = "phase-00"
$cacheDir = Join-Path $RepoRoot ".tools-cache/agent-loop"
$runDir = Join-Path $RepoRoot "runs/$phase"
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
$startSha = (git rev-parse HEAD).Trim()

function Write-RunState([string]$State, [hashtable]$Details = @{}, [switch]$Publish) {
  $record = [ordered]@{
    schemaVersion = 1
    phase = $phase
    state = $State
    branch = (git branch --show-current).Trim()
    startSha = $startSha
    headSha = (git rev-parse HEAD).Trim()
    updatedAt = (Get-Date).ToUniversalTime().ToString("o")
    details = $Details
  }
  $json = $record | ConvertTo-Json -Depth 20
  $json | Set-Content -Encoding utf8 (Join-Path $cacheDir "$phase-state.json")
  if ($Publish) {
    New-Item -ItemType Directory -Force -Path $runDir | Out-Null
    $json | Set-Content -Encoding utf8 (Join-Path $runDir "state.json")
  }
  Write-Host "[$phase] $State"
}

function Get-ChangedPaths {
  $paths = @()
  $paths += git diff --name-only $startSha HEAD
  $paths += git diff --name-only
  $paths += git ls-files --others --exclude-standard
  return @($paths | Where-Object { $_ } | ForEach-Object { $_.Trim().Replace('\\', '/') } | Sort-Object -Unique)
}

function Assert-Phase0Paths {
  $allowed = @(
    "package.json",
    "package-lock.json",
    "playwright.config.mjs",
    "tests/*",
    "tools/baseline/*",
    "scripts/*",
    "runs/*",
    "README.md"
  )
  $invalid = @()
  foreach ($path in (Get-ChangedPaths)) {
    $ok = $false
    foreach ($pattern in $allowed) {
      if ($path -like $pattern) { $ok = $true; break }
    }
    if (-not $ok) { $invalid += $path }
  }
  if ($invalid.Count -gt 0) {
    throw "Phase 0 changed forbidden paths: $($invalid -join ', ')"
  }
}

try {
  Write-RunState "CHECKING_PREREQUISITES"
  & (Join-Path $RepoRoot "scripts/check-agent-prereqs.ps1") -RepoRoot $RepoRoot

  if (-not $SkipCodex) {
    Write-RunState "CODEX_REVISING"
    & (Join-Path $RepoRoot "scripts/run-phase0-codex.ps1") -RepoRoot $RepoRoot
  }

  Assert-Phase0Paths
  Write-RunState "VERIFYING" @{ command = "npm run verify:phase0" } -Publish

  if (-not (Test-Path (Join-Path $RepoRoot "package.json"))) {
    throw "Codex did not create package.json; Phase 0 cannot be verified."
  }

  $verifyDir = Join-Path $runDir "verification"
  New-Item -ItemType Directory -Force -Path $verifyDir | Out-Null
  $stdout = Join-Path $verifyDir "stdout.log"
  $stderr = Join-Path $verifyDir "stderr.log"
  & npm run verify:phase0 1> $stdout 2> $stderr
  $verifyExit = $LASTEXITCODE
  if ($verifyExit -ne 0) {
    throw "npm run verify:phase0 failed with exit code $verifyExit. See $stderr"
  }

  Assert-Phase0Paths

  if (-not $SkipCursor) {
    Write-RunState "CURSOR_FINAL_REVIEW" @{ verifyExitCode = $verifyExit } -Publish
    & (Join-Path $RepoRoot "scripts/run-cursor-review.ps1") -RepoRoot $RepoRoot -Phase $phase
  }

  $reviewPath = Join-Path $runDir "cursor/review.json"
  if (-not (Test-Path $reviewPath)) {
    throw "No normalized Cursor review was found at $reviewPath"
  }

  $review = Get-Content $reviewPath -Raw | ConvertFrom-Json
  $verdict = [string]$review.verdict
  $protectedChanged = [bool]$review.protectedFilesChanged
  $testsSufficient = [bool]$review.testsSufficient

  if ($verdict -eq "fail" -or $protectedChanged -or -not $testsSufficient) {
    Write-RunState "CURSOR_REJECTED" @{
      verdict = $verdict
      protectedFilesChanged = $protectedChanged
      testsSufficient = $testsSufficient
      review = "runs/$phase/cursor/review.json"
    } -Publish
    exit 2
  }

  Assert-Phase0Paths
  Write-RunState "PHASE0_ACCEPTED" @{
    verifyExitCode = $verifyExit
    cursorVerdict = $verdict
    review = "runs/$phase/cursor/review.json"
    nextTask = "Human/QoderWork may inspect the evidence; do not start Phase 1 until ROADMAP is advanced."
  } -Publish

  Write-Host "Phase 0 passed its deterministic command and Cursor read-only gate."
  Write-Host "State: runs/$phase/state.json"
  Write-Host "This does not merge the PR or start Phase 1 automatically."
} catch {
  $message = $_.Exception.Message
  $publish = Test-Path $runDir
  Write-RunState "FAILED_INFRASTRUCTURE" @{ error = $message } -Publish:$publish
  Write-Error $message
  exit 1
}
