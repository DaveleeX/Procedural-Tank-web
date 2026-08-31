# Phase 0 — Reproducible Baseline and Smoke Tests

## Primary hypothesis

Before geometry optimization or multi-agent automation can be trusted, the existing static web application needs a deterministic, machine-verifiable baseline.

## Objective

Add developer tooling and evidence capture without changing tank geometry, UI styling, runtime architecture, or Vercel behavior.

## Allowed files

- `package.json`
- `package-lock.json`
- `playwright.config.mjs`
- `tests/**`
- `tools/baseline/**`
- `scripts/**`
- `runs/**`
- a minimal `README.md` tooling section

## Forbidden files

All paths in `config/protected-files.json`, especially `src/vehicles/**`, core geometry files, `styles.css`, and `vercel.json`.

## Required implementation

1. Add a minimal Node development toolchain. Do not add a framework or bundler.
2. Add Playwright as a development dependency.
3. Add scripts with these stable entry points:
   - `npm run test:smoke`
   - `npm run capture:baseline`
   - `npm run verify:phase0`
4. Start the existing static application in a cross-platform way. Reuse `serve.py` or add a small test-only launcher; do not change production serving.
5. Create a Playwright smoke test that:
   - loads the page at a fixed 1280×800 viewport;
   - waits for the boot screen to finish;
   - verifies `window.__ATLAS__` exists;
   - verifies at least seven vehicle rows exist;
   - selects `tiger1` through `window.__ATLAS__.select('tiger1')`;
   - waits until loading is false and metadata id is `tiger1`;
   - checks whole-vehicle bounds contain finite positive dimensions;
   - activates `SIDE`, `FRONT`, and `PLAN` views through visible controls or the existing keyboard interface;
   - checks required controls still exist;
   - records uncaught page errors and console errors;
   - fails when the allowed console-error count is exceeded.
6. Create deterministic evidence capture at the configured viewport:
   - `runs/phase-00/evidence/default-view.png`
   - `runs/phase-00/evidence/tiger1-side.png`
   - `runs/phase-00/evidence/tiger1-bounds.json`
   - `runs/phase-00/evidence/browser-console.json`
   - `runs/phase-00/evidence/phase0-summary.json`
7. The summary must record timestamp, Git SHA, browser version, viewport, selected vehicle, bounds, test commands, exit status, and artifact paths.
8. Add a Phase 0 verification script that runs the smoke test and evidence capture and exits non-zero on failure.
9. Add concise Windows commands to README.
10. Run all new commands and report their exact results.

## Non-goals

- No image upload.
- No silhouette scoring.
- No optimizer.
- No candidate schema refactor.
- No tank-geometry edits.
- No visual redesign.
- No QoderWork MCP implementation yet.

## Acceptance

- Existing Vercel/static behavior is preserved.
- All required commands exit 0.
- All evidence files exist and are non-empty.
- No protected file changed.
- The application displays and switches vehicles/views successfully.
- Cursor review reports no blocking regression or evaluator-gaming concern.

## Codex response

At completion, provide:

- files changed
- commands run with exit codes
- evidence paths
- known limitations
- confirmation that protected paths were not modified
- the next recommended task, but do not start it
