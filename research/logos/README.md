# Institutional logo research

This folder records provenance and usage status for the workshop logo set.
Logo presence in the agenda does not by itself confirm partner status. The final
logo list and ordering must be approved by the Time2Graze/LAPIG team. The
cross-project operational checklist is in `research/pending-information.md`.

## Candidate final assets

FUNAPE was added to the displayed institutions at the client's explicit request
on 9 September 2026. `public/logos/institutions/funape.png` is the supplied
`logo_site.png` (256 × 71), copied without changes to the artwork or colours.

Files in `public/logos/institutions/` were downloaded from official
institutional sites or from the Land & Carbon Lab asset host. The artwork is
unmodified; several files had their **canvas** cropped to the artwork, which is
recorded under [Canvas crops](#canvas-crops) below.

| Institution | Local file | Source | Status |
| --- | --- | --- | --- |
| Land & Carbon Lab | `land-carbon-lab.svg` | https://www.datocms-assets.com/135908/1724171737-lcl_4x3.svg | Official site asset; SVG |
| World Resources Institute | `world-resources-institute.svg` | https://www.datocms-assets.com/135908/1724168484-wri_4x3.svg | Served by the official Land & Carbon Lab site; SVG |
| Global Methane Hub | `global-methane-hub.png` | https://www.globalmethanehub.org/wp-content/themes/landslide/img/logo.png | Official site asset; transparent PNG, 879 x 452 |
| LAPIG | `lapig-en-color.png`, `lapig-en-black.png` | https://lapig.iesa.ufg.br/p/comunicacao | Official communication page; English versions, 1080 x 1080 |
| UFG | `ufg-color-horizontal.png` | https://ufg.br/p/51425-marca-ufg | Official brand page; horizontal colour version, 652 x 335 |
| INIA Uruguay | `inia-uruguay.png` | https://www.inia.uy/index.php/comunicacion/logotipo-institucional | Official site logo. Confirm against the recommended short `INIA Uruguay` lockup in the current brand manual before use |
| Alliance Bioversity International & CIAT | `alliance-bioversity-ciat.svg` | https://commons.wikimedia.org/wiki/File:Alliance_Logo_Refresh_EN_color.svg | Current English mark; Alliance-authored asset, CC BY 4.0 |
| WWF | `wwf.png` | https://cdnassets.panda.org/_skins/international/img/logo.png | Mark served by WWF's official global site; compact production asset |
| Time2Graze | `time2graze.png` | Screenshot of a project slide, supplied by the client on 9 September 2026 | **Not an official asset.** Lifted from the screenshot and recoloured — see [The Time2Graze wordmark](#the-time2graze-wordmark) |
| OpenGeoHub | `opengeohub.svg` | https://opengeohub.org/wp-content/uploads/2023/04/OpenGeoHub_logo_800x350_RGB.pdf | Official published logo; converted from PDF to SVG with `opengeohub-convert.py` |

## The Time2Graze wordmark

The project's own mark is the one file here that did not come from an
institutional site. No published Time2Graze asset could be found: the project
is documented on the Alliance Bioversity–CIAT and Global Methane Hub sites, and
neither serves a logo for it. What exists is a client screenshot of a slide,
`time2graze-slide-source.png`, 470 x 366.

That screenshot is unusually clean — a flat `#171717` background, pure white
and one olive green (`#4C631F`), with antialiasing and nothing else. So each
pixel reads as the background plus some coverage of one ink, and that coverage
is recoverable as alpha. `time2graze-extract.py` does exactly that, and
rebuilds `public/logos/institutions/time2graze.png` from the screenshot at any
time.

**The mark was recoloured, and that is a real alteration.** The slide carries
the reversed lockup — white type with a green `2`, on dark. The institutions
band is white, where reversed type is invisible, so the white was re-laid in
the mark's own `#171717` and the green carried over untouched. Both colours
are the mark's; nothing else was redrawn. A wordmark shown reversed on a dark
slide almost always has a dark counterpart, so this is likely to be close to
the official light-background version — but it has not been checked against
one.

**Still to do:** ask the Time2Graze communication team for the real file —
vector, or a transparent PNG, in both the light-background and reversed
versions — and replace this asset with it. Until then the page is showing a
mark reconstructed from a screenshot.

## Canvas crops

Several assets ship on a padded canvas — a 4:3 export frame, or a 1080 x 1080
social-post square holding a horizontal wordmark. The home page draws every
mark to a shared optical area, so it needs the artwork's own dimensions and not
the export frame's: LAPIG's mark was 407px of ink in a 1080px-tall file, which
is why it used to be rendered at a hand-tuned height and still looked wrong.

No artwork was altered. SVGs had the `viewBox` narrowed to the content bounds
and PNGs were cropped to their ink box; both are reversible by re-downloading
from the source in the table above.

| File | Original canvas | Now | Crop |
| --- | --- | --- | --- |
| `land-carbon-lab.svg` | `viewBox="0 0 400 300"` | `viewBox="0 62 400 176"` | Top and bottom padding of the 4:3 frame |
| `world-resources-institute.svg` | `viewBox="0 0 400 300"` | `viewBox="0 86 400 129"` | Same; the mark is a raster in a pattern-filled rect |
| `alliance-bioversity-ciat.svg` | `viewBox="0 0 371.55 269.85"` | `viewBox="60 71 251 128"` | Symmetric padding on both axes |
| `lapig-en-color.png` | 1080 x 1080 | 958 x 407 | Social-post square around a horizontal wordmark |
| `lapig-en-black.png` | 1080 x 1080 | 958 x 407 | Same |
| `wwf.png` | 186 x 209 | 109 x 163 | White margin around the panda and wordmark |

`opengeohub.svg` was not hand-cropped: `research/logos/opengeohub-convert.py`
converts the official PDF to SVG and narrows the `viewBox` to the ink box in
the same step. The source PDF carries outlined type with no embedded raster,
so the conversion changes the container and not the artwork. Re-download and
re-run the script to reproduce it.

`global-methane-hub.png`, `inia-uruguay.png` and `ufg-color-horizontal.png`
already filled their canvas and were left alone.

`wwf.png` carries a **white background**, not transparency. The institutions
band is white for that reason; moving it onto the cream paper would show the
mark's plate.

## Marks currently shown

The home page displays Time2Graze, Land & Carbon Lab, OpenGeoHub, UFG, LAPIG
and FUNAPE. Land & Carbon Lab, UFG and LAPIG follow the client's instruction
on 4 September 2026; Time2Graze was added on 9 September 2026, at the
client's request, and leads the row because it is the project the workshop
belongs to rather than one more affiliation; FUNAPE was added the same day at
the client's request; OpenGeoHub was added on 11 September 2026 with its
official published logo. They appear in one neutral institutional row,
without unconfirmed public-role labels. Every other asset in the candidate
set remains unpublished until the relevant institution approves its use and
the Time2Graze/LAPIG team confirms its inclusion.

## The WhatsApp glyph

`components/whatsapp-mark.tsx` is not an institutional mark and is not part of
the set above. It is the WhatsApp glyph from **Simple Icons 16.30.0**
(`icons/whatsapp.svg`, released CC0 1.0), inlined with its path data unchanged
so that the participants' group link says which application it opens. The rest
of the site draws its icons with lucide-react, which ships no brand marks.

It is rendered in `currentColor` — forest on the lime accent in the home strip,
white with a lime glyph in the footer — and never in WhatsApp's own green. The
site has no badge of its own and does not acquire one by linking out; the glyph
identifies a destination and takes the page's palette while doing it. WhatsApp
is a trademark of Meta Platforms, used here to name the service the link opens.

## Previous GPW workshop references

Files in `gpw-previous-site/` were extracted from the published 2024 workshop
Google Site. They are 200 x 200 px PNGs and are research references only:

- Land & Carbon Lab
- LAPIG
- OpenGeoHub
- IIASA
- GLAD
- Cornell University

Source: https://sites.google.com/view/gpw-brazil-workshop/home

These marks describe the Global Pasture Watch consortium shown on the previous
site. They should not all be carried into Time2Graze without confirmation.

`wwf-reference.jpg` comes from the official WWF global landing page, but it is
only 250 x 281 px. Do not ship it as the production asset. WWF's published terms
and brand guidance require the current toolkit and appropriate permission for
logo use.

## Still to obtain or confirm

- OpenGeoHub: the official published logo is now the production asset. Confirm
  the institution's role and order in the row with the Time2Graze/LAPIG team.
- INTA, UNMdP, IIASA, GLAD and Cornell: confirm whether these are partners for
  this event rather than institutions mentioned only in programme content.
- Obtain approval before displaying any institutional mark beyond the ones
  listed under [Marks currently shown](#marks-currently-shown), and confirm its
  role and order before adding it.
