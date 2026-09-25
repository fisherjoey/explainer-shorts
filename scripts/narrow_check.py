# Run after `pnpm stills _narrow`:
#   uv run --no-project --with pillow --with numpy python scripts/narrow_check.py
"""Gutter check for the _narrow stills: every strip a block must not reach has to stay page-coloured.

Per slide: the strip right of the column (x 1021-1079); the strip left of it (normal narrator: x 362-378,
between the divider and the column; big narrator: x 480-536, between its right edge and the column;
skipped on the full-layout slide, whose visual[0] spans the page); the strip under the column above
the caption pill (y 1362-1410); and on row-only slides the 12 px gap between the two cells. A pixel
counts if it differs from the page colour by more than 8. Checks run from `top` (below the headline).
"""
import sys
from PIL import Image
import numpy as np

PAGE = np.array([0xFA, 0xF8, 0xF4])
BOTTOM = 1360
root = sys.argv[1] if len(sys.argv) > 1 else "out/stills/_narrow"

# id -> (big narrator?, row-only?, full layout?, top)
slides = {}
for i in range(1, 22):
    big = i <= 5 or 11 <= i <= 15 or i == 19
    rows = 6 <= i <= 15
    # s20's rule and s21's band legitimately reach below y 430.
    top = 510 if i >= 20 else 430
    slides[f"s{i:02d}"] = (big, rows, i == 17, top)


def dirty(im, x0, x1, y0, y1):
    reg = im[y0:y1, x0:x1]
    return int((np.abs(reg - PAGE).max(2) > 8).sum())


bad = 0
for sid, (big, rows, full, top) in slides.items():
    im = np.asarray(Image.open(f"{root}/{sid}.png").convert("RGB")).astype(int)
    col_x = 538 if big else 380
    col_w = 1020 - col_x
    checks = {"right": dirty(im, 1021, 1080, top, BOTTOM), "below": dirty(im, col_x, 1021, 1362, 1410)}
    if not full:
        checks["left"] = dirty(im, 480, 537, top, BOTTOM) if big else dirty(im, 362, 379, top, BOTTOM)
    if rows:
        cell = (col_w - 12) // 2
        checks["row-gap"] = dirty(im, col_x + cell, col_x + cell + 12, top, BOTTOM)
    flag = "OK " if all(v == 0 for v in checks.values()) else "BAD"
    bad += flag == "BAD"
    kind = "full layout" if full else "rows" if rows else "stack"
    print(f"{flag} {sid} ({'big' if big else 'normal'} narrator, {kind}):", ", ".join(f"{k}={v}" for k, v in checks.items()))
print("violations:", bad)
