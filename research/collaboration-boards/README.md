# Collaboration boards — 17 September 2026

Material for `d4-collaboration-map`, “Interactive workshop: Building a
collaboration map and country uptake journey” (Beatriz / OGH).

The organiser supplied a transcription and seven board photographs. Nigeria
also has a close-up, which is a second view of the same notes. The Colombia
photograph arrived separately at 13:01:22 and confirms 15 notes, despite the
transcript's introductory claim of 11. There are 65 contributions and two
Brazil / RS Team heading slips, which are not counted as contributions.

`transcription.md` preserves the supplied text. `data/collaboration-boards.ts`
contains the displayed text and hand-mapped normalized positions. The spelling
and abbreviations are retained. Editorial annotations are in English and in
square brackets; crossed-out or uncertain words are explicitly identified.
No meaning or author is inferred for ambiguous text. The photographic paper
perspective is normalized to the existing portrait board geometry; positions,
colors and rotations are approximate, not photogrammetry. The easels are the
virtual setting, not furniture documented in the photographs.

Source photos (organiser's Downloads folder):

- `WhatsApp Image 2026-09-17 at 12.54.51 (1).jpeg` — Zimbabwe
- `WhatsApp Image 2026-09-17 at 12.54.51 (2).jpeg` — Nigeria
- `WhatsApp Image 2026-09-17 at 12.54.51.jpeg` — Nigeria close-up
- `WhatsApp Image 2026-09-17 at 12.54.51 (3).jpeg` — Argentina
- `WhatsApp Image 2026-09-17 at 12.54.51 (4).jpeg` — Brazil / RS Team
- `WhatsApp Image 2026-09-17 at 12.54.51 (5).jpeg` — Uruguay
- `WhatsApp Image 2026-09-17 at 12.54.51 (6).jpeg` — Tanzania
- `WhatsApp Image 2026-09-17 at 13.01.22.jpeg` — Colombia

Both collections use `tools/workshop-boards/`. The build substitutes only the
collection module, so each published application includes its own data. The
current renderer's merged easels, painted distant boards, incremental note
mounting, demand rendering and texture disposal are shared. No full-resolution
photographs are shipped. Run `node scripts/build-workshop-boards.mjs` to build
both artifacts, or `npm run build` to include the site export.

Published path: `/files/collaboration-boards/`. Reading mode, transcript,
keyboard navigation and individual note links use the same system as Day 2.

## Review — 17 September 2026

Checked against all eight photographs. Positions, colours and texts match the
sheets; three things were corrected:

- **Colombia's categories.** Note 13 is headed *Weakness* on the sheet and was
  filed under Missing; it now reads Weakness. The blue note (*Improve knowledge
  on grazing best practices*) carries no heading, so it no longer has one.
  Note 5's crossed-out word before "health" is marked like the others.
- **Country names.** Sheets with no facilitator draw their title large and
  centred, as the names are written on the photographs. At the Day 2 size
  seven sheets could not be told apart from the overview.
- **The focus veil on the outer boards.** With seven boards the end easels
  turn .075 rad, more than Day 2's .055, and Nigeria's notes showed through
  unsoftened beside an open Argentina note. The veil now sits .68 behind the
  lifted note (was .60), which also holds for Day 2.

The board navigation takes one row at 1400px and wider, and rows of four with
a rule between them below that.

Left as transcribed, but worth a look against the photograph: on Tanzania's
Strength note the word before "Internal Capacity" is struck through and reads
more like "Com" than "Team", and "(Community support)" is written in red in
parentheses rather than clearly crossed out.
