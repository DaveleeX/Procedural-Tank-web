---
name: forgecad-procedural-image-to-model
description: "Reconstruct high-fidelity, editable procedural 3D/CAD models and scenes from reference images in one autonomous invocation: decompose evidence, author modular ForgeCAD geometry, render and compare multiple internal iterations, refine until hard quality gates pass, then audit STL/GLB delivery. Use for one-click or single-prompt image-to-3D without generative meshes, procedural CAD reconstruction from photos, architecture/product/vehicle likeness reconstruction, ForgeCAD scene building, or production-ready reference matching. Do not stop at a coarse first pass or require the user to repeatedly request refinements."
---

# Procedural Image to ForgeCAD

Build the model as an explicit, readable system of solids. Treat images as evidence, not as geometry generators, and do not claim fidelity that has not been compared and audited.

## One-invocation execution contract

Treat the user's first request as authorization to complete the entire reconstruction loop. “One click” means one user instruction, not one modeling pass.

- Perform analysis, rough construction, rendering, critique, correction, detailing, export, and audit inside the same invocation.
- Keep rough and milestone models internal. Never present a coarse pass as the requested deliverable.
- Do not ask “should I continue?”, “which part next?”, or require refinement prompts when the reference and requested output are already clear.
- Send concise progress updates if the host supports them, but continue working without waiting for replies.
- Ask only when the source image is unavailable/unreadable, a choice materially changes the intended object, or required execution tools are genuinely missing.
- Before modeling, read `references/autonomous-execution-contract.md` and run its preflight. If the runtime cannot render, compare, and export ForgeCAD, report the missing capability; do not substitute a coarse result.
- For a fresh machine or missing project, read `references/deployment-contract.md` and run the bundled bootstrap script before modeling. Do not assume Codex has already downloaded the project or installed ForgeCAD.
- Run `scripts/readiness_gate.py <project-root>` before final delivery. A failing exit code forbids final delivery.
- A passing script checks evidence completeness, not visual truth. The agent must still inspect comparison images and pass the fidelity rubric.

## Non-negotiable rules

- Author final geometry procedurally in ForgeCAD from primitives, sketches, extrusions, sweeps, transforms, patterns, and booleans.
- Do not use generated meshes, image-to-mesh services, NeRF, Gaussian splats, photogrammetry output, displaced raster relief, or projected facade images as model geometry.
- Keep the original reference at the top of the evidence hierarchy. Crops preserve that authority; enhanced/redrawn images do not gain new authority.
- Use Image2 only to form structural hypotheses for small, complex, low-resolution elements. Never import its pixels or inferred mesh into the model.
- Reject plausible details when they conflict with the source, alter the silhouette, change object count, or invent a new object.
- Keep hidden views conservative and label them as inferred.
- Never report “95% accurate” without a defined rubric and comparison evidence.

## Load companion guidance

When available, also use the `forgecad`, `forgecad-build-model`, and `forgecad-reconstruct-from-images` skills for ForgeCAD syntax, execution, and model inspection. Use `imagegen` only for auxiliary structural sheets under the restrictions above.

Read the following references as the task reaches each phase:

- `references/workflow.md` before planning and building.
- `references/evidence-and-image2.md` before cropping, enhancing, or interpreting uncertain elements.
- `references/project-structure.md` before creating the model tree.
- `references/fidelity-rubric.md` before evaluating likeness.
- `references/validation-and-audit.md` before milestone acceptance and delivery.
- `references/autonomous-execution-contract.md` before any one-click/single-prompt reconstruction.
- `references/deployment-contract.md` when the project or ForgeCAD CLI is absent.

Copy the Markdown templates in `assets/templates/` into the project and maintain them during the build.

## Required workflow

### 1. Establish the evidence baseline

Collect every source image at original resolution. Record camera direction, visible faces, occlusion, scale cues, repeated spacing, object count, colors, and uncertainty. Create original-pixel crops for inspection without retouching them.

Create:

- `docs/EVIDENCE-LEDGER.md`
- `docs/ELEMENT-INVENTORY.md`
- `reference/` for originals and lossless crops
- `evidence/` for fixed-camera renders and comparisons

Do not start detail modeling until the inventory covers every visible major and minor element.

### 2. Calibrate camera and primary envelope

Reconstruct only the footprint, silhouette, major mass divisions, floor heights, roofline, and reference camera. Render a flat neutral material. Compare the same reference-camera view.

Lock this milestone before adding windows or props. If the outer contour is wrong, fix dimensions, corner radii, projection, camera target, focal length/FOV, elevation, and crop—not surface detail.

### 3. Build in identity order

Work from the features that dominate recognition to the ones that merely enrich it:

1. Main masses and modules.
2. Openings, bays, corners, roofline, and large voids.
3. Repeated structural systems such as balconies, frames, stairs, rails, and canopies.
4. Roof clusters and attached equipment.
5. High-identity context objects such as vehicles or machinery.
6. Street, household, service, and clutter elements.
7. Materials and presentation.

Change one element class at a time, render, compare, log the result, and keep or revert deliberately.

### 4. Reconstruct complex small elements independently

Give every complex element its own ForgeCAD module and parameter block. For uncertain small objects, run the Image2 evidence protocol in `references/evidence-and-image2.md`.

For each module, produce:

- An unchanged source crop.
- Optional structural study.
- A close engineering view.
- A render from the locked scene camera.
- A short confirmed/probable/inferred feature record.

Accept a detail only when it improves the scene-camera match without contradicting the crop.

### 5. Compose without disturbing accepted geometry

Import accepted modules into the assembly. Preserve the locked envelope and camera while working on small objects. Use named placement transforms and central parameters; avoid scattered unexplained constants.

After composition, rerun both the object close-up and the full-scene comparison because a correct standalone object may have wrong scale, pose, depth, or occlusion in context.

### 6. Validate every milestone

At minimum, render:

- Locked reference camera.
- Front, right, rear, left, and top canonical views.
- Close-ups for every P0/P1 element.

Compare in this order: silhouette, camera, major module placement, counts and spacing, identity features, then fine detail. Do not tune micro-detail while a higher-order mismatch remains.

### 7. Audit and deliver

Run the ForgeCAD model cleanly, inspect components and bounds, export requested formats, and verify the exports independently. Re-import STL when available; inspect GLB structure and material preservation. Separate visualization readiness from manufacturing readiness.

Deliver:

- Parametric `.forge.js` source tree.
- STL and/or GLB as requested.
- Reference comparison board.
- Canonical views and complex-element close-ups.
- `docs/FINAL-READINESS.md` with pass/fail/out-of-scope results, limitations, and inferred regions.

Do not call a multi-body visual scene printable unless unions, wall thickness, clearances, supports, manifoldness, and minimum feature sizes have been checked for the intended process.

## Stop conditions

Continue iterating while any of these is true:

- A visible element is absent or misidentified.
- The locked reference silhouette or camera alignment is materially wrong.
- Repeated counts or spacing differ from the source.
- A high-identity element reads as a generic substitute.
- An enhanced study introduced unsupported geometry.
- The model cannot execute or an advertised export cannot be verified.

Stop only when the inventory is resolved, higher-order fidelity gates pass, exports are audited, and remaining uncertainty is explicitly documented.

If the available time or runtime ends first, report an incomplete build honestly. Never relabel a rough model as production-ready.
