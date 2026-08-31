# Cursor Read-Only Phase Review

Run in `ask` mode. Do not modify any file and do not run destructive commands.

Read:

- `AGENTS.md`
- `GOAL.md`
- the active task
- `config/acceptance.json`
- `config/protected-files.json`
- `git diff --stat`
- `git diff`
- all evidence under the current run directory

Review for:

1. Whether the active task was actually completed.
2. Functional regressions in the existing static application.
3. Unauthorized or protected-file changes.
4. Test weakening, threshold lowering, evidence fabrication, or other evaluator gaming.
5. Missing failure handling, nondeterminism, and Windows incompatibility.
6. Unnecessary refactors or duplicate geometry implementations.
7. Missing tests or evidence.

Return JSON only matching `schemas/cursor-review.schema.json`.

A blocking finding must set `verdict` to `fail`. Do not fix findings yourself.
