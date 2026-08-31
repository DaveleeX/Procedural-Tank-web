# Procedural Tank Multi-Agent Rules

This repository uses three AI roles only:

- **Codex — Builder:** the only agent allowed to modify production code.
- **Cursor — Reviewer:** read-only visual, code, regression, and anti-gaming review.
- **QoderWork — Orchestrator UI:** starts and observes runs, reads reports, and requests the next deterministic action through MCP.

The deterministic test, evaluator, Git, and orchestrator scripts are the final authority. No agent may declare the project complete.

## Global rules

1. Never edit `main` directly. Work on a dedicated branch or Git worktree.
2. One code revision addresses one primary hypothesis.
3. Codex may edit only paths explicitly allowed by the active task.
4. Cursor must run in `ask` mode and must not modify any file.
5. QoderWork may write only under `runs/**`, `reports/**`, and `tasks/generated/**`.
6. Never lower thresholds, change reference images, alter holdout data, or weaken tests to make a result pass.
7. The agent modifying the generator must not modify the evaluator in the same revision.
8. Every change must include reproducible commands and evidence files.
9. A target-image improvement is rejected if the benchmark or existing web interactions regress beyond the configured tolerance.
10. Protected-file hashes are checked before and after every revision.
11. Do not add a second tank-generation implementation. The web UI and evaluator must share the same geometry source.
12. Do not migrate the current static application to a framework or bundler unless a later task explicitly requires it.
13. Preserve the current Vercel deployment behavior and offline vendored Three.js setup.
14. Stop at `PASSED`, `BLOCKED_DESIGN_SPACE`, `BUDGET_EXHAUSTED`, or `FAILED_INFRASTRUCTURE`; never loop without a budget.

## Protected paths

The following paths are read-only for ordinary generator revisions:

- `config/acceptance.json`
- `config/protected-files.json`
- `references/**`
- `tests/holdout/**`
- `tools/evaluator/**`
- `orchestrator/core/**`

Only a human-approved calibration task may change acceptance thresholds or reference data.

## Current phase

The active task is `tasks/00-baseline.md`.

During Phase 0, do not alter tank geometry, visual styling, vehicle metadata, or Vercel routing. The goal is only to add reproducible tooling, smoke tests, deterministic screenshots, and evidence output.

## Completion gate

A revision is accepted only when all of the following are true:

- Required commands exit with code 0.
- Existing application behavior remains intact.
- Protected files are unchanged.
- Deterministic evidence has been produced.
- Cursor returns `pass` or `pass_with_notes` with no blocking finding.
- The deterministic orchestrator returns `accepted: true`.
