#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["Pillow==13.0.0"]
# ///
"""Regenerate delivery images without modifying their source photographs.

Run manually with ``uv run scripts/optimize_media.py`` or a Python environment
containing Pillow 13.0.0. This is not a Jekyll/build dependency. Images are only
resized proportionally and encoded as WebP: no cropping, retouching, or new
content. Source color profiles are retained. Original media and their existing
provenance/license records remain authoritative.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps, features


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "assets/img"
OPTIMIZED = IMAGES / "optimized"


def derive(source: Path, destination: Path, width: int, quality: int) -> dict:
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        source_width, source_height = image.size
        width = min(width, source_width)
        height = round(source_height * width / source_width)
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        destination.parent.mkdir(parents=True, exist_ok=True)
        options = {"format": "WEBP", "quality": quality, "method": 6}
        if original.info.get("icc_profile"):
            options["icc_profile"] = original.info["icc_profile"]
        image.save(destination, **options)
    record = {
        "source": source.relative_to(ROOT).as_posix(),
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "source_bytes": source.stat().st_size,
        "output": destination.relative_to(ROOT).as_posix(),
        "width": width,
        "height": height,
        "quality": quality,
        "bytes": destination.stat().st_size,
    }
    print(f"{record['output']}: {width} × {height}, {record['bytes']:,} bytes")
    return record


def main() -> None:
    if not features.check("webp"):
        raise SystemExit("This Pillow installation needs WebP encoding support.")
    records = []
    for width in (480, 800):
        records.append(derive(IMAGES / "portrait.webp", OPTIMIZED / f"portrait-{width}.webp", width, 82))
    covers = {
        "hyadex": "software/hyadex-discussion.png",
        "papernas": "software/papernas-library.jpg",
        "underactuated-hand": "underactuated-hand-cover.webp",
        "robotic-fish": "robotic-fish-cover.webp",
        "monocular-hand": "monocular-hand-demo.webp",
        "language-quadruped": "language-quadruped-poster.webp",
    }
    for name, source in covers.items():
        records.append(derive(IMAGES / source, OPTIMIZED / f"{name}-cover-800.webp", 800, 84))
    for name in ("scut", "hkust-gz"):
        records.append(derive(IMAGES / f"affiliations/{name}.png", OPTIMIZED / f"{name}-104.webp", 104, 90))
    for frame in range(8):
        for width in (960, 1600):
            records.append(derive(
                IMAGES / f"big-sur/big-sur-{frame}.jpg",
                IMAGES / f"big-sur/big-sur-{frame}-{width}.webp",
                width, 78,
            ))
    (OPTIMIZED / "manifest.json").write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
