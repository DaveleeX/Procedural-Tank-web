#!/usr/bin/env python3
"""Reject incomplete procedural image-to-ForgeCAD deliveries.

This gate validates evidence/package completeness. Visual fidelity still requires
human/agent inspection of the comparison images using the bundled rubric.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


BAD_STATUSES = {
    "observed", "scoped", "building", "comparison failed", "failed",
    "pending", "todo", "rough", "first pass", "in progress",
}


def image_files(root: Path) -> list[Path]:
    suffixes = {".png", ".jpg", ".jpeg", ".webp"}
    return [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in suffixes]


def table_rows(text: str) -> list[list[str]]:
    rows = []
    for line in text.splitlines():
        if not line.lstrip().startswith("|"):
            continue
        cells = [c.strip().lower() for c in line.strip().strip("|").split("|")]
        if cells and not all(re.fullmatch(r"[-: ]*", c or "") for c in cells):
            rows.append(cells)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project_root", type=Path)
    parser.add_argument("--min-evidence-images", type=int, default=8)
    parser.add_argument("--min-iteration-rows", type=int, default=6)
    args = parser.parse_args()
    root = args.project_root.resolve()
    failures: list[str] = []

    required = [
        root / "main.forge.js",
        root / "docs" / "EVIDENCE-LEDGER.md",
        root / "docs" / "ELEMENT-INVENTORY.md",
        root / "docs" / "ITERATION-LOG.md",
        root / "docs" / "FINAL-READINESS.md",
    ]
    for path in required:
        if not path.is_file() or path.stat().st_size < 40:
            failures.append(f"missing or empty: {path.relative_to(root)}")

    inventory = root / "docs" / "ELEMENT-INVENTORY.md"
    if inventory.is_file():
        rows = table_rows(inventory.read_text(encoding="utf-8"))
        data_rows = rows[1:] if rows else []
        if not data_rows:
            failures.append("element inventory has no data rows")
        for index, cells in enumerate(data_rows, start=1):
            status_cell = cells[-1] if cells else ""
            if any(status in status_cell for status in BAD_STATUSES):
                joined = " | ".join(cells)
                failures.append(f"inventory row {index} has unresolved status: {joined[:160]}")

    iteration = root / "docs" / "ITERATION-LOG.md"
    if iteration.is_file():
        rows = table_rows(iteration.read_text(encoding="utf-8"))
        count = max(0, len(rows) - 1)
        if count < args.min_iteration_rows:
            failures.append(
                f"only {count} iteration rows; need at least {args.min_iteration_rows}"
            )

    evidence = root / "evidence"
    images = image_files(evidence) if evidence.is_dir() else []
    if len(images) < args.min_evidence_images:
        failures.append(
            f"only {len(images)} evidence images; need at least {args.min_evidence_images}"
        )
    names = " ".join(p.name.lower() for p in images)
    for token in ("comparison", "front", "right", "rear", "left", "top"):
        if token not in names:
            failures.append(f"no evidence image filename contains '{token}'")

    source_files = list(root.rglob("*.forge.js"))
    if len(source_files) < 2:
        failures.append("model is not modular: fewer than two .forge.js files")

    exports = [p for ext in ("*.stl", "*.glb") for p in root.rglob(ext)]
    if not exports:
        failures.append("no STL or GLB export found")
    elif any(p.stat().st_size < 84 for p in exports):
        failures.append("one or more export files are implausibly small")

    readiness = root / "docs" / "FINAL-READINESS.md"
    if readiness.is_file():
        text = readiness.read_text(encoding="utf-8").lower()
        for phrase in ("known limitations", "export", "evidence"):
            if phrase not in text:
                failures.append(f"FINAL-READINESS.md lacks section/content: {phrase}")

    if failures:
        print("READINESS GATE: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("READINESS GATE: PASS")
    print(f"- procedural sources: {len(source_files)}")
    print(f"- evidence images: {len(images)}")
    print(f"- exports: {len(exports)}")
    print("Visual fidelity still requires rubric-based image inspection.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
