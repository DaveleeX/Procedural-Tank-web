# Windows Quick Start — Codex + Cursor + QoderWork

This guide starts the active Phase 0 task on Windows. It does not pretend that all later phases already exist.

## What is already prepared

- Branch: `feat/codex-cursor-qoder-loop`
- Draft PR: `#1`
- Codex task: GitHub issue `#2`
- Active specification: `tasks/00-baseline.md`
- Role rules: `AGENTS.md`
- Roadmap: `tasks/ROADMAP.md`

## 1. Checkout the prepared branch

From an existing clone:

```powershell
cd D:\YOUR_PATH\Procedural-Tank-web
git fetch origin
git switch feat/codex-cursor-qoder-loop
git pull --ff-only
```

For a fresh clone:

```powershell
git clone https://github.com/DaveleeX/Procedural-Tank-web.git
cd Procedural-Tank-web
git switch feat/codex-cursor-qoder-loop
```

Do not run the loop on `main`.

## 2. Install and authenticate Codex

```powershell
npm i -g @openai/codex
codex --version
codex
```

Complete the ChatGPT sign-in flow in the first interactive Codex session, then exit it. The repository's `AGENTS.md` and active task are injected by the runner.

## 3. Install and authenticate Cursor Agent CLI

```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent --version
agent auth
```

Cursor is invoked only with `--mode=ask`. The wrapper also checks `git status` before and after the review and rejects any review that writes files.

## 4. Open the folder in QoderWork

In QoderWork:

1. Create a task using **Work in a Folder**.
2. Select the local `Procedural-Tank-web` folder on this branch.
3. Ask QoderWork to read `qoder.md` and `agents/prompts/qoderwork-orchestrator.md`.
4. Tell it to monitor `.tools-cache/agent-loop/phase-00-state.json` and, after Codex starts, `runs/phase-00/state.json`.
5. Do not allow QoderWork to modify production source files.

QoderWork is a monitor and high-level gate during Phase 0. The real MCP control surface is deliberately scheduled for Phase 5, after evaluator and rollback logic exist.

## 5. Check prerequisites

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-agent-prereqs.ps1
```

The check requires:

- a non-`main` branch;
- Git;
- Node.js 20 or newer;
- npm;
- Python 3;
- authenticated Codex CLI;
- authenticated Cursor Agent CLI.

QoderWork desktop availability is confirmed by opening the folder because it does not expose a reliable local executable check for this workflow.

## 6. Start Phase 0 with one command

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-phase0-pipeline.ps1
```

The command performs this exact chain:

```text
prerequisite check
→ Codex implements tasks/00-baseline.md
→ Phase 0 write-path allowlist check
→ npm run verify:phase0
→ Cursor Ask-mode read-only review
→ second allowlist check
→ PHASE0_ACCEPTED or a fail-closed terminal state
```

It never merges the pull request, lowers thresholds, edits references, or starts Phase 1.

## 7. Read the result

Primary status:

```text
runs/phase-00/state.json
```

Agent and test evidence:

```text
runs/phase-00/codex/events.jsonl
runs/phase-00/codex/last-message.md
runs/phase-00/verification/stdout.log
runs/phase-00/verification/stderr.log
runs/phase-00/cursor/cli-result.json
runs/phase-00/cursor/review.json
runs/phase-00/evidence/*
```

Possible Phase 0 results:

- `PHASE0_ACCEPTED` — the baseline command and Cursor gate passed.
- `CURSOR_REJECTED` — Cursor found a blocking issue or insufficient tests.
- `FAILED_INFRASTRUCTURE` — an installation, authentication, build, browser, or CLI problem stopped the pipeline.

## 8. What happens after Phase 0

Do not call Codex repeatedly without an evaluator. Advance one phase at a time:

1. Shared Tiger I candidate specification.
2. Deterministic silhouette evaluator.
3. Bounded parameter optimizer.
4. Codex/Cursor worktree revision and rollback loop.
5. QoderWork MCP control surface.
6. Web product integration.

The full self-cycle exists only after Phases 4 and 5. Before that, the pipeline is intentionally bounded and phase-gated so three agents cannot rewrite the same code or approve their own work.
