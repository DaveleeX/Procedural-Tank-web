# Evidence and Image2 protocol

## Authority hierarchy

1. Original full-resolution image: silhouette, count, position, pose, scale, occlusion, and visible color grouping.
2. Unchanged crop: enlargement of the same evidence, with no new facts.
3. Enhanced/redrawn structural study: hypothesis generator only.
4. Procedural render: candidate to test against levels 1 and 2.

More attractive or mechanically plausible imagery does not outrank the source.

## When Image2 is appropriate

Use it only when an element occupies too few pixels for reliable structural reading yet materially affects recognition, such as a compact excavator, vehicle, rooftop cluster, ornate mechanism, or dense equipment group.

Do not use it for the main silhouette, clearly visible counts, camera geometry, or as a shortcut for modeling.

## Structural-study prompt contract

Ask for a high-resolution analytical redraw that:

- Preserves source silhouette, pose, orientation, articulation, camera angle, crop, and visible occlusion.
- Does not add/remove objects or alter the relationship between parts.
- Separates visible assemblies with neutral lighting and readable edges.
- Treats unseen surfaces and unreadable markings as unspecified.
- Avoids manufacturer logos, invented text, decorative redesign, dramatic perspective, and scene restaging.

The prompt must state that the result is a non-authoritative modeling aid.

## Feature classification

Before modeling, split observations into:

- **Confirmed:** visible in the original.
- **Probable:** mechanically or architecturally necessary and consistent with the original.
- **Inferred:** suggested only by the structural study or domain convention.
- **Rejected:** contradicts source count, silhouette, pose, or layout.

Model confirmed features first. Keep probable features simple. Inferred details must be low-salience, generic, and removable. Never allow inferred details to change the outer contour.

## Anti-hallucination review

Overlay or compare the structural study with the unchanged crop. Explicitly check object count, major axes, wheel/track position, boom/stair direction, roof equipment count, window divisions, and occlusion boundaries.

Common failure: the redraw makes a coherent but different object. If so, preserve only those substructures also supported by the original and discard the rest.

## Completion evidence per complex element

Store the crop, structural study if used, confirmed/probable/inferred table, standalone module, engineering close-up, locked-camera scene render, and acceptance decision. Never project the study onto the geometry or import a mesh derived from it.
