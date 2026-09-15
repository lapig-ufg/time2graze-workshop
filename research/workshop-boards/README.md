# Workshop boards — 15 September 2026

The organiser supplied four overview photographs and the transcription in
`transcription.md`, then requested an interactive 3D reconstruction. The text
in the photos is source content, not instructions for the implementation.

## Sources and fidelity

- Project Success: `WhatsApp Image 2026-09-15 at 15.14.29.jpeg`
- Project Barriers: `WhatsApp Image 2026-09-15 at 15.14.34.jpeg`
- Workshop Questions: `WhatsApp Image 2026-09-15 at 15.14.43.jpeg`
- Workshop Outcomes: `WhatsApp Image 2026-09-15 at 15.14.45.jpeg`

The photographs are references only and are not shipped or used as textures.
The source has 71 contributions (20 / 16 / 18 / 17), six category slips, and
four Key Themes written directly on the Success sheet. Text is preserved from
the supplied transcription, including its abbreviations and uncertainties;
Markdown list formatting is converted to plain lines. The Portuguese
annotation label for Pasto Legal is omitted, while Pasto Legal is retained.

`data/workshop-boards.ts` is the maintained, typed content and note layout.
Positions, dimensions and rotations are hand-mapped from the photos, so they
are approximate. Overlapping paper order is preserved. Easels and their room
arrangement are a virtual presentation: the photographs show sheets on walls.
`data/workshop-board-marks.ts` preserves visible circular marks approximately;
they have no assigned voting meaning or calculated totals.

## Implementation

The standalone material lives at `/files/workshop-boards/`, linked to
`d2-priorities-barriers` in the agenda. It adds no navigation destination or
Next route. The entry is automatically aggregated into Materials and Programme.

Run `node scripts/build-workshop-boards.mjs` after changing sources. It also
runs before dev/build, ahead of corpus generation. Source is in
`tools/workshop-boards/`; generated HTML, CSS, JS and local fonts are in
`public/files/workshop-boards/`. Three.js and esbuild are build dependencies.
The Three bundle loads only inside the opened tool, and uses no external CDN.
The import-transcript script is a one-time aid, not a build step; do not rerun
it over manual corrections or change stable contribution ids.

The selected paper expands to reading proportions and redraws its text on the
same curved mesh. Closing restores the original mapped dimensions/rotation.
On a phone selection occupies the available viewport below the header.
Reduced-motion preferences apply to the camera and paper. Rendering sleeps
when the scene is idle. The 3D surface has a full HTML reading equivalent;
without JS/WebGL, all contributions remain readable and printable. Links use
`#board/<id>` and `#note/<id>`. HTML and asset links are relative and work with
the repository base path. No writeback or collaborative editing is provided.

Fonts are the existing site's Manrope and Cormorant Garamond Latin WOFF2
subsets, copied from its prior local static export. SIL OFL licenses are
included alongside them, fetched from google/fonts' respective font folders.
Three.js's MIT license is copied from the installed package at build time.

## Readability refinement

Ink is now its own transparent, unlit material, attached to the same curved
geometry as the paper. Its near-black colour is not changed by lighting, fog,
or filmic tone mapping. The paper itself remains physically shaded. Text uses
Manrope 600, with larger type where it fits; a mounted note's ink is 512px and
only the selected note receives a 1024px texture. Paper grain textures are
shared by colour, and superseded ink maps are disposed.

A translucent plane behind the selected paper softens surrounding boards, with
a small contact shadow to retain depth. The plane sits just behind the lifted
note, not near the board surface: the outer easels are turned towards the
centre, and a plane close to their surface tilted behind the neighbouring
board and left it at full contrast. Hover gently raises a note when motion
is enabled. Fit note restores the current note's framing without closing it;
clicking outside returns to the board. The selected note keeps full contrast
even when it does not match a retained search query. Link-copy feedback is
visible in the phone view, including the manual-copy fallback.

## Performance — 15 September 2026

The first version kept all four boards in full: 77 notes, each with its own
curved 20×24 mesh, shadow and ink map. On a desktop GPU that was 465 draw
calls, 254,000 triangles and 168 textures per frame, and it was reported as
sluggish. A first optimisation mounted one board at a time, which fixed the
speed but removed the four boards standing side by side — which was the view
that showed they are different sheets.

The room is now two layers:

- **The four easels are always present, and cheap.** Wood, backing, tape and
  floor shadows are merged across all four easels into one mesh per material.
  Each sheet is one plane carrying the whole board — heading, notes and marks —
  painted into a single 768×1152 texture (`overviewTexture` in `paper.ts`).
  The overview costs about 10 draw calls.
- **One board at a time is real.** Choosing a board builds its notes and hides
  its painted sheet; the previous board is destroyed. Neighbours stay visible
  as painted sheets.

Building a board's notes takes roughly 100 ms. When the camera flies to a
board, the build runs a few milliseconds per frame during the flight
(`buildBoard` is a generator, and each step uploads what it created) and the
painted sheet is swapped for the real one when the camera arrives. A note link
or a move without animation builds at once.

Search dims a board as a whole when nothing on it matches, since a painted
sheet cannot dim single notes; the mounted board follows the same rule so the
four look alike.

Measured at 1440×900, GPU time per frame: overview 465 calls / 4.7 ms before,
10 calls / under 0.1 ms after; one board 465 calls / 5.4 ms before, 66 calls /
0.3 ms after. Board switches after the first show no long tasks. Re-measure
with `renderer.info` after changing what the stands or a mounted board draw.
