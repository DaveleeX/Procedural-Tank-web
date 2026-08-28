# Fidelity rubric

Use a fixed reference camera and judge from highest to lowest impact. A lower-level success cannot compensate for a higher-level failure.

| Gate | What to compare | Pass evidence |
| --- | --- | --- |
| G1 Silhouette | outer contour, footprint, corners, roofline, ground contact | overlay or side-by-side at identical framing |
| G2 Camera | visible-face proportions, convergence, elevation, crop | locked camera parameters and matched anchors |
| G3 Major modules | mass divisions, setbacks, voids, roof clusters | reference render plus canonical views |
| G4 Counts/rhythm | floors, windows, bays, rails, stairs, repeated equipment | inventory counts and measured spacing |
| G5 Identity features | unusual shapes and context objects that make the subject recognizable | element close-ups and scene-camera renders |
| G6 Secondary detail | pipes, clutter, fittings, panels, debris | resolved inventory and local evidence |
| G7 Presentation | material groups, color balance, lighting | final comparison after geometry passes |

## Quantitative scoring when requested

Do not invent a percentage. Define weights before scoring, for example: G1 25, G2 15, G3 20, G4 15, G5 15, G6 7, G7 3. Score each gate from measurable evidence such as mask IoU, anchor-point error, count agreement, normalized spacing error, or a documented reviewer rating.

“95%” means at least 95/100 under the declared rubric, not pixel equality. State limitations caused by occlusion, a single view, lack of dimensions, procedural material restrictions, and inferred hidden surfaces.

## Comparison practice

Use unchanged reference pixels. Align image dimensions and framing. Prefer side-by-side plus a low-opacity overlay or edge comparison. Record mismatch zones instead of relying on a general impression. Fix the highest-weight failing gate first.
