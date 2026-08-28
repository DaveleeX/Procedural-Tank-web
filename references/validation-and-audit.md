# Validation and delivery audit

## Per-pass checks

- Model executes without warnings that invalidate geometry.
- Object/component count is plausible and not unexpectedly zero or explosive.
- Bounds, units, axes, and ground placement are correct.
- Locked reference-camera render exists.
- Changed element has a close-up and a scene-context render.
- Previous accepted silhouette/count/camera gates did not regress.

## Canonical inspection

Render front, right, rear, left, and top with consistent neutral lighting. Inspect intersections, floating parts, z-fighting, reversed placement, accidental symmetry, hidden-side coherence, and thickness. Oblique source views can conceal severe depth errors; canonical views are mandatory.

## Export verification

- Export every promised format from the same accepted source revision.
- Re-import STL or inspect it with an independent mesh reader; compare bounds and orientation.
- Verify GLB header/version/declared length and open/render it when possible; confirm materials and nodes survived.
- Record source revision, parameters, object count, bounds, output file sizes, and verification result.

## Visualization vs manufacturing

A detailed multi-body scene can be production-ready for visualization and still fail fabrication. For a printable/manufacturable claim, separately check watertightness, manifoldness, intentional unions, wall thickness, minimum features, clearances, self-intersections, unsupported spans, support strategy, scale, and process-specific tolerances.

Use Pass, Pass with inference, Fail, or Out of scope. Never turn an out-of-scope manufacturing failure into a visualization failure, and never describe an unchecked visual model as printable.

## Final evidence package

- Original-to-render comparison board.
- Canonical multiview sheet.
- Close-ups for every complex P0/P1 element.
- Parametric source and dependencies.
- Verified exports.
- Completed readiness report listing rejected hallucinations, inferred geometry, known limitations, and exact deliverables.
