"""Turn OpenGeoHub's official logo PDF into the SVG the institutions row draws.

The published file is `OpenGeoHub_logo_800x350_RGB.pdf`, and it is vector all
the way down: no embedded raster, no fonts — the type is outlined, so the
whole mark is 120 filled paths in three inks. Converting it is a change of
container and not of artwork.

The PDF sits on a 598 x 185pt page with an even 28.35pt (10mm) margin around
the mark. The home page scales every mark by the artwork's own dimensions, so
the margin is dropped here the same way the other assets were cropped: the
`viewBox` is narrowed to the ink box and nothing is redrawn.

The source is not kept in the repository — it is re-downloaded, the way the
other official assets are:

    curl -O https://opengeohub.org/wp-content/uploads/2023/04/OpenGeoHub_logo_800x350_RGB.pdf
    python research/logos/opengeohub-convert.py OpenGeoHub_logo_800x350_RGB.pdf
"""

import math
import re
import sys

import pymupdf

TARGET = 'public/logos/institutions/opengeohub.svg'

page = pymupdf.open(sys.argv[1])[0]

ink = pymupdf.Rect()
for drawing in page.get_drawings():
    ink |= drawing['rect']

svg = page.get_svg_image()

# Outward to the millipoint, so rounding can never shave a pixel off the ink.
x0, y0 = math.floor(ink.x0 * 1000) / 1000, math.floor(ink.y0 * 1000) / 1000
x1, y1 = math.ceil(ink.x1 * 1000) / 1000, math.ceil(ink.y1 * 1000) / 1000
width, height = round(x1 - x0), round(y1 - y0)

svg = re.sub(
    r'width="[^"]*" height="[^"]*" viewBox="[^"]*"',
    f'width="{width}" height="{height}" '
    f'viewBox="{x0:g} {y0:g} {x1 - x0:g} {y1 - y0:g}"',
    svg,
    count=1,
)

with open(TARGET, 'w', encoding='utf-8') as file:
    file.write('<?xml version="1.0" encoding="utf-8"?>\n')
    file.write(svg)

print(f'{TARGET}: {width} x {height}')