# Autonomous one-invocation contract

## Preflight

Confirm before authoring:

- Original image files can be read at full resolution.
- ForgeCAD source can be executed locally.
- The runtime can render a chosen camera to an image.
- Reference and render images can be inspected or compared.
- At least one requested 3D exchange format can be exported and verified.
- The workspace is writable and has enough time/storage for repeated evidence renders.

If a mandatory capability is absent, stop before producing a misleading coarse model and state the exact missing dependency.

## Autonomous loop

Execute without waiting for the user:

1. Inventory all visible elements and assign P0–P3 priorities.
2. Calibrate envelope and camera; render and correct until G1/G2 pass.
3. Build P0 systems; render, critique, and correct each family.
4. Build every P1 identity object as a dedicated module; render close-up and scene view.
5. Resolve P2/P3 elements that materially affect the reference view.
6. Render canonical views and repair depth/intersection errors.
7. Produce the final fixed-camera comparison; list mismatch zones.
8. If any G1–G5 gate fails, return to the responsible module and repeat.
9. Export, re-import/inspect, run the deterministic readiness gate, and deliver only after both visual and structural gates pass.

There is no fixed maximum iteration count. As a minimum evidence floor, create two envelope/camera comparison passes, at least one accepted close-up and scene render for every P0/P1 element, and one final regression pass after composition. These are minimums, not proof of quality.

## Visual rejection triggers

Reject the current candidate when any applies:

- The reference silhouette, rounded corners, roofline, visible-face ratio, or ground contact does not align.
- A floor, bay, window, balcony, stair flight, roof cluster, vehicle, or other countable identity feature is missing or miscounted.
- A complex item has been replaced by a box-like generic symbol.
- Dense areas visible in the source are empty in the model merely because individual pixels are hard to read.
- The model is clean but expresses a different building/product grammar.
- A structural study added plausible parts not supported by the source.
- Materials or lighting are being used to conceal geometry mismatch.

## Delivery semantics

The first user-facing model claimed as complete must already include all accepted modules, final composition, audited exports, comparison board, canonical views, and readiness report. Milestone renders belong in `evidence/`, not in the final answer as an invitation to continue.

If the host imposes a hard turn or compute limit, return `INCOMPLETE — quality gate not passed` with the current artifacts and failing gates. This is preferable to a false one-click success.
