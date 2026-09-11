# Time2Graze Brazil Workshop

Institutional information hub for the internal Time2Graze technical workshop,
held in Goiânia, Brazil, from 14 to 18 September 2026.

Live site: https://lapig-ufg.github.io/time2graze-workshop/

The site is intentionally operational rather than promotional. It brings the
programme, presentation materials, venues, accommodation, transport and
participant guidance together under four plainly named pages. Unknown
information remains visibly pending; it is never replaced by a plausible guess.

## Current state

Implemented:

- typed agenda, venue and material data;
- proportional programme on large screens and a chronological mobile view;
- explicit parallel tracks and point markers for activities without an end;
- split-session sign-up: participants say which of two parallel activities
  they will join, and the organisers read one row per person;
- deep links to each day and scheduled item;
- print layout containing all five days;
- `Today`, `Now` and `Next` states in `America/Sao_Paulo`;
- `.ics` calendar export for all five days or the selected day, and a live
  shared Google Calendar participants can request by e-mail;
- materials generated from the sessions and tracks that produce them;
- venue maps with candidate pins visibly marked and ride links restricted to
  confirmed destinations;
- official and reference institutional logo assets with provenance notes.

Waiting for confirmed information:

- hotel, booking, check-in and check-out details;
- confirmation of the LAPIG street address, entrance and CEP;
- airport transfers and daily transport;
- the Day 5 farm location;
- approval for any institutional marks beyond Land & Carbon Lab, UFG and LAPIG;
- the expected presentation files, shared folder and final programme PDF.

See [AGENTS.md](AGENTS.md) for the complete product, design and implementation
decisions. The complete operational checklist is in
[research/pending-information.md](research/pending-information.md).

## Content model

Content is kept out of the page markup:

- `data/agenda.ts` — days, sessions, tracks, speakers and expected materials;
- `data/venues.ts` — the single venue registry: hotel, LAPIG, Cidade de Goiás;
- `data/types.ts` — the content contracts;
- `data/practical.ts` — accommodation, the contracted shuttle and guide links;
- `data/city-guide.ts` — Goiânia's context, Cidade de Goiás's history and the
  free-time places, with their provenance in `research/free-time.md`;
- `data/navigation.ts` — the four destinations, shared by the header and 404;
- `lib/materials.ts` — derives the Materials section from the agenda;
- `lib/calendar.ts` — generates the `.ics` files from the same agenda;
- `components/programme.tsx` — proportional, chronological and print
  representations of the programme;
- `app/practical/page.tsx` — Travel & stay in two parts: the week you are
  booked for (hotel, shuttle, the two destinations), then Goiânia in your own
  time. Cidade de Goiás is one block, not a venue card and a history article;
- `app/page.tsx` — home page composition. Day selection lives in the
  programme page.

Material files belong to a day, session or parallel track. Leave `href` absent
until the file actually exists. The Materials section updates automatically;
there is no second list to maintain.

Stable session IDs are public anchors. Do not rename them after a link or
material has been published.

## Institutional assets

Candidate production marks are in `public/logos/institutions/`. Lower-quality
assets extracted from the previous Global Pasture Watch workshop are research
references only. Sources, restrictions and unresolved permissions are recorded
in [research/logos/README.md](research/logos/README.md).

Having a logo file does not confirm permission to display it or partner status.
The page currently shows only Land & Carbon Lab, UFG and LAPIG. Any additional
mark requires approval from the relevant institution and the Time2Graze/LAPIG
team.

## Development

Requirements:

- Node.js 22.13 or later;
- npm.

```bash
npm ci
npm run dev
```

Useful commands:

```bash
npm run build        # production build in out/
npm run lint         # oxlint
npm test             # node --test over scripts/
npm run format:check # oxfmt, reporting only — see AGENTS.md before writing
```

The generated scaffold still contains 60 unused shadcn components and several
unused dependencies. Global lint currently reports issues inside that unused
scaffold and nowhere else. Removing the scaffold is a separate cleanup task and
should not be mixed with content changes.

## Deployment

Pushing `main` runs `.github/workflows/deploy-pages.yml`. The workflow builds
the static Next.js output with the repository base path and publishes it to
GitHub Pages.

Asset URLs must respect `NEXT_PUBLIC_BASE_PATH`; do not hardcode root-relative
paths. `NEXT_PUBLIC_SITE_URL` is supplied during deployment for absolute social
metadata.

GitHub Pages is the current delivery target, not a permanent hosting decision.

## Contribution rule

Keep content changes and structural changes in separate commits. Before adding
operational information, verify it with the LAPIG team. A missing fact is safer
than a confident but incorrect instruction to an international participant.
