# Goal — Programmatic Image-to-Tank Self-Improvement Loop

## Product goal

Extend Armour Atlas into a Windows-first programmatic image-to-model platform that can:

1. Receive a tank reference image.
2. Fit a locked camera and a parameterized tank candidate.
3. Render deterministic silhouette and neutral-clay evidence.
4. Score silhouette, contours, landmarks, geometry validity, multi-view consistency, archetype quality, and runtime performance.
5. Search parameter candidates automatically.
6. Ask Cursor for a read-only diagnosis only when search stagnates.
7. Ask Codex to make one narrowly scoped generator improvement in an isolated branch/worktree.
8. Re-run all target and holdout checks.
9. Accept the revision only when objective evidence improves without unacceptable regression.
10. Expose run control and reports to QoderWork through a local MCP server.

## Existing foundation

The current project is a static browser application using vendored Three.js. Each vehicle is generated procedurally in `src/vehicles/*.js`, and `window.__ATLAS__` already exposes selection, bounds, scene, camera, rig, and state for test harnesses.

## Delivery phases

### Phase 0 — Baseline and reproducibility

Add Node-based developer tooling without changing the static runtime. Establish Playwright smoke tests, fixed-viewport screenshots, console-error checks, Tiger I selection, bounds evidence, and a single verification command.

### Phase 1 — Shared tank specification

Create a validated candidate schema and a pure adapter around Tiger I parameters. The existing web application and future evaluator must use the same builder. Camera parameters live separately from tank parameters.

### Phase 2 — Silhouette evaluator

Create deterministic target-view capture, binary masks, overlays, contour-difference evidence, IoU, boundary score, normalized landmark error, and geometry validation.

### Phase 3 — Parameter search

Add mixed discrete/continuous candidate generation, elite preservation, mutation/crossover, Pareto selection, deterministic seeds, stagnation detection, and bounded termination.

### Phase 4 — Codex and Cursor loop

Add adapters that invoke Codex as the sole builder and Cursor as a read-only reviewer. Use isolated Git worktrees, path allowlists, protected-file hashes, before/after benchmarks, automatic acceptance, and rollback.

### Phase 5 — QoderWork MCP

Expose `start_run`, `get_run_status`, `pause_run`, `resume_run`, `request_cursor_review`, `request_codex_revision`, `get_best_candidate`, `export_final_report`, and `stop_run` through a local MCP server.

### Phase 6 — Product UI

Add reference upload, candidate comparison, silhouette overlay, score breakdown, generation history, and the three winners: `BEST_MATCH`, `MOST_CLASSIC`, and `BALANCED`.

## State machine

`INITIALIZING → SEARCHING → STAGNATED → CURSOR_REVIEWING → CODEX_REVISING → VERIFYING → CURSOR_FINAL_REVIEW → MERGING | ROLLING_BACK → SEARCHING`

Terminal states:

- `PASSED`
- `BLOCKED_DESIGN_SPACE`
- `BUDGET_EXHAUSTED`
- `FAILED_INFRASTRUCTURE`

## Definition of done

The project is complete only when a clean checkout can reproduce the final result, all configured target thresholds pass twice consecutively, the holdout benchmark passes, protected files are unchanged, existing web interactions pass, and the deterministic orchestrator—not an agent—marks the run `PASSED`.
