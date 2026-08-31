param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [string]$Phase = "phase-00"
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

if (-not (Get-Command agent -ErrorAction SilentlyContinue)) {
  throw "Cursor Agent CLI was not found. Install it and run 'agent auth' before this script."
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

$cliOutput = Join-Path $runDir "cli-result.json"
$normalizedOutput = Join-Path $runDir "review.json"
$errorLog = Join-Path $runDir "stderr.log"

# Ask mode is the read-only Cursor mode. Running from RepoRoot supplies workspace context.
& agent --mode=ask -p $prompt --output-format json 1> $cliOutput 2> $errorLog
if ($LASTEXITCODE -ne 0) {
  throw "Cursor review exited with code $LASTEXITCODE. See $errorLog"
}

$after = (git status --porcelain) -join "`n"
if ($after -ne $before) {
  throw "Cursor review changed the working tree. Treat the review as invalid and inspect git status."
}

$outer = Get-Content $cliOutput -Raw | ConvertFrom-Json
$review = $null

if ($outer.PSObject.Properties.Name -contains "verdict") {
  $review = $outer
} elseif ($outer.PSObject.Properties.Name -contains "result") {
  $text = [string]$outer.result
  $text = $text -replace '^\s*```(?:json)?\s*', '' -replace '\s*```\s*$', ''
  try {
    $review = $text | ConvertFrom-Json
  } catch {
    $first = $text.IndexOf('{')
    $last = $text.LastIndexOf('}')
    if ($first -ge 0 -and $last -gt $first) {
      $review = $text.Substring($first, $last - $first + 1) | ConvertFrom-Json
    } else {
      throw "Cursor returned no parseable review JSON. See $cliOutput"
    }
  }
}

if (-not $review -or -not ($review.PSObject.Properties.Name -contains "verdict")) {
  throw "Cursor output did not contain a verdict. See $cliOutput"
}

$review | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 $normalizedOutput
Write-Host "Cursor read-only review completed: $normalizedOutput"
