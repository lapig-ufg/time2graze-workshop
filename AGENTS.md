# Working on this site

Read this before changing anything.

## What this is

An information site for the **Time2Graze Brazil Workshop** — an internal
technical workshop of the Time2Graze project, held at LAPIG / Federal
University of Goiás in Goiânia, 14–18 September 2026.

The audience is roughly 20–30 researchers travelling from Uruguay, Argentina,
Colombia, Tanzania, Nigeria, Uganda, Zimbabwe and Brazil. Many of them will
read this page on a phone, on hotel wi-fi, deciding what time to be in a lobby.

That audience is the whole design brief. The site exists to answer four
questions: _what is this, when is my session, where do I sleep and eat, how do
I get there._

## The brief

The stated ambition is a **complete, refined, professional** site, and the
resources to get there are available — generating and optimising images,
choosing a different icon set (Phosphor was offered; the site currently uses
lucide-react), whatever the work actually needs. This is not a minimal site by
policy.

Two things were explicitly rejected, and they are narrower than "keep it
simple":

1. **Generic AI aesthetics** — ugly dark backgrounds, neon effects, the look of
   a template.
2. **Advertising copy** — loose, near-metaphorical or promotional sentences.
   In the client's words, phrasing "a commercial guy" would write. The site is
   institutional.

Refinement is wanted. Decoration and salesmanship are not. Those are
compatible, and the difference between them is the main judgement call on this
project.

**Reference:** the previous workshop's site, given as inspiration —
https://sites.google.com/view/gpw-brazil-workshop/home

## History — please read

In August 2026 an AI assistant rewrote this site into a six-page "map sheet"
system: a cartographic metaphor with sheet numbers, a graticule background on
every surface, a coordinate plot, a gazetteer, and pages of prose explaining
the site's own navigation. It was internally consistent and it was worse. It
cost 1,555 lines of CSS, it made people translate "Sheet 05" into "hotel", and
along the way it dropped the presenter names out of the agenda.

That version was reverted on 1 September 2026.

**What was rejected there was the metaphor, not the existence of routes.** On
2 September 2026 the site was deliberately split into four pages — see
[Architecture](#architecture). Do not read the paragraph above as an argument
against that split. The test is the name: `Programme` is a destination a
participant already understands; `Sheet 05` is one they have to learn.

**The failure mode to avoid is applying craft where content is missing.** When
this site looks unfinished, it is usually because a fact has not been confirmed
yet, not because a section needs a richer treatment. Reach for the missing
fact first.

## Rules

- **Four pages, no more.** Home, Programme, Materials, Practical information —
  see [Architecture](#architecture). Do not add a fifth destination, and never
  give a single day, session, venue or hotel a page of its own.
- **Plain words for section names.** "Programme", "Materials", "Stay & meals",
  "Maps". No metaphor, no house vocabulary a reader has to learn.
- **Never invent a fact.** Unconfirmed details render as "Pending
  confirmation", "To be published" or "TBD" — visibly. Someone will act on this
  while standing in an arrivals hall. A plausible guess is worse than a blank.
- **Keep the names.** Sessions carry their presenter and institution
  (`Priorities, Barriers, and Partner Needs (Lindsey/WRI)`). That is how a
  participant knows what is expected of them. Do not compress them away.
- **No prose explaining the interface.** If a section needs a paragraph telling
  the reader how to use it, the section is wrong.
- **English only.** The working language of the workshop.

## Architecture

Four pages, literal names:

| Path          | Holds                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/`           | What, when and where; the overview; partners; and during the week, the session running now and the one due next. |
| `/programme/` | The five days, the proportional grid, print, and `.ics` once times are approved.                                 |
| `/materials/` | Presentations and documents by day, each linked to the session that produces it.                                 |
| `/practical/` | Hotel, transfers, daily transport, maps and recommendations.                                                     |

The same navigation appears on every page: `Home`, `Programme`, `Materials`,
`Practical information`. On small screens it stays in the sticky header as a
compact scrollable row — not a drawer. Four links in a row beat four links
behind a hamburger.

**`Home` is a link of its own, not only the wordmark.** The wordmark returns
home as well, but a reader three pages deep should not have to know that.

**Why it stopped being one page.** It was one page until September 2026, and
that was right while the content was short. Measured just before the split, it
ran 10 screens on a 1440px desktop and **15.6 screens on a 375px phone**, with
the main navigation set to `display: none` below 760px — so the only shortcuts
sat near the top and disappeared the moment a reader entered the programme.
Several hotel, transport, accessibility and partner details still depend on
confirmation; the corresponding sections already exist and remain visibly
pending.

**Links between pages carry their anchor**: a material points at
`/programme/#d3-country-uganda`, and the programme resolves the day from the
hash on load. Route with `next/link` and write the path from the site root —
`href="/programme/"` — letting `basePath` supply the repository subpath. The
repository name is never written by hand.

**Print belongs to `/programme/`** and covers all five days. There is no
"print the whole site".

**Static is not offline.** A participant in the field with no signal gets only
what their browser already cached. If offline access matters it needs a service
worker or a downloadable PDF — an explicit decision, not something the static
export gives for free.

## Design direction

The register is **sober institutional**, in the manner of Land & Carbon Lab
(landcarbonlab.org) — the consortium's parent brand. Restraint, real
photography, generous whitespace, no ornament. The previous edition's site
(Global Pasture Watch, Pirenópolis) is the content model; this one should
carry the same information with far better execution.

**The workshop has no mark of its own, and must not be given one.** The header
and footer carry the name set in type; an invented badge next to real
institutional marks reads as a logo the project does not have. The favicon is a
plain monogram because a browser tab needs an icon — that is a tab marker, not
a brand.

The **project** does have one, and since 9 September 2026 it leads the
institutions row: the `time2graze` wordmark, at the client's request. That does
not reopen the paragraph above. The workshop still has no badge, the header and
footer still carry the name in type, and the mark on the page is Time2Graze's
own — not one drawn for this event. It is also not an official file: it was
lifted from a screenshot of a slide and recoloured for a white background, and
`research/logos/README.md` records what was changed and what to ask the project
for.

**Palette and type are settled.** Cream-green paper (`--paper: #f5f6f2`), dark
forest (`--forest: #184b39`), pale lime accent (`--accent: #dce89b`) — the lime
deliberately rhymes with Land & Carbon Lab's accent. Cormorant Garamond for
display, Manrope for text.

**Know this hazard:** cream background plus high-contrast serif is the single
most common look in AI-generated design right now. This palette sits next to
it. What keeps the site from reading as generated is not the colour — it is
structure and detail. Do not try to fix "it looks AI-made" by changing the
palette; fix it by making the structure specific to this content.

**The thesis is measured time.** Five days, 47 scheduled items, a strict clock,
people arriving from seven time zones. The programme is not one section among
others — it is why the site exists. Everything else is reference material.

In one line: **an international operational document, with editorial finish and
temporal behaviour.**

Count carefully. "47 sessions" is wrong — the 47 includes meals, coffee breaks,
transfers and receptions. Say _scheduled items_.

**The signature is the programme, drawn to scale — on large screens only.**
The vertical axis is real time, so a three-hour workshop occupies three times
the height of a forty-five minute country presentation and the shape of a day
is visible at a glance. Parallel activities sit in adjacent columns, because
that is what they are.

**All 47 end times are confirmed.** Twenty of them were logical display
intervals for lunches, coffee breaks, check-ins, summaries, dinners and Day 5
transfers, chosen so every item had the same visual grammar; the organiser
approved them as real on 5 September 2026 and the `endStatus: 'provisional'`
markers came off. The Day 5 farm visit is confirmed as a session — which farm
hosts it stays pending on the venue field. The grid still renders the states
below whenever a future item needs one:

| State                                             | Rendering                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Confirmed interval (`start` + `end`)              | Block, height proportional to duration             |
| Provisional interval (`endStatus: 'provisional'`) | Proportional block, visibly labelled               |
| Start only (fallback)                             | Point marker on the axis, no implied height        |
| Parallel activities                               | Separate blocks in adjacent columns, same interval |
| Unconfirmed item (`status: 'tbd'`)                | Visibly marked as not yet fixed                    |

Removing `endStatus` after approval promotes the interval to confirmed — that
is exactly what happened here. Until then, visual continuity is not
operational certainty.

**Do not force this diagram onto a phone.** Below the desktop breakpoint, and
in print, use a compact chronological list — very well composed, carrying time,
duration, presenter and institution, venue, materials, calendar
action, and parallel activities grouped under their shared start. Making the
signature work at 375px would turn it into an obstacle. Responsive adaptation
here is correct, not a compromise.

Everything around the programme stays quiet. Structure should encode something
true about the content; if a device is only decorative, cut it.

### How the grid is built

Decisions that came out of building it, and that are easy to break:

- **The two representations live in the same DOM.** The grid is `aria-hidden`;
  the chronological list is what assistive technology reads at every width. On
  large screens the list is clipped out of sight rather than `display: none`,
  so screen-reader users are never left with an absolutely-positioned diagram
  as their only source.
- **The time sits in a column inside each block, not stacked above the title.**
  Stacking costs about 20px of height, which a 45-minute block at 76px/hour
  does not have — that alone clipped 11 of the blocks.
- **Blocks of 45 minutes or less lay out on one row** (`data-compact`), because
  the labelled presenter and venue fields do not fit as three stacked lines.
- **Session titles are Manrope in both representations.** They are functional
  data, and Cormorant Garamond loses legibility at 13–14px in a narrow block.
  The serif stays for section titles and day names.
- **The heading levels are h1 → h2 → h3 and must stay contiguous.** The page
  title is the h1, the day name in `.day-summary` and each printed day title
  are h2, and every session title — grid, list and evening alike — is an h3.
  Until September 2026 the day was an h3 and sessions h4, with no h2 anywhere:
  the site's only axe violation, on the one page it exists for. The CSS is
  keyed on those elements (`.day-summary h2`, `.session-body h3`), so changing
  a level means changing the selector with it.
- 76px per hour, half-hour rules, hours labelled.

### The "now" state

Only exists during the workshop week. Before and after, nothing is marked and
the panel opens on Day 1.

- **The clock is Goiânia's**, via `Intl` with `America/Sao_Paulo`, whatever
  time it is where the reader is.
- **Null while prerendering.** The site is static, so the build has no "now".
  `useSyncExternalStore` returns null for the server snapshot and the real
  clock arrives after hydration — no mismatch, no effect pushing state.
- **The displayed day is derived, not stored**: `picked ?? today ?? 0`. During
  the week the panel follows the clock on its own; a link or a reader's choice
  sets `picked` and outranks it from then on. Syncing this in an effect was the
  first attempt and it was wrong.
- **Only a session with a confirmed end can be "running".** Provisional ends
  are layout data until approved. Start-only items can still be "next".
- The now line sits behind the blocks, so it does not strike through their
  text, and its label lives in the axis gutter showing the actual time rather
  than repeating the word.

### Print

- **A separate block, `ProgrammeForPrint`, holds all five days.** The
  interactive panel carries one day, so printing it would quietly produce a
  single day. The print stylesheet hides the panel and shows this block.
- **The print lists carry no `data-session`.** Duplicating the anchors would
  give the deep-link lookup two matches for the same session.
- One day per page (`break-before: page`, `auto` on the first), no session
  split across a page break.
- Interactive chrome, the hero image and the map iframes are dropped; venue
  names, practical information, recommendations and the materials list stay —
  `/materials/` is a page of its own now, and printing it blank would be a
  bug. Only the "prepared to receive" notice is screen-only.
  Section backgrounds are forced white — tinted bands spend ink and say
  nothing on paper.

### Deep links

`#day-3` opens that day; a session id opens its day and scrolls to it.

- **No element carries an `id`** — both representations use `data-session`.
  An `id` makes the browser jump to the element on its own, before React has
  switched days, and it fights the scroll.
- **Scroll from an effect, never from `requestAnimationFrame`.** rAF does not
  wait for React to commit, so the session is not in the DOM yet and the scroll
  silently does nothing.
- **`history.scrollRestoration` goes to `manual`** when a session link is
  followed. Otherwise the browser restores the previous position after load and
  lands on top of the one the link asked for.
- **Evening sessions live outside the axis**, so the lookup covers the evening
  block as well as the grid — it picks whichever match is not inside
  `.session-list`.
- `scrollIntoView` is called without `behavior`, letting the CSS decide; the
  `prefers-reduced-motion` rule already switches it to instant.
- **The day tabs are anchors, not buttons** — `<a role="tab" href="#day-N">`
  with the click intercepted, so modifier-click, open-in-new-tab and copy-link
  all work while the tab semantics (roving tabindex, arrow keys) stay intact.
- **A hash that resolves to nothing is announced** (`role="status"`), not
  silently dropped — a stale session link landing on Day 1 now says so.
- **`[data-session]` carries `scroll-margin-top: 160px`** so a deep-linked
  session clears the sticky header. The session scroll uses `block: center`,
  which ignores scroll-margin — 160px covers the header plus half a block.

### One rail

Every full-width band on the site measures from the same two vertical lines,
and the tokens exist so that stays true: `--gutter` is the calha, `--wide` caps
the band, and `--rail` is `--wide` minus two gutters — the width the content of
a padded section is allowed to reach.

There are two shapes, and they must not be mixed:

- **A band** (`.now-band`, the home hero, the footer) is the
  element itself: `max-width: var(--wide)`,
  `margin: 0 auto`, `padding-inline: var(--gutter)`.
- **A section** (`.section-pad`) keeps its background full-bleed and pads
  itself by `var(--gutter)`; its children are capped at `var(--rail)` and
  centred.

Both put the content edge in the same place at every width. Padding the outer
element in one and the inner element in the other does not: below `--wide` the
two agree, and above it they diverge by exactly one gutter, so the page looks
correct on a laptop and comes apart on a wide monitor. That is how it broke the
first time.

The same trap has a second form. `.section-pad > *` centres with
`margin-inline: auto`, so any child that later sets the `margin` shorthand —
`.programme-facts` needed a negative top margin — has to write `auto` for the
inline sides. Writing `0` silently left-aligns that one band while everything
around it stays centred, which is invisible until the viewport is wider than
`--rail`.

**The first band on a page takes less padding above it.** `.section-pad`'s
`clamp(90px, 10vw, 145px)` is the distance between two bands, and mid-page
there are two things to hold apart. At the top of a page there are not: the
header has just closed with its own rule. Measured on a 1680px monitor, the
inner pages opened with 146px of blank between the header and the word
`Programme` — that is not breathing room, it is a wait before the page says
what it is. `main > .section-pad:first-child` takes `clamp(46px, 5.2vw, 88px)`
instead.

Two things about that rule are load-bearing. It is keyed on
`:first-child` of `main`, so it reaches `/programme/`, `/materials/` and
`/practical/`, which open straight into a band, and not the home page, which
opens with the hero — the hero's whitespace is inside a drawn frame and reads
as composition rather than as a gap, which is why the home never felt empty.
And it sits inside `@media screen`: the selector outranks the `.section-pad`
in the print block, so without that fence it would win on paper too and swap
the printed `14pt` for screen pixels.

### The home page

The home page carries three bands before the overview, in this order, and the
order is the argument: what is happening now, what this is, where to go next.

- **`NowNext` comes first, above the hero.** During the workshop week it is the
  most useful thing on the site, and it renders nothing on the other 360 days,
  so it costs no space when it has nothing to say. It is not sticky: it is an
  announcement, not a control.
- **The hero is a two-column grid** — summary and photograph — capped at
  `--wide`. It remains side by side through wide tablets and stacks below
  960px; stacking it at 1050px made the opening nearly a screen taller at the
  exact width where space was already scarce.
- **Operational facts are distributed without a separate docket.** Date and
  location stay in `.hero-meta` at every width; duration and scheduled-item
  count live in the Programme card; format and host live in the overview. The
  same facts must not be restated in a third visual panel.
- **The hero has one primary action: `View programme`.** It remains available
  before the photograph on a phone, while Materials and Practical information
  belong to the directory immediately below. Repeating both Programme and
  Practical information as buttons and cards weakened the hierarchy.
- **The hero closes with one continuous ink rule.** The directory touches that
  rule and completes the same editorial frame. Do not restore a caption strip
  on the photograph or leave the rule drawn under only one column; either one
  recreates the visual step this composition removed.
- **There is one navigation block, not two.** A strip of five day links to
  `/programme/#day-1…5` sat here until September 2026 and was removed: it put
  eight links in two stacked rows before any content, and it offered a second
  route to the page the `Programme` card already leads to. `#day-3` is still a
  public deep link — the programme rewrites the hash as the reader changes day,
  and arriving on one scrolls to the day tabs — it just is not advertised as a
  menu of its own.
- **The directory carries a status per destination**, `data-status="neutral"`
  or `"pending"`. `Draft programme` is neutral because a draft is a normal
  state, not an outstanding item; only genuinely missing information is amber.
- **The band names no venue.** It used to, for meals, breaks and social items
  (`Lunch @ Cidade de Goiás`), which left it as the one surface on the site
  naming a place after the programme and the `.ics` went silent on 5 September 2026. The organiser removed it: what a participant needs from the band is
  that the interval exists, not where to stand. Daily movement is the workshop
  shuttle, and Travel & stay holds the places.

`/programme/` and `/practical/` each carry one band of the same kind —
`.programme-facts` and `.practical-status-line`. The programme's includes the
official timezone, which is the one fact a reader in another country cannot
infer. All four bands are hidden in print.

### Motion

Movement was added in September 2026 and is deliberately small. One curve and
three durations live in `:root` as `--m-ease`, `--m-quick` (a state returning
under the cursor), `--m-move` (a change the reader asked for) and `--m-enter`
(the page opening). Every transition on the site uses them; a new one written
in loose seconds re-forks the vocabulary the tokens exist to hold together.

The wordmark in the header carries the hero eyebrow's two-colour rule — pale
lime and dark forest — to its left, and it stands upright: the eyebrow lies
down because it opens a line of text, this one stands because it marks a
two-line wordmark. The colours keep their reading order in both — pale first,
forest second, which is top-to-bottom in the hero and left-to-right here, so
the darker line is the one touching the name. It takes no declared height;
spanning both grid rows with `align-self: stretch` makes it exactly as tall as
the lockup whatever the type size. The footer repeats the name but not the
rule: the footer is not an opening.

Four decisions here are easy to undo by accident:

- **Nothing animates in print.** `@media print` nulls `animation` on
  everything. An entrance using `both` that a print renderer does not run would
  freeze on its first frame, and the first frame is opacity zero — a blank
  agenda on paper.
- **The scroll entrances are CSS, not JavaScript**, via `animation-timeline:
view()` behind `@supports`. A browser without it drops the rule and opens the
  page fully visible, which is the correct state and not a fallback. An
  IntersectionObserver has no such exit, and `/materials/` is a server
  component that must keep shipping no script of its own.
- **They are also inside `prefers-reduced-motion: no-preference`.** The global
  rule at the top of the stylesheet zeroes durations, and a scroll timeline
  ignores duration entirely — without that media query, a reader who asked for
  less movement would get exactly the effect they asked not to see.
- **Only blocks shorter than the viewport get a scroll entrance.** The `entry`
  phase lasts the element's own height, so a tall one — a day of materials, a
  card on the practical page — would still be fading while it is being read.
  `.resource-group` and `.practical-card` are excluded for that reason.

The day panel on `/programme/` fades on a day change because the panel is
keyed by the active day and remounts. That animation is opacity only, and must
stay that way: `scrollToSession` measures the same commit, and a transform
would move the target under it.

## Functional standard

Refinement here means utility executed well, not features added:

- **"Today" state**, computed in `America/Sao_Paulo`. Before the workshop the
  site opens on Day 1 and marks nothing as current. From 14–18 September it
  opens on the right day and marks the running session. Afterwards it returns
  to being an institutional archive.
- **Deep links.** `#day-3` and a stable anchor per session, so a material or a
  message can point at one session.
- **Print.** People print agendas. All five days in sequence, one per page
  where possible — which means every day must reach the print output, not only
  the selected tab. Printing the active panel alone would be a bug.
- **Add to calendar** (`.ics`, per day and per session). High value, but **only
  after times and timezone are confirmed** — venues are never exposed. The
  calendar went final on 5 September 2026 once the organiser approved every
  interval; generating files from provisional data pushes wrong times into
  thirty people's phones. The live Google Calendar is generated from the same
  files and inherits this gate — see
  [The live Google Calendar](#the-live-google-calendar).

## Data model

Extract content into typed data before any redesign. Keep the model small:

```ts
type WorkshopSession = {
  id: string; // hand-written, stable, never derived from the title
  date: string; // full ISO date, not "Day 3"
  start: string;
  end?: string; // display interval; inspect endStatus before operational use
  endStatus?: 'provisional'; // visibly provisional; never drives Now or .ics
  title: string;
  speakers?: Speaker[];
  venueId: string | null; // registry id, recorded but not rendered — see below
  kind: 'technical' | 'meal' | 'break' | 'transport' | 'field' | 'social';
  tracks?: ParallelTrack[]; // parallel activities modelled explicitly
  materials?: Material[];
  status?: 'confirmed' | 'tbd';
};
```

- IDs are written by hand and never change once a material links to one.
- Official timezone is `America/Sao_Paulo`.
- One venue registry, referenced by both the agenda and the maps.
- Parallel activities are two entries sharing an interval — never one combined
  title. Day 1 at 10:00 is currently a single string holding two courses; that
  is a modelling error to fix, not a formatting choice.
- Unknown fields stay absent or `tbd`. The calendar build fails while any
  item carries a provisional end or `tbd` status, so a new unresolved session
  breaks the build rather than shipping a wrong time.
- **`venueId` is carried on every session and rendered nowhere.** It is
  required rather than optional so a place is recorded where one is known, but
  no surface reads it any more: the programme and the `.ics` dropped venues on
  5 September 2026 and the home band followed. `data/venues.ts` still feeds
  Travel & stay, keyed by its own ids. Do not read this as a field to revive
  on a whim — putting a venue back on the agenda is an organiser's decision,
  and the one place that would render it is `sessionTitle` in
  `lib/schedule.ts`.
- **Materials is an aggregated view of files attached to sessions**, not a
  second list maintained by hand. `lib/materials.ts` reads the agenda; there is
  nothing to keep in step.
- A material's `href` is absent until the file exists. Never invent one, and
  never write a path for a file that has not been uploaded. When the file does
  arrive under `public/`, write it site-rooted (`/files/day-1-slides.pdf`, not
  under `/materials/`, which is a route); the materials page adds `basePath`
  to it, because a plain `<a href>` does not get it for free — see
  [Running and deploying](#running-and-deploying).
- Files belonging to a whole day rather than a session go on `Day.materials` —
  the Day 5 field visit sheet is one. Forcing it onto an arbitrary session
  would be a small lie.
- A track's files link back to the session that holds it, because that is what
  the programme anchors.

Extract the data with no visual change at all, as its own step.

## Type and detail rules

- **12px is the floor for metadata only** — eyebrows, captions, labels.
  Functional text belongs at **14–17px**. This was written when the CSS bottomed
  out at 8px for uppercase labels, which was both an accessibility failure and
  one of the most recognisable tells of generated layout. The scale lives in
  `:root`; reach for a token rather than a literal. `.fact-list dd`
  was the last literal 12px on functional text and became `--t-meta-lg` in
  September 2026 — the `dt` beside it keeps the floor, which is what the floor
  is for.
- **The scale is fluid between 1024px and `--wide`.** Every token holds its
  floor to 1024px and reaches its ceiling at 1600px: `--t-label` 12→13,
  `--t-meta` 13→15, `--t-meta-lg` 14→16, `--t-body` 15→17, `--t-body-lg` 16→18
  and `--t-head-sm` 18→21. The floors are the sizes the site shipped with, so
  the phone this page was designed around is untouched; the ceilings answer a
  September 2026 report that the type was too small on a desktop monitor, which
  is read from further away and where the rail is already at its widest. One
  `--t-ramp` expression — 0 at 1024px, 1 at `--wide` — drives all six, so they
  cannot drift apart; a new token multiplies that ramp rather than writing its
  own vw. `--t-body-lg` is the 16px band, which is also the floor iOS needs to
  not zoom a focused input; `--t-head-sm` is for the sans subheadings inside a
  card, and travels further so it stays clear of `--t-body` at 17px.
- **The timeline's `--hour` rides the same ramp** (76→88px). A `.tl-block` is
  as tall as its session is long and clips what does not fit, so growing the
  titles without growing the boxes would cut the short sessions off on exactly
  the monitors the growth is for.
- **Print and the mobile overrides never leave the floor.** A print page box is
  narrower than 1024px, and the `max-width` blocks sit inside it, so both keep
  the literals they were written with — those are deliberate step-downs, not
  tokens waiting to be substituted.
- **Tabular numerals for times** (`font-variant-numeric: lining-nums
  tabular-nums`) so the time column aligns exactly. Write both keywords:
  `font-variant-numeric` is one property, and a bare `tabular-nums` sends the
  figure style back to the font's default, which is the next bullet's problem.
- **Lining figures, declared once on `body`.** Cormorant Garamond's default
  figures are old-style — 1999 with two descending nines, a 4 and a 3 that drop
  below the baseline. That is correct in running serif text and wrong for what
  this site sets in the serif: years, dates, editions, counts and distances,
  read as data at 32–60px, where uneven heights read as a wobble. It was
  reported as exactly that on 10 September 2026 and fixed in one inherited
  declaration, which reaches the hero's `14–18`, the wordmark's `2`, the day
  tabs, the story facts and the step years. Manrope's figures are already
  lining, so nothing sans moved.
- **Every display figure on the site is set in Manrope**, at weight 750 with
  `letter-spacing: -.045em` and `lining-nums tabular-nums`. Same reasoning that
  keeps session titles out of the serif on the grid: a figure is functional
  text. This started as FICA's counts alone, with the dated spines left in the
  serif; the client asked on 10 September 2026 for the same treatment
  everywhere, and it now covers `.story-facts dd`, `.story-steps-year`,
  `.story-observatories-figure` and `.story-campuses-figures dd` — LAPIG's
  1994, FUNAPE's 1,772 m², the town's `1727 · 1937 · 2001`, Goiânia's steps and
  UFG's 114 / 22,000+ / 6. **Each ceiling came down by about a sixth** when it
  moved (48→43, 52→44, 54→46, 36→32): Manrope is optically larger than
  Cormorant at the same size, and keeping the old numbers would have made every
  band heavier than the one it replaced. What stays serif is the display voice
  that happens to contain digits — the `Time2Graze` wordmark, the hero's
  `14—18`, `Mon · 14 Sep` on the day tabs, `Day 1 · Welcome` on materials.
  Those are names and headings, not measurements.
- **No third typeface.** Cormorant Garamond and Manrope are enough. Reach for
  weight, size and spacing before reaching for a new family.

## Implementation order

1. Typed data structure, no visual change.
2. Typography and accessibility corrections.
3. Proportional agenda on desktop, chronological list on mobile.
4. `#day-3` links and per-session IDs.
5. Print output covering all five days.
6. "Today / Now / Next" state in `America/Sao_Paulo`.
7. `.ics` files — once times are confirmed.
8. Materials linked to their sessions.
9. Hotel and transport, as data is confirmed.
10. Toolchain migration to Next.js, so that routes actually emit HTML.
11. The four-page split and its persistent navigation.
12. Offline: a service worker or a downloadable PDF — decide, do not assume.

## Planned scope

The empty-looking sections are **deliberate stubs**, not clutter to remove.
The site is meant to grow into a full workshop hub and will receive:

- the actual files for the 21 materials already declared on their sessions
- hotel details, booking and check-in information
- detailed maps of the venues; the city and town maps arrived on
  8 September 2026 — see [Goiânia and Cidade de Goiás](#goiânia-and-cidade-de-goiás)
- participant recommendations: arrival and local guidance. The orientation
  section is not this. Local guidance is still blocked on LAPIG

Build these out as the real content arrives. Do not delete the placeholders,
and do not fill them with invented detail in the meantime.

## Layout

```
app/layout.tsx               Fonts, metadata, and the header/footer every page gets.
app/page.tsx                 Home: today's session, hero, directory, overview.
app/programme/layout.tsx     Route metadata. The page is a client component.
app/programme/page.tsx       Day tabs, deep links and the printable programme.
app/materials/page.tsx       Materials by day. A server component: no state.
app/practical/layout.tsx     Route metadata for the stable /practical/ route.
app/practical/page.tsx       Travel & stay, in two parts. A server component.
app/not-found.tsx            404, listing the same four destinations.
app/globals.css              Shared tokens, screen, responsive and print styles.
app/travel.css               Styles owned by Travel & stay.
components/site-header.tsx   Persistent navigation, with the current page marked.
components/site-footer.tsx   Footer, shared by every page.
components/now-next.tsx      The home page's "happening now", workshop week only.
components/programme.tsx     Proportional, chronological and print programmes.
components/venue-card.tsx    A place you navigate to (hotel, LAPIG): actions, copy, map.
components/friday-visit.tsx  Cidade de Goiás as one block: the coach, then the town.
components/orientation.tsx   Travel part two: Goiânia's context and the free-time map.
components/free-time-map.tsx Embedded reference Google My Maps for free time.
components/whatsapp-mark.tsx The WhatsApp glyph, inlined. lucide carries no brand marks.
components/recap.tsx         The day's published record, the control that flags a line as wrong, and the organiser's live editor.
components/add-to-calendar.tsx  .ics downloads, subscription URL and the share form.
hooks/use-tab-keys.ts        Arrow-key movement for the day tablist. Horizontal only.
data/agenda.ts               The five days, sessions, tracks and materials.
data/types.ts                Content contracts.
data/venues.ts               The single venue registry: names, pins, addresses.
data/practical.ts            Accommodation, contracted shuttle and selected guide links.
data/contact.ts              The participants' WhatsApp group: the one link that leaves the site.
data/recaps.ts               The daily recaps, one entry per day, written the evening of that day.
data/recap-prompts.ts        The NotebookLM prompt per day. The organiser's drafting tool; never rendered.
data/geography.ts            The two towns: figures, chronologies, map markers, drawn geometry.
data/institutions.ts         The marks cleared for display, with their artwork sizes.
data/navigation.ts           The four destinations. The header and the 404 share it.
hooks/use-workshop-clock.ts  Client clock with a null server snapshot.
hooks/use-flagged-lines.ts   Which recap lines this browser has already flagged.
lib/base-path.ts             The one place a raw path gets the Pages basePath.
lib/deep-link.ts             Day/session hash resolution and scrolling.
lib/materials.ts             Materials view derived from the agenda.
lib/recap.ts                 Recap lookup, section headings and stamps.
lib/recap-text.ts            The corrected NotebookLM draft, parsed into the live recap.
lib/recap-feedback.ts        A reader's correction, sent to the Apps Script.
lib/recap-live.ts           Reads and publishes the live recaps: a GET and a POST, not JSONP.
lib/apps-script.ts           The web app URL and the JSONP transport both endpoints share.
lib/now.ts                   Goiânia clock and Today/Now/Next rules.
lib/places.ts                Map embed, map link and ride link, from coordinates.
lib/schedule.ts              Time, duration and programme-axis helpers.
lib/calendar.ts              RFC 5545 .ics generation for the agenda.
scripts/build-calendar.mjs   Writes public/calendar/ before dev and build.
next.config.ts               Static export, trailing slash and the Pages basePath.
postcss.config.mjs           Tailwind, imported by globals.css for its reset only.
public/                      Hero, social preview, favicon, logos and calendar files.
research/logos/              Logo provenance and previous-site references.
research/venues.md           Where every address, pin and photo licence came from.
research/geography.md        Sources for every figure in that section, and the map licences.
research/build-maps.py       Regenerates the two map outlines. Not part of the build.
apps-script/                clasp project: live calendar sharing, daily .ics sync, recap corrections, live recaps.
docs/daily-recap.md         How a day gets summarised, published and corrected. The nightly procedure.
lib/calendar-sharing.ts     Calendar access request to the Apps Script web app.
```

Only what needs the browser is a client component. `/programme/` is one, for
day selection, deep links and the clock. `/practical/` is not: it became a
server component when Travel was rebuilt around venue cards, and
`components/venue-card.tsx` is the client part, owning the copy feedback and
the map disclosure. `/materials/` is a plain server component and ships no
JavaScript of its own; keep both that way. Content stays in typed data modules
rather than being declared inside a component.

## Where content lives

- Edit `data/agenda.ts` to change a session, presenter, track or expected
  material. It feeds `/programme/`, `/materials/`, the home page's
  "happening now" band and the calendar files at once.
- Edit `data/venues.ts` to change a venue, its pin or its address. The
  programme, the agenda lines and the location panel share this registry.
  Record where a new fact came from in `research/venues.md` at the same time.
- Edit `data/geography.ts` for the Goiânia and Cidade de Goiás section, and record the
  source in `research/geography.md` in the same commit. An orientation pin is
  not a venue: see [Goiânia and Cidade de Goiás](#goiânia-and-cidade-de-goiás).
- Edit `data/recaps.ts` to publish or revise a day's summary, following
  [`docs/daily-recap.md`](docs/daily-recap.md) — the item ids in it are what
  reader corrections point at, so they are assigned by that procedure and not
  by hand on a whim. See [Daily recaps](#daily-recaps).
- Edit `data/contact.ts` to change the participants' group link. The home strip
  and the footer both read it; neither writes a URL of its own.
- Materials are declared on the day, session or track that produces them.
  `lib/materials.ts` aggregates them; do not recreate a hand-maintained list.
- The four page components compose the data. Do not move operational facts
  back into their JSX.

## Locations

The location panel on `/practical/` presents each venue: a photograph, a map,
the address, the coordinates and a way to get there. Rules that came out of
building it, and that are easy to break:

- **Pins come from coordinates, never from a search string.** A search string
  is re-resolved by someone else's geocoder on every load, so the place a
  reader sees is whatever that query returns today. The registry carries
  `coords`; the `mapQuery` it used to carry is gone.
- **A sourced pin is not a confirmed pin.** `research/venues.md` records where
  each one came from and what cross-checked it. A venue with no sourced
  coordinate stays off the panel rather than being given an approximate one.
- **Maps are OpenStreetMap embeds** — coordinate-exact and with no API key to
  expose in a static export. They remain a third-party surface governed by
  OpenStreetMap's privacy terms. ODbL attribution is required, and is rendered
  under the panel.
- **An address is printed only once the venue or the host has confirmed it.**
  LAPIG's published address carries a probable typo and a Caixa Postal CEP, so
  the panel shows its locality and a visible pending note instead. A plausible
  address is worse than a blank one for someone reading it out to a driver.
  Candidate addresses stay in `research/venues.md`, not in operational fields
  on the page. Centro de Eventos and Favo de Mel were removed from the registry
  in September 2026 as unconfirmed; their research notes remain in that file and
  a venue returns to `data/venues.ts` only with a sourced pin.
- **A photograph has to be authorised.** Google Maps and Places photographs are
  third-party copyright and cannot be republished — a screenshot does not
  create a licence. Until a venue supplies one, the panel shows a visibly empty
  slot. Wikimedia Commons holds CC BY-SA 4.0 photographs of the campus if an
  interim image is ever wanted; candidates are listed in `research/venues.md`.
  Every published photograph follows its recorded permission terms; the
  LAPIG-owned hero is explicitly cleared for use without visible attribution.
- **The ride link is Uber's documented universal link** (`m.uber.com/looking`,
  with `pickup=my_location` and `drop[0]` as an encoded location object), built
  from the coordinate and confirmed address: the site needs no API key or Uber
  integration account, though the passenger still signs in to Uber to request
  the trip. 99 has no documented equivalent, so the panel says the link opens
  Uber and offers the address and coordinates for every other app. Never
  generate a ride link for a pin that is not right — it
  carries someone to a point, not to a name they can re-read. In the registry
  this gate is the `ride` flag. Golden Lis carries it because its own source
  confirms address, pin and phone; LAPIG carries it by the organiser's explicit
  authorisation of 5 September 2026 over its existing sourced pin, which is not
  the same as a confirmed street address — the card still says so. Cidade de
  Goiás gets no ride: see the next rule.
- **A venue the workshop drives people to gets no `ride` flag, and no venue
  card either.** Cidade de Goiás is reached by the 06:30 bus on day 5;
  offering a ride there would propose a 130 km taxi for a journey that is
  already arranged. The `organisedTransport` flag that used to encode this was
  removed on 9 September 2026, when the town stopped being a venue card at all:
  a place nobody navigates to needs no directions button and no copyable
  municipality centroid. `components/friday-visit.tsx` renders it instead, and
  the absent `ride` flag carries the reasoning. See the 9 September entry below.

## Goiânia and Cidade de Goiás

The last section of `/practical/`, added 8 September 2026. It answers *where am
I* for participants who have never been to central Brazil.
`components/orientation.tsx` composes it, `data/geography.ts` holds it,
`research/geography.md` sources every figure.

**The two modules are a pair, and the pairing is the argument.** Goiânia was
drawn on paper from 1933 to replace the capital Cidade de Goiás had been since
1739, and the 1937 transfer appears in both chronologies from its own side. The
maps carry the same contrast without saying it: a radial plan laid out on the
plateau, and a town strung along the Rio Vermelho between two ranges of hills —
which is what UNESCO inscribed the historic centre for. The second module was a
map of the *state* for one draft; it was the wrong pair, because a state has no
such relationship to a city. Do not restore it.

**It is orientation, not recommendation, and the difference is the whole
design.** The organiser judged the central district of Goiânia unsafe for
visiting participants on 3 September 2026 and the self-guided Art Deco route
came off the site then (`research/local-guide.md`). That still stands. This
section says where things are; it never suggests going to one. No verb on it
invites an excursion, Praça Cívica appears as the geometry of the 1933 plan
rather than as a destination, and the four markers in Cidade de Goiás describe
the town the workshop is taken to as a group on Friday. Written guidance on
independent movement is still owed by LAPIG; until it arrives the site stays
silent, and adding a reassurance here would break that silence.

**An orientation pin is not a venue.** `data/venues.ts` governs places a
participant is sent to, and its rule — a pin nobody has confirmed does not get
a ride link or an address — is untouched, because nothing here sends anyone
anywhere. The airport, Praça Cívica and the town's museums and churches live in
`data/geography.ts` with no action attached. A place that becomes operational
moves to the registry and takes the registry's confirmation with it.

**Two claims about the Rio Vermelho's banks come straight from the UNESCO
citation and go no further.** The Rosário's right-bank position and the reason
it is named are quoted from it. The Casa de Cora Coralina's bank is left
unstated on purpose: its sources place it beside the bridge, and left and right
bank are defined looking downstream, so it cannot be read off the map. Do not
"complete" that line.

**Each map is a real basemap with an overlay drawn on it.** The first version
drew everything — a municipal boundary, a river, four pins — and the organiser
rejected it in the words that should settle any repeat attempt: *só um contorno
sem significado*. An administrative outline with no city inside it is a shape,
not a map. Do not go back to it. `research/build-maps.py` stitches MapTiler
tiles to each frame, writes `public/images/maps/*.webp`, and prints the blocks
for `data/geography.ts`; re-running it must reproduce them.

**The MapTiler key lives in `MAPTILER_KEY` and never in a committed file.** It
is used on the machine that regenerates the images; what ships is the `.webp`,
so the site builds and deploys with no key and no runtime call to anyone.
MapTiler rather than Google because Google's Static Maps terms forbid storing
the rendered image, and committing it is the whole approach. The free tier
serves tiles but not rendered maps, which is why the frame is stitched locally.
Attribution to MapTiler **and** OpenStreetMap is required wherever a map is
shown; both captions carry it.

Decisions in the plates that are easy to undo by accident:

- **The overlay's viewBox is the image's own pixel space.** A pin lands on the
  street it was computed from only because both sides are Web Mercator on the
  same frame. Change the projection on one side and everything silently slides.
  The pin coordinates are printed by the generator; never nudge one by hand to
  make it look better placed.
- **MapTiler serves 512px logical tiles, 1024px at `@2x`.** Assuming the usual
  256 pasted every tile at half its width, and the seams showed as a tonal
  checkerboard with the labels sliced at every join.
- **Pick the zoom for the width the map is *displayed* at, not delivered at.**
  Tiles render labels for the zoom's own pixel scale, so choosing a zoom for
  the 2x pixel count renders every name for a map twice the size it is shown at
  and the labels come out unreadable — which was the original complaint.
  `pick_zoom` targets the plate's displayed width and `@2x` adds the sharpness.
- **`basic-v2-light`, not `streets-v2-light`.** Mixed-case labels rather than
  uppercase, and at the town's zoom `streets` labels every bar and burger
  joint. This is an institutional site.
- **The river is drawn on top because the basemap omits it**, and in both
  modules it is the subject: Goiânia's one watercourse, and the line the UNESCO
  citation says the town's whole plan is adapted to.
- **The scale bar is a real scale**, computed from `kmPerUnit` — the frame's
  true width in kilometres over the image width — not drawn to look right.
- **Distances are straight-line and say so.** Haversine, not road distances.
  Cidade de Goiás is 126 km straight-line and about 130 km by the road the
  Friday bus takes; both are correct and the caption is what keeps them from
  reading as a contradiction.
- **The plate is `aria-hidden` and the numbered legend is the source**, the
  same division the programme grid makes. Marker and legend entry come from one
  `MapPlace` record, so a map cannot carry a pin the list does not explain.
- **The locator inset is the one thing still drawn from vector data**, keeps
  its own equirectangular projection, and shares no frame with the basemap
  under it. It exists because a 1.8 km street plan is unplaceable for a reader
  who has never been to Brazil.
- **The origin carries no distance, and the town has no distance column at
  all.** Rendering `distance ?? origin` put the word "Golden Lis" in the
  hotel's own distance column; the caption names the reference point instead.
  In the town every marker is within 750 m of the next.
- **`.orient-lede` and `.orient-aside` are capped at 760px.** Past roughly
  1400px the text column reaches 950px and pulls each legend distance so far
  from its name that the pair stops reading as one row.
- **`.orient` is the one `.travel-section` that may break across printed
  pages**, because it is several pages tall; each module holds together
  instead. The plates stay in print — a sheet is the offline copy someone
  actually carries — floated at 62mm.

**Overpass mirrors fail in a way that looks like success.** One answered HTTP
200 with `elements: []`, which the script cached and turned into a map with no
river on it. A blank layer is the one failure mode that looks finished, so
`overpass()` treats an empty result as a failed request, deletes the cache file
and moves on. Keep that check if the fetching is ever rewritten.

No temperature, humidity or clothing advice. Aggregator weather sites were the
only source available for those, and field guidance belongs to LAPIG; the
climate fact on the page is a season, not a forecast.

## Images

**The hero is now real photography.** `public/time2graze-hero.webp` is a crop of
an aerial pasture photograph owned by LAPIG. The site owner confirmed on 3
September 2026 that it requires no visible attribution. `public/og.png` uses
the same source in an editorial social-preview card with the confirmed event
name, date and location; `public/time2graze-whatsapp-card.png` is its published,
cache-independent copy. The provenance is recorded in `research/venues.md`.

The practical page also carries sourced photographs of the LAPIG façade and
the historic centre of Cidade de Goiás. The latter is contextual — it does not
stand in for either Day 5 farm. Never use stock imagery or a decorative picture
as if it depicted a workshop location.

Serve new raster images as WebP. `og.png` stays PNG for social-preview
compatibility.

### Institutional marks

The home page groups the marks by role. Two rules came out of drawing them, and
both are easy to undo by accident:

- **No plate under a mark.** Each logo used to sit in a bordered white tile on
  a white section — a box drawn around every logo that said nothing about it.
  The marks sit directly on the section, separated by the role columns alone.
- **Every asset is cropped to its own artwork, and the marks are drawn to a
  shared optical area** (`MARK_AREA` in `app/page.tsx`), not a shared height:
  at one height a three-to-one wordmark reads far larger than an upright
  emblem. The `width`/`height` in `data/institutions.ts` are the artwork's own
  dimensions and are what the scaling reads, so a new logo must be cropped to
  its ink before its numbers go in. `research/logos/README.md` records the crop
  applied to each file.

## Running and deploying

```
npm run dev           Local dev server on :3000
npm run build         Static export into out/
npm run lint          oxlint
npm run format:check  oxfmt, reporting only — see below
```

**There is deliberately no `npm run format`.** It existed, it was one word, and
`oxfmt` writes in place by default with no preview. On 9 September 2026 it was
run across the repository and committed as `Apply oxfmt across the repository`:
38 files, 3020 insertions, including 2628 lines of `app/globals.css` and the
deployed Apps Script sources. Nothing was broken by it — but it buried the
feature it travelled with in mechanical churn, and it collided with every other
branch in flight, four days before the workshop.

The script is now split: `format:check` reports and never writes, and
`format:write` exists for someone who has decided to reformat on purpose.
`.oxfmtrc.json` additionally keeps the formatter away from `*.css`, `*.md`,
`*.json` and `apps-script/**`. Three of those are composed by hand and one is
live code — `apps-script/sync.gs` carries a literal NUL byte as the separator
in its content hash, which is why git reports that file as binary and why it
must not be casually rewritten.

**This repository has never been formatted, and that is not a defect to fix.**
`format:check` reports 31 files, and it will keep reporting them. Reformatting
is a decision to take on its own, in its own commit, when nothing else is in
flight — not a tidy-up bundled into someone else's change.

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which builds
and publishes `out/` to https://lapig-ufg.github.io/time2graze-workshop/

**Why Next.js and not `vinext`.** The site was built on `vinext`
1.0.0-beta.5 until September 2026. Its static export could not emit a second
route: a throwaway `/probe` returning nothing but an `<h1>` was classified
`? Unknown` and skipped, no `probe/index.html` was written anywhere in
`dist/`, **and the build still exited successfully.** A silent 404 in
production is not an acceptable failure mode for a site people read while
travelling. Next.js `output: 'export'` writes one HTML file per route. If the
toolchain is ever changed again, prove routing with a throwaway route and a
real deploy before moving any content.

GitHub Pages is the **current** host, chosen to get the site up quickly; it is
not a permanent commitment. The Cloudflare Workers configuration was removed
with `vinext`, since it depended on that server; moving host again means
choosing a new target, not restoring the old one.

`NEXT_PUBLIC_BASE_PATH` is set by the deploy workflow from the repository name.
Know what it does and does not cover:

- `basePath` in `next.config.ts` prefixes `next/link` hrefs and everything
  under `_next/` automatically. Route with `next/link`, and give it the path
  from the site root: `href="/programme/"`, not `href="programme/"`.
- It does **not** touch a plain `<img src>`, a raw `<a href>` or a metadata
  icon. Those go through `withBasePath` in `lib/base-path.ts` — the hero image,
  the favicon, the material downloads and the venue photographs all call it.
  Add a new raw path to that helper rather than reading the environment
  variable again.

**Never write the repository name into a path.** `/time2graze-workshop/…` is
what the browser sees and the wrong thing to put in the source: `basePath`
supplies it at build time, and hardcoding it breaks `npm run dev` and any move
to a host that serves the site from its root.

**This will matter when the material files arrive.** A material's `href`
renders in a plain `<a href>`, so a file under `public/` would 404 on Pages
without the prefix. `withBasePath` handles it, for site-rooted paths only;
external URLs pass through untouched. Keep material files out of
`public/materials/`, which collides with the `/materials/` route.

## The live Google Calendar

`apps-script/` is a Google Apps Script project, pushed with `clasp` (installed
and authenticated on the working machine). It owns one dedicated calendar —
_Time2Graze Brazil Workshop_, never the organiser's own — and does two jobs:

- **Sharing.** The deployed web app receives `?action=share&email=…` and shares
  that calendar with the address as a reader, `sendNotifications: true`, so
  Google sends the invitation and the participant accepts it. An account
  cannot be subscribed silently. The address is checked against the calendar's
  ACL list first, so a repeat request answers "already" and sends nothing.
  A soft daily cap (`DAILY_SHARE_LIMIT` in `apps-script/code.gs`) keeps this
  public endpoint from being used to mass-mail invitations.
- **Sync.** `syncFromSite()` fetches the published
  `/calendar/time2graze-workshop.ics` and makes the Google Calendar match it:
  events are matched by UID, patched only where a content hash changed, and
  deleted when they leave the feed. A daily trigger (armed once by `setup()`)
  keeps it current. **The published .ics is the single source of truth** — the
  script holds no second copy of the programme, and a feed with fewer than
  five events is refused rather than wiping the calendar. Changing the agenda
  and pushing the site is the whole update procedure; the script is not
  touched again.

**Why JSONP and not fetch.** Apps Script responses carry no CORS headers: a
POST from the site is unreadable and a plain GET fails. The site loads a
`<script>` tag with a validated callback name (`lib/calendar-sharing.ts`) and
the endpoint answers `callback({...});` as JavaScript. The address is visible
in the URL — accepted because it is a single field for a workshop of thirty,
not a credential.

**Never import the .ics into Google Calendar manually.** Importing creates a
second, frozen workshop agenda that never syncs again. On 5 September 2026 a
manual import of the beta feed ("Time2Graze Brazil Workshop · Beta",
`…@import.calendar.google.com`) duplicated the agenda with stale locations
next to the synced one; it was deleted with `removeImportedBetaCalendar()` in
`apps-script/sync.gs`, which is guarded to only ever remove an @import
calendar. `syncFromSite()` now ends with
`warnOnDuplicateWorkshopCalendars()`, which logs a warning whenever another
"Time2Graze…" calendar is visible to the account — a recurrence is seen in
the next daily sync's log, not discovered by a participant. Participants
importing the .ics into _their own_ calendar apps is fine and intended; the
damage is only a second calendar in the account that hosts the synced one.

**Deploying the script.** Only when the endpoint logic changes — never for a
programme change. `cd apps-script && clasp push`. The first deployment is a
web app: script.google.com → Deploy → New deployment → Web app, "Execute as
me", access "Anyone" — `appsscript.json` already carries these defaults and
the scopes, and running `setup` once in the editor accepts the authorisation
prompt on the owner's side. The `/exec` URL goes into `SHARE_ENDPOINT` in
`lib/calendar-sharing.ts`; the first deployment went live on 5 September 2026
(deployed with `clasp deploy`, version 1), so the share form on `/programme/`
renders. Redeploy only when the endpoint logic changes, and update the constant
to the new `/exec` URL. Never put the organiser's main calendar's ID in
`getWorkshopCalendarId`.

## Daily recaps

Each workshop day is summarised the same evening and published on
`/programme/`, under the day it belongs to. Participants flag lines they think
are wrong; those go to a private spreadsheet and the recap is revised from
them the next morning.

**The nightly procedure — capture, the NotebookLM prompt, publishing, applying
corrections — is [`docs/daily-recap.md`](docs/daily-recap.md), and that is the
only document the work needs.** What follows is what a *code* change must not
break.

**It is not a fifth destination.** A day's record belongs to the day, so it
renders inside `/programme/`, and `#recap-day-3` opens that day and scrolls to
it. `data/recaps.ts` is a separate module from `data/agenda.ts` only because
the agenda is the schedule and would be buried under a week of prose; the two
are joined in `lib/recap.ts`.

**The item id is the load-bearing part.** Every flaggable line carries
`d<day>-r<serial>`, hand-assigned, unique within its day and **never reused or
renumbered**. A reader flags a line in the evening and the organiser reads that
flag the next morning against a text that may already have been corrected — the
id is the only thing connecting the two. `scripts/recap.test.mjs` enforces the
format, the uniqueness, the day match, that every `sessionId` names a real
session or track, that every action has an owner, and that the stamps are
ordered. Adding a field means adding its guard there too.

**Readers flag a line; they do not highlight a span.** This was decided
against text selection deliberately, and all four reasons still hold: selection
on a phone is unusable, a selection-only affordance has no keyboard or screen
reader equivalent, a quoted span is stale the moment the line is revised, and
the request travels in a JSONP query string where a quote plus a note does not
fit. The control is a real `<button>` disclosure per item, described by the
line it sits on. Do not "improve" this into a highlighter.

**The note is required and the name is optional.** "This is wrong" without
saying how is not actionable; the name is what lets the organiser go and ask.

**The recap sits outside `.agenda-panel`.** That panel is a two-column grid —
a third child lands under the day summary rather than beside it.

**It is not printed.** The printed programme is all five days and the panel
holds one, so a single day's record stapled to a five-day agenda would
contradict the print rule. Paper carries the schedule; recaps stay on screen.

**One endpoint constant, in `lib/apps-script.ts`.** Calendar sharing and recap
flagging are served by the same Apps Script deployment, so two copies of that
URL is one copy that gets forgotten — and the symptom is silent: the site posts
to an address that answers nothing.

**Redeploy the existing deployment, do not create a new one.**
`clasp deploy -i <deploymentId>` keeps the `/exec` URL, so the constant does
not move; `clasp deploy` on its own mints a new URL and quietly leaves the site
talking to the old version. And **authorise before deploying**: the manifest
gained `spreadsheets` and `drive.file` for the corrections sheet, the web app
executes as its owner, and a version deployed before that consent fails every
request — calendar sharing included, not just flagging. The consent screen is
a browser interaction on the owner's account; no tooling substitutes for it.

**Flagging closes after 21 September 2026, in two places** —
`RECAP_FEEDBACK_CLOSES` in `data/recaps.ts` takes the control off the page, and
`FLAG_CLOSES` in `apps-script/flags.gs` refuses the write. The site's copy is a
courtesy so a reader is not offered a control that would be refused; the script
is what actually enforces it. A public write endpoint left open on a site
nobody is watching any more is the thing being avoided.

**Recaps are published and edited live, on the page.** Decided 14 September
2026, replacing both the same-day prompt-editing feature and the older
publish-by-commit procedure: the summary is generated the same day, and the
organisers publish it straight from `/programme/`, behind a password, with no
commit in the loop. Seven things hold it together:

- **The prompts never render on the site.** They are the organiser's drafting
  tool: `data/recap-prompts.ts` holds them, the session list in each is built
  from the agenda, and the draft they produce is reviewed by a person before
  anything is published. Do not put them back on a page.
- **The recap a reader sees is the live copy when one exists**, and the
  repository fallback (`data/recaps.ts`, currently empty) when it does not —
  so a day with nothing published still says "to be published". The same
  shared fetch feeds `DayRecap` and the home page's `NowNext` band.
- **It is not JSONP.** A recap is kilobytes and publishing carries a password;
  neither belongs in a URL. Reads are a GET of `?action=recaps` and saves a
  `text/plain` POST to `doPost`, which needs no preflight. This transport was
  checked cross-origin from the live site on 14 September 2026; JSONP stays
  for the endpoints already built on it.
- **The password is a script property, never in the repository.** Without
  `RECAP_EDIT_PASSWORD` the script reports `editable: false` and the page shows
  no Publish button. Saves carry the `updated` stamp they started from and a
  stale one is refused as `conflict`, so two organisers cannot silently
  overwrite each other. Wrong passwords are capped per day; publishing closes
  with the corrections after the workshop, in both the site and the script.
- **The server sanitises before it stores.** `sanitizeRecap` in
  `apps-script/recaps.gs` accepts only the fields the site renders, requires
  the `d<day>-r<n>` id contract on every line (flags depend on it) and caps
  sizes; a hand-written payload cannot smuggle arbitrary JSON into the
  properties store.
- **`published` is stamped by the server on the first save and never
  rewritten; every later save stamps `revised`.** The editor never writes
  stamps, which ends back-dating by construction.
- **The editor is a structured form, not a markup language.** The first
  version demanded JSON; the second took the NotebookLM text but still made
  the organiser *write* that format by hand in a box. Both missed the point:
  the room corrects prose, on the evening of a long day. The editor now shows
  one card per session — session picked from the day's programme by title,
  never typed as an id — with plain fields for what happened / decisions /
  open questions / actions and add/remove buttons. **Paste the NotebookLM
  draft** fills the whole form from the corrected text in one click
  (`parseRecapText` in `lib/recap-text.ts`, which warns instead of guessing:
  a session id that names no session, an action with no `[Owner]`); **JSON**
  stays as the last resort for surgical fixes. Ids are invisible by design.
  `idAssigner` in the same module assigns them at save time, and on a
  revision keeps the id of every line that survives word-for-word (a changed
  line takes a fresh serial; a deleted serial is never reused), so flags
  raised the evening before keep pointing at the lines they were raised
  against. `scripts/recap-text.test.mjs` guards the id rules; the
  VM-context arrays from the fixture need value comparison, not
  `deepStrictEqual`. `scripts/recap.test.mjs` no longer sees live recaps —
  its rules apply by hand in the editor, and the test still guards the
  repository copy.

**A day with no recap still renders its block**, saying one is due. That is how
a reader learns the record exists. Never write a recap for a day that has not
been held; with the server stamping `published`, back-dating is no longer
possible anyway.

## Waiting on the LAPIG team

Unresolved on the live site, and not answerable by guessing. Filling these in
is the highest-value work available on this project. The complete, dated
checklist is in `research/pending-information.md`; keep that file and this
summary aligned.

- Hotel: accommodation is reported paid and organised for 13–18 September;
  confirm that coverage, what it includes, and check-in/check-out times
- Confirmation of the LAPIG pin, its street address and its CEP — the address
  LAPIG publishes carries a probable typo and a Caixa Postal CEP. See
  `research/venues.md`
- Authorised photographs of any venue that returns to the registry, with
  credit lines
- Confirm that participants arrange their own airport-to-hotel Uber/taxi
- Confirm the contracted shuttle's 08:00 Monday–Thursday departure, pickup
  points and returns; Friday leaves at 06:30
- Day 5: which farms host the two grazing livestock visits — the sessions and
  their times are confirmed since 5 September 2026; only the venue identity
  is pending
- Final partner matrix beyond the publicly documented funder, project leads
  and workshop hosts already grouped on the home page
- The 21 expected presentation/document files, the shared-folder route and the
  final programme PDF
- Written guidance on where in Goiânia participants can move around on
  their own. The self-guided Art Deco route was removed from the local
  guide on 3 September 2026 because the organiser judged the central
  district unsafe for visitors, and the site is still silent on the question
  rather than reassuring or warning. The orientation section added on
  8 September 2026 does **not** answer it: it is orientation, and it was
  written specifically not to imply that anywhere on it can be visited
  unaccompanied. Only LAPIG can lift that silence, in writing

**Superseded by the organiser's 8 September confirmations below.** The hotel
dates and daily transport are confirmed. Remaining presenter/material delivery
is owned by session teams and does not block acceptance of the website.

## Known technical debt

**The shadcn scaffold is gone.** `components/ui/` held 60 generated components
nothing imported, `lib/utils.ts` and `hooks/use-mobile.ts` served only them, and
14 packages in `dependencies` were loaded by none of it. All of it was removed
in September 2026 as the single mechanical commit this section had been asking
for; the lockfile went from 541 packages to 155 and `npm run lint` now reports
nothing at all. What ships is `next`, `react`, `react-dom` and `lucide-react`.
Restoring the scaffold is `npx shadcn init`, not a revert. Adding a UI library
back means arguing for it first.

**The two raw `<img>` tags are gone.** Both the hero and the venue photographs
render through `next/image` under `images: { unoptimized: true }`, which is what
static export requires. Two attributes carry decisions and must not be dropped:
the hero is `loading="eager"` with `fetchPriority="high"` because it is the LCP
— `next/image` defaults to `loading="lazy"`, and `fetchPriority` alone does not
undo that — and the venue photograph uses `fill` with `sizes`, which works only
because `.venue-photo` is already `position: relative`. `withBasePath` still has
to prefix both sources: `next/image` does not apply `basePath` to a string
`src` when images are unoptimised.

## Current UX decisions — 5 September 2026

These organiser-approved decisions supersede the earlier navigation and location
presentation rules in this document:

- Four routes remain; navigation is Home, Programme, Travel, Materials. Travel
  uses the existing `/practical/` URL and is titled Travel & stay. All four
  navigation links fit on a phone without horizontal scrolling.
- Programme and ICS do not expose venue fields. Participants use the daily
  workshop shuttle. Preserve session titles, speakers and times.
- Hotel check-in/check-out confirmation has been removed from the site at the
  organiser's request. Other unconfirmed operational facts remain pending.
- The organiser explicitly authorised an Uber link to LAPIG's existing sourced
  coordinates. `ride: true` records that authorisation, not a newly verified
  street address or entrance; do not invent either. Golden Lis also offers Uber;
  Cidade de Goiás continues to use organised transport.
- Travel uses anchored venue blocks, with hotel actions in its opening screen.
  Essential details precede optional map/photo disclosures. No venue selector.
  Existing #stay, #transport, #maps and #map-panel links still resolve; new
  destination links are #hotel, #lapig and #cidade-de-goias.
- `components/venue-card.tsx` owns copy feedback and map disclosure. The Travel
  page itself is a server component; its styles live in `app/travel.css`.
- Mobile days are five compact visible choices. Materials has a day index,
  stable file-entry anchors and explicit View session links. All five print
  days remain available; no venue navigation is added to Programme.
- The Meals section was removed from Travel & stay at the organiser's request
  on 5 September 2026, together with the meals lines in `lib/practical.ts`.
  Meal items remain in the programme as agenda sessions; the `#meals` anchor
  no longer resolves.
- The Participant support section (emergency contact, accessibility contact,
  field checklist & weather) was removed at the organiser's request on
  5 September 2026. `SUPPORT_DETAILS` is gone from `data/practical.ts` and the
  `#help` anchor no longer resolves. Do not restore these placeholders.
- The "Before you arrive" preparation block and the `requirements` session
  field were removed at the organiser's request on 5 September 2026. The
  `.ics` export no longer emits "Bring:" lines. If a session ever needs a
  stated requirement again, reintroduce the field rather than writing it into
  a title.
- The organiser approved all twenty inferred end times and the Day 5 farm
  visit times on 5 September 2026. Every `endStatus: 'provisional'` and
  `status: 'tbd'` marker came off `data/agenda.ts` and `CALENDAR_RELEASE` is
  `final`: the `.ics` carries confirmed ends, events are CONFIRMED, and the
  "· Beta" suffix is gone from titles. The build now fails on any new
  unresolved item — keep it that way.
- The calendar share web app is deployed (version 1, 5 September 2026) and
  `SHARE_ENDPOINT` in `lib/calendar-sharing.ts` is live, so the
  "get the live calendar by email" form on `/programme/` renders. It is
  idempotent: a repeat request answers `already` and sends nothing.

## Release decisions — 8 September 2026

These organiser confirmations supersede older pending-information lists above:

- Accommodation is 13–18 September 2026. Do not show a coverage warning or
  invent a breakfast/payment breakdown. Check-in/check-out details stay omitted.
- Depart from Golden Lis at 08:00 Monday–Thursday and 06:30 Friday. Hotel
  boarding is confirmed. Return boarding follows the group's activity location;
  no list of return points or pending return details is needed.
- Recommend Uber from the airport to the hotel. Keep the existing Uber, maps,
  call and copy actions.
- If the LAPIG gate is closed, ring the intercom. Do not publish an invented
  postal address. The existing authorised pin remains.
- No farm-identification information or farm-pending warning is required.
- Presenter names and material files are supplied by the session teams. Preserve
  existing names and file placeholders; delivery is not a website acceptance
  blocker. Materials describes files being published as teams supply them.
- The organiser enabled the Google Calendar trigger to run every four hours.
  The older daily-trigger descriptions are historical. Do not recreate the
  trigger or run setup as part of a frontend change.
- Calendar invitations are a compact block at the top of Programme, before
  the day tabs. One labelled email field, clear sending/success/error states,
  and one whole-workshop ICS download replace the multiple subscription choices.
  Existing per-day ICS URLs remain available for previously shared links.
- Home derives its programme publication label from CALENDAR_RELEASE. Remove
  internal institutional-approval prose from the participant-facing page.
- Shared page anchors (#top, #content, #calendar) are not invalid sessions;
  preserve native anchor behaviour and warnings for truly unknown session links.

## City guide — 9 September 2026

The organiser replaced the final illustrated city maps and Useful references
with a city guide, scoped to the end of Practical information. This supersedes
the old orientation presentation described above.

- Goiânia gets brief historical context: the new planned capital, founded in
  1933, contrasted with the older Cidade de Goiás. Its free-time guide adapts
  a selected set of points from the supplied GMH Workshop My Maps.
- Cidade de Goiás gets historical context, its existing licensed photograph,
  the Rio Vermelho, Cora Coralina and living heritage. It is not a second
  free-time itinerary.
- `data/city-guide.ts` holds participant copy and selected points;
  `components/orientation.tsx` composes the section as a server component.
  `components/free-time-map.tsx` owns the interactive Leaflet map and filters.
  The practical page remains a server component.
- Names and coordinates from the reference map are retained with provenance
  in `research/free-time.md`. The original My Maps was not modified.
  Golden Lis is read from the venue registry. No new workshop venues, rides,
  opening times or walking routes are inferred from leisure pins.
- The map loads when its section enters the viewport, with an explicit load
  button fallback. This observer loads a map; it does not animate content.
  All place links render in HTML before map loading. A map failure must not
  remove the list. OSM tile attribution stays visible.
- Preserve the existing restriction on recommending an independent centre
  walking route. Historical discussion of the city is not such a route.
- The old map assets and geography research remain as source history, not
  as a second visible section. Useful references has been removed by request;
  inline history sources and photographic attribution remain.

## Travel restructured — 9 September 2026

The organiser judged the page confused and Cidade de Goiás redundant, and both
readings were correct. The page carried two accounts of the same town: a venue
card under "Workshop locations" offering directions and a copyable municipality
centroid, and a history article further down repeating its photograph. The
heading outline had two `Cidade de Goiás` h3s, and one section answered to
three names — `#maps` in the anchor, "Venues" in the index, "Workshop
locations" in the heading.

The cause was organising by genre — a hotel, a bus, some places, some history —
rather than by what a participant is doing when they open the page.

- **Travel & stay is two parts, and they are the only h2s.** _Your week_ holds
  the hotel, the shuttle and the two destinations. _Goiânia_ holds the city's
  context and the free-time map. Everything inside a part is an h3. Do not
  reintroduce a heading level between them.
- **Cidade de Goiás appears once, in part one, as the Friday destination.**
  Logistics at the front of the block, the town's history inside it: the lead
  paragraph and the UNESCO line visible, the rest behind one disclosure. It is
  a workshop destination that happens to be a World Heritage town, not a second
  itinerary. The photograph is published once, on this block.
- **Both destinations state the journey on one axis.** `travel` on the venue
  card and the matching line on the Friday block read "Workshop shuttle from
  Golden Lis · <days> <time>", derive from `SHUTTLE_PLAN`, and link to
  `#transport`, which stays the single detailed source for departures. Eyebrows
  say when you go — "Monday–Thursday", "Friday 18 September" — not what kind of
  building it is. The hotel's eyebrow is "Your hotel": it is the base, not a
  destination.
- **`VenueCard` takes its eyebrow as a prop and always renders an h3.** It is
  now only for places a participant navigates to. Deriving the eyebrow inside
  the component is what let the two places drift onto different axes.
- **`#stay`, `#transport`, `#maps`, `#map-panel`, `#hotel`, `#lapig`,
  `#cidade-de-goias`, `#orientation` and `#recommendations` all still resolve.**
  `#maps` and `#map-panel` survive as wrappers with no heading of their own.
  The index reads Hotel · Shuttle · Locations · Free time, still four items on
  one phone row.
- **Print keeps the town's history.** `.friday-more` is excluded from the rule
  that hides `.place-map` on paper; its summary, map and tile credit are hidden
  and the prose prints.
- This supersedes the placement described in the 5 September Travel bullet and
  in the 9 September city guide entry. The content itself is unchanged: nothing
  was written, and `data/city-guide.ts` still holds every paragraph, detail and
  source.

## Original Google My Maps — 9 September 2026

At the organiser's request, the free-time section now embeds the supplied
GMH Workshop Google My Maps directly. This supersedes the custom Leaflet map,
filters and selected-place list described in the city guide entry above.

- Preserve the two-part Travel & stay layout and the Friday town history.
- The embed uses the public map linked by `GUIDE_SOURCE`, with Google's own
  markers and layers. Do not edit the externally owned map or hide its branding.
- Keep the descriptive iframe title, lazy loading, responsive sizing and the
  separate full-map link, which remains available even if the embed cannot load.
- Print hides the iframe and keeps the map link and attribution.
- The earlier selected points and research remain as provenance.

## Travel composition — 9 September 2026

The organiser requested a more coherent composition on monitors and phones.
Keep the two page parts and all existing anchors. The hotel, shuttle, LAPIG
and Friday destination now form successive full-width rows rather than two
grids of unequal cards.

- On desktop, venue identification and the existing licensed photograph share
  one column; actions and practical details occupy the other. The shuttle and
  Goiânia history follow the same column alignment.
- Below 900px, practical actions precede the photographs. Do not put a large
  image between a venue's title and its arrival instructions on a phone.
- Venue photos are visible once. Their disclosures now contain only the map.
  Friday's disclosure still contains its additional history and map.
- Goiânia's heading and history form one block. The duplicated founding-date
  label and introductory navigation prose have been removed; historical facts
  and sources remain in the data, and the Google My Maps is unchanged.

The organiser subsequently asked for the city section's purpose to be explicit:
its h2 is now **City & free time**, matching the top shortcut. Its introduction
explains that Goiânia is the participants' base during the workshop; the history
has its own h3, **Goiânia: a young capital**. Preserve the stable anchors.
Ride buttons keep the existing service link and text label; the organiser
subsequently asked to remove the Uber wordmark, so the button uses the site's
generic car icon.

## Desktop type size — 9 September 2026

Readers on a computer monitor reported that the type was too small. It was:
the whole scale was fixed in pixels, tuned against the phone the site was
designed around, and a 13px caption read at arm's length on a 1680px screen is
not the same 13px read at 35cm on a phone.

The fix is in the tokens, not in the rules that use them — see
[Type and detail rules](#type-and-detail-rules) for the ramp and the six
values. What it means in practice:

- **Nothing below 1024px changed.** Phones and tablets render byte-identical
  type; so does print. Only the desktop end of the range moved.
- **Literals were folded into tokens as part of it**, because a token that
  grows is no use to a rule that hard-codes 14px. The compact programme
  controls, the materials resource list, the now band, the form controls and
  most of `travel.css` were converted. What stayed literal: display sizes
  (20px and up), and the sizes inside `max-width` blocks, which are phone
  step-downs and belong there.
- **Two tokens were added**, `--t-body-lg` and `--t-head-sm`, for bands that
  had only ever been written as literals. Prefer extending the scale to
  reintroducing a literal.
- Verified at 390, 768, 1024, 1280, 1440, 1680 and 1920px on all four routes:
  no horizontal overflow, and no clipped timeline block, day tab or directory
  card at any of them. Re-run that check after touching the ramp.

## Split-session choices — 9 September 2026

Two sessions run two activities at the same hour — Day 1 at 10:00 and Day 4 at
14:00 — and the rooms have to be sized before the day starts. The programme
said "Split session · choose one" and gave nobody a way to answer it. It does
now: a participant picks one activity, gives their name, and the Apps Script
keeps **one row per person per session** in a private spreadsheet the
organiser reads.

**The name is required.** It is what makes the sheet an attendance list rather
than a count: an organiser reading it the evening before needs to know who has
still not said, and thirty anonymous clicks from any number of browsers cannot
tell them that. The site remembers the name and offers it again for the second
split session — a person on hotel wi-fi types it once.

**The control cannot live on the programme itself, and that is a structural
constraint, not a layout preference.** The proportional grid is `aria-hidden`,
so a button inside it is focusable by keyboard and invisible to a screen
reader; its list counterpart carries the day to assistive technology but is
clipped away above 1280px, so a button there is one desktop readers cannot
click. `components/split-choice.tsx` therefore sits below the programme,
outside `.agenda-panel` for the same reason the recap does. Do not "improve"
this by moving the control into the grid.

**Which is exactly why the day has to announce it.** Shipped first without
that, the chooser was a block at the foot of the page nothing pointed at: a
reader looking at the 10:00 slot had no reason to think an answer was expected
of them, let alone that the page could take one. Three surfaces now carry the
same state, and they answer to one function, `choosingOpen` in
`lib/split-sessions.ts`, so they cannot disagree:

- **The session says it needs an answer, and takes you there.** `Split
  session` plus a `Choose one` chip, in the grid and in the list, until this
  browser has picked; then the chosen activity carries `Your choice` instead.
  The chip is a link to the chooser — a green pill saying `Choose one` that
  does nothing when tapped is a broken promise.
- **`SplitNotice` sits between the day tabs and the panel**, carrying the
  time, the state and the same link. It is glued to the tabs above and the
  panel below (`border-top: 0`, as `.agenda-panel` has) so the three read as
  one card.
- **The chooser itself** states the answer back once it has one.

**Both controls pulse, and that is the only thing on the site that moves on
its own.** A ring opens out of the chip and the notice button over the first
third of a three-second cycle and then rests for the other two — a beat, not a
blink, because this is a workshop programme and a flashing control reads as an
alarm. They share the keyframes and start together, so the page has one
heartbeat rather than two competing ones, and both stop under the cursor or on
focus: the reader is there, the signal has done its work. It is guarded the
way `.calendar-spinner` is — inside
`@media screen and (prefers-reduced-motion: no-preference)`, timed off
`--m-enter`, and `linear` rather than `--m-ease`, which is an ease-out written
for a state landing under a cursor and spends a looping ring's whole life in
its first tenth of a second. The ring is `box-shadow`, so it costs no layout
and cannot push a timeline block out of its hour; it is 10px, which clears the
`overflow: hidden` on `.tl-block` with 25px to spare. Nothing of it prints.

Every link resolves through `splitAnchor()`, so the three cannot point at
different places. The two chip copies exist because the programme has two
representations, and each is made reachable by exactly the readers who can see
it: the grid's copy is `tabIndex={-1}`, since that diagram is `aria-hidden`
and a focusable link in it would be a tab stop into nothing; the list's copy
is a real link, and `display: none` above 1280px, where that list is clipped
away and would be the same trap. Below 1280px the list *is* the programme and
its chip is the one a thumb reaches. Check `.programme > .session-list` holds
no focusable element on a wide screen before adding another control to it.

A day with no split session renders none of it, and none of it prints: paper
carries the schedule, and a chip saying `Choose one` on a sheet that cannot be
clicked is noise. `Your choice` does print — that sheet is the reader's own.

**A choice is changed, not repeated.** The sheet is keyed by session and name,
matched case- and space-insensitively, so someone who changes their mind
rewrites their own row; the endpoint answers `changed` rather than `recorded`
and the page says so. Without that key, an organiser counting rows the evening
before would count the same person twice.

**The site never reads a choice back.** A reader sees their own answer, from
their own browser (`hooks/use-track-choice.ts`), and never a count or anyone
else's name. Publishing "18 people are in the GEE course" would turn a room
question into a popularity signal, and the endpoint is anonymous — the numbers
would be worth nothing anyway.

**The control comes off when it stops having an effect**, in three places: the
session has started (the room is what it is), `TRACK_CHOICE_CLOSES` in
`data/agenda.ts` has passed, or the endpoint is not configured. `CHOICE_CLOSES`
in `apps-script/tracks.gs` refuses the write on the same date and is what
actually enforces it; the site's copy is the courtesy, exactly as with recap
flagging.

**`apps-script/tracks.gs` holds its own copy of the split sessions** — a public
endpoint has to refuse anything that names no real activity, and the organiser
should read a sheet of titles rather than a sheet of ids.
`scripts/track-choice.test.mjs` fails the moment that copy drifts from
`data/agenda.ts`, and also covers the row keying, the caps and the closing
window. Renaming a track means editing both files; the test says so.

**Deployed 9 September 2026 as version 3** ("Split-session choices"), into
the existing deployment, so `APPS_SCRIPT_ENDPOINT` did not move — a fresh
`clasp deploy` would have minted a new `/exec` and quietly left the site
talking to the old version. No manifest change was involved: `spreadsheets`
and `drive.file` were already granted for the corrections sheet, so no new
consent screen was needed. The live endpoint answers `?action=choose` with
`invalid` for anything that names no real activity, which is the safe way to
check it is routed at all: validation runs before the sheet is touched, so
that probe writes nothing and does not even consume the daily counter.

**The choices spreadsheet does not exist until the first real choice.**
`getChoiceSheet()` creates it on demand, exactly as the corrections sheet
does. `choiceSheetUrl()` prints its address and `choiceTally()` prints the
counts per activity, both run from the editor.

## The assistant — 9 September 2026

A question panel over the site's own content, reached from a control on every
page. It is not a fifth destination: it opens over whichever page the reader is
already on, and it closes when they follow it somewhere.

**It exists mainly for the people the English-only rule does not serve.**
Participants travel from Uruguay, Argentina, Colombia and Brazil. The site
stays in English — that rule is unchanged — and the panel is the one place a
question asked in Portuguese or Spanish gets an answer.

### Two paths, and the reader is told which one answered

`lib/assistant-search.ts` ranks the corpus by weighted word overlap and returns
**the published lines themselves**. It needs no key, it cannot be eloquent and
it cannot be wrong. `ASSISTANT_ENDPOINT` in `lib/assistant.ts` adds a model on
top, grounded in the same corpus. Empty means no model, which is the shipped
default and the kill switch: the panel keeps working, and no key is spent.
When the worker refuses or is unreachable, the search answers instead and the
turn says so.

### Never invent a fact, applied to a model

The site's first rule is the whole reason this took the shape it did. Someone
reads this in an arrivals hall, and a plausible guess is worse than a blank.

- **`public/assistant-corpus.json` is the model's entire world.** Generated
  from `data/` by `scripts/build-assistant-corpus.mjs` in `prebuild`, the way
  the calendar is. It is a projection of the data, never a place to write
  prose — 96 entries, 32 kB, small enough that the whole site fits in one
  context. There is no retrieval index and no second copy of any fact.
- **A pending detail stays pending in the corpus.** A venue with no confirmed
  address says so in words; a TBD session and a provisional end time keep their
  qualification. `scripts/assistant.test.mjs` fails if any of that is lost.
- **No coordinates, and no map geometry.** A decimal degree is nothing to read
  back to a reader and nothing a model should calculate a distance from. The
  SVG path strings in `data/geography.ts` are kilobytes the model cannot use.
  Both are tested for.
- **Session entries name no venue.** The programme and the `.ics` have been
  silent on places since 5 September 2026; an assistant naming a room would be
  the only surface on the site contradicting them.
- **Addresses, phone numbers and websites never pass through the model.** On
  11 September 2026, with the hotel's address in the corpus verbatim,
  `glm-5.2` twice wrote "Setor Santa Genoveza" for Santa Genoveva — the one
  line on the site someone reads aloud to a driver. Asking a model to copy
  carefully is not a guarantee, so a place's area, address, phone and website
  live in the entry's `details`, which the worker never puts in the prompt.
  The panel sets them under the answer straight from the corpus, and the model
  is told to point at them rather than write them. `scripts/assistant.test.mjs`
  fails if any of them, or any URL, reaches an entry's `text`.
- **The model never writes a URL.** It ends an answer with `SOURCES: id, id`,
  and the panel resolves those ids against the corpus the browser already has.
  An id it invents resolves to nothing and is dropped. That is also how the
  panel conducts navigation — the buttons under an answer are real entries.

### Following a source

A source button is only worth having if it lands the reader on the thing it
names, so every `href` in the corpus carries the anchor of that thing:
`/programme/#d3-lunch`, `/practical/#hotel`, `/materials/#materials-day-2`.
The page anchors a corpus entry may use are checked against the pages that
render them in `scripts/assistant.test.mjs`; a renamed card fails the test
rather than dropping the reader at the top of the page.

`follow` in `components/assistant.tsx` does the navigating, and two things in
it are easy to undo by accident:

- **On the same route it raises `hashchange` itself.** A `Link` to
  `/programme/#d3-lunch` from the programme changed the address bar and
  nothing else — Next emits no `hashchange` for a same-route navigation, so
  the day stayed on Day 1 and the page did not move. It is the same problem
  `components/story-link.tsx` solves for the story panels.
- **Across routes the page changes first and the hash applies after.** The
  route is pushed without its hash inside `document.startViewTransition`, so
  the page cross-fades at `--m-move`; only when the transition has finished is
  the hash replaced into the URL, and the smooth scroll to it is visible.
  Pushing the full `href` let Next jump to the anchor instantly and left
  nothing for the eye to follow. Under `prefers-reduced-motion`, or without
  View Transitions, the same two steps run with no fade.

### The worker, and why there is one

Static export means no server on the origin, so a key in the bundle is a key a
scraper drains overnight. `worker/` is a Cloudflare Worker and the only place
the key exists. Four things guard it: origin allowlist, per-IP burst limit, a
daily cap in KV in the spirit of `DAILY_SHARE_LIMIT`, and per-answer caps —
`worker/README.md` covers what it is and why.

**Turning the model on is [`docs/assistant-setup.md`](docs/assistant-setup.md),
and that is the only document that step needs.** It is optional and it is not
urgent: the panel answers without it. The order in it matters — the worker
reads the corpus from the published site, so the site is deployed first.

**It holds no copy of the workshop.** It fetches the published corpus and
caches it, the way `syncFromSite()` treats the published `.ics` as the single
source of truth. Changing the agenda and pushing the site is the whole update
procedure; the worker is redeployed only when its logic, model or limits
change. `OLLAMA_MODEL` is `glm-5.2` — confirm any change against
`GET https://ollama.com/api/tags`, since `glm-4.6` and `glm-4.7` are retired.

### What the design is not

The brief rejects "generic AI aesthetics" by name, so `app/assistant.css` has
no gradient, no glow, no circular bubble and no colour the rest of the site
does not have — paper, forest, the 3px radius, one weight of type. It is a
native `<dialog>`, which gives focus trapping and Escape for free rather than
reimplementing them, and it never prints.

**Do not give the assistant a page, a name, or an introduction.** "Ask" is a
plain word; a paragraph explaining what it can do would be prose explaining the
interface, which the site does not carry.

## Optional stories — 9 September 2026

Seven subjects that a participant may want and none of them needs: UFG, LAPIG
and FUNAPE on the home page, Goiânia, the Cerrado, Cidade de Goiás and FICA on
Travel & stay. They are reference reading, and the whole design follows from
that: closed, they cost one row each; opened, they are allowed a magazine.

**They are not a fifth destination, and the rule against one still holds.**
No story has a route, a navigation entry or a place in the directory. Each is
addressed by a hash inside a page that already exists — `/#about-ufg`,
`/practical/#about-fica` — and its entry is a row in the page that already
carries the subject. The names obey the same test as the pages do: `About UFG`
and `Learn more` are things a reader already understands. Do not promote one
to a route, and do not add an eighth without asking what page already earns it.

**The panel is a native `<dialog>` opened with `showModal()`, and that
overrode the plan.** `research/optional-content-plan.md` recommended expanding
in place, below the entry. That is superseded — the panels are modal — and the
rest of that document is research, not a specification. The reason is the
sticky header: an in-page panel scrolls under it and a long story leaves the
reader with no fixed way out, while the modal layer sits above it and carries
`Back to page` at the top and the foot of every panel.

**The `#about-` hash space is the stories' own.** It has nothing to do with
`/programme/`'s `data-session` resolver, and the two must not be merged — that
resolver has its own rules under [Deep links](#deep-links). The story trigger
*does* carry the `id`, deliberately: a reader arriving from another page lands
on the entry the panel came out of, so closing it leaves them where the link
promised.

**The history contract is three lines in `lib/story-navigation.ts`, and every
part of it is load-bearing:**

- Opening from the page **pushes one entry**, so Back closes the panel.
- Opening a *related* story from inside a panel **replaces** it, so a reader
  three subjects deep still leaves with one Back rather than three.
- A story reached by a link from outside has no entry to pop, so `closeStory`
  falls back to `replaceState` — a shared link closes into the site instead of
  leaving it.

`scripts/story-navigation.test.mjs` covers all three, plus the scroll lock.
**The lock is a counter, not a flag** (`lockStoryScroll`), because the
photograph lightbox is a second dialog inside the first and the two unmount in
whichever order React chooses; a boolean let the inner one unlock the page
while the outer was still open.

**Closed panels download nothing.** The text is server-rendered and sits in the
HTML; every image, gallery, explorer and film player is mounted behind
`useStoryOpen()`, so a reader who never opens a story pays for none of it —
confirmed against `performance.getEntriesByType('resource')`, not assumed.
Films are YouTube embeds that load only on a deliberate play, and closing a
story unmounts the player so reopening never resumes audio. Keep it that way:
an `img` or an `iframe` rendered outside that gate silently undoes it.

**Print carries only what a reader asked for.** An open panel prints; a closed
one does not, except `data-print-always`, which is Cidade de Goiás alone —
that town's history printed before the stories existed and still does.
**Goiânia's history no longer prints**, which is a real change from the version
before 9 September 2026: it moved behind its panel with the rest. That is
deliberate. Adding `printAlways` to `goiania` in `components/optional-story.tsx`
reverses it in one word if the organiser wants the paper sheet to carry it.

### Media rights in the stories

Nothing enters `data/story-images.json` without a local file and documented
rights; `research/optional-content-image-provenance.json` records the source
page, the credit, the licence, the changes and the date each was checked.

**Every record states its modification, and that is a licence term rather than
a courtesy.** The files are resized and converted to WebP, and both licences in
use require saying so — CC BY-SA 4.0 asks whether the material was modified,
and Portal UFG's terms at https://ufg.br/n/63495-direitos-autorais require
derived material to identify its changes. The `edits` field carries it and the
caption prints it. A new image without `edits` is a rights defect, not a
cosmetic one.

**The Portal UFG photographs are non-commercial**, and their `license` says so;
their `licenseUrl` points at those terms, never at the article the photograph
was published in. The LAPIG pair pointed at the article until 9 September 2026
and understated the restriction as `Reuse with credit`.

### Two things a person still has to answer

- **FUNAPE sits in the institutions row at the client's explicit request** of
  9 September 2026, under the heading `Institutional affiliations`. Its role in
  *this* workshop is not established in any source consulted —
  `research/optional-content-plan.md` records that as open — so the row asserts
  a relationship the research does not yet support. Confirm it with the
  organiser before the site is announced. The story text itself claims nothing
  beyond what FUNAPE's own site says.
- **FICA's festival is in June and the workshop is in September.** The entry
  sits under the Friday visit to Cidade de Goiás, which is the one place a
  reader could mistake it for something on the programme. The prose is past
  tense throughout, and since 10 September 2026 the masthead says it outright —
  `The most recent edition ran in June 2026. The festival is not part of the
  workshop programme.` — rather than leaving tense to carry it alone. Keep any
  new FICA fact in that tense, and do not give the subject a week link: it has
  no session, and `lib/story-week.ts` is correct to render nothing for it.
  Note the wording: **not** "held every June". Recent editions run in June and
  the first ran in June 1999, but Secult announced one opening on 14 December,
  so the site says *held in Cidade de Goiás since 1999* and *recent editions
  have run in June*.

## Story devices — 9 September 2026

The seven panels were built with four presentational widgets shared between
them, and it showed: every one ran opening → media widget → facts → two
columns of prose → references. They differed by which widget sat in slot two.
That is a template, and a template is what the reader feels.

**Each subject now has a device only that subject could justify**, and the
composition lives in `components/stories/<id>.tsx`. `optional-story.tsx` is the
frame — entry, opening, week link, references — and holds no `id ===` branches:
it had four, and every new subject wanted a fifth. `components/story-parts.tsx`
carries the shared pieces a composition may draw on.

| Subject | Device | Why that subject |
| ------- | ------ | ---------------- |
| UFG | Five founding schools; the campus list with a computed distance | The reader is standing inside it, and Friday's town holds another campus |
| LAPIG | Its own three films, then the retrospective photographs | It publishes its own account of itself |
| FUNAPE | A four-step sequence, labelled as general | It has no cleared photography and no documented role here |
| Goiânia | 1933 · 1937 · 2003 as steps | A city drawn before it was built is an order of events |
| Cidade de Goiás | Two views, the dated spine, then the walk | Its heritage argument is a relationship between river, hills and town |
| FICA | Typographic: the acronym keyed to its Portuguese name, a title card, four competitive showcases | No cleared festival photography beyond three archive frames |
| Cerrado | The scale ladder: ground, air, orbit | It is the working method of the laboratory hosting the week |

**The scale ladder must stay a set of choices.** Its three photographs are
three different places — Serra Dourada, a LAPIG aerial frame and Serra de
Caldas — and a slider, a dissolve or a continuous zoom would assert a single
site across them. That would be a false claim made by an interaction rather
than by a sentence, which is harder to notice and harder to correct. Rungs are
pressed, each names its own location, and the closing chapter says outright
that these are three places. Only Landsat's 30 m is a published figure; the
other rungs name the instrument, because no ground coverage is documented for
them and a fabricated number beside a real one is worse than no number.

**Only one device needs JavaScript.** The founding list, the campus list, the
steps and the sequence are server-rendered and print. Keep it that way: a
device that hides content behind a click cannot be printed and cannot be read
by someone who arrived with the panel already open.

### The week link

`lib/story-week.ts` resolves a story's `weekSessionId` against `AGENDA` and
renders the title, day, time and venue with a link into the programme. **The
time is never written in the story's own copy** — the programme is the only
place a time lives, and a second copy is a second thing to update.

Four stories declare a session and three do not, and the three are the point:
FICA is a June festival, FUNAPE is not a place, and Goiânia is the whole week
rather than an appointment. Giving all seven a line would have invented three
appointments to make a row look consistent. An id that no longer resolves
renders nothing rather than a dead deep link.

Two of the four are worth keeping: `d1-ufg-tour` is literally "UFG Tour —
Welcome at LAPIG", and `d5-serra-dourada` is the lookout at the mountain in the
Cerrado ladder's first rung. The connection is real; do not manufacture more.

### The entry rows

Each row carries a thumbnail, the subject, and one line saying what is inside.
Seven identical rows were a list nobody read before opening one, and the
accessible name is set explicitly (`aria-label`) so the same is true by ear.

**Entry thumbnails are their own file.** `scripts/build-entry-thumbs.mjs`
crops 260×186 versions into `public/images/stories/<id>-entry.webp`; the
gallery's 640px thumbnails were serving 85 KB to paint a 92×66 slot. Run it by
hand after adding a story thumbnail — it resolves sharp from Next's own copy,
which is transitive and must never be something the deploy depends on — and
commit the output. `ENTRY_THUMB` in `optional-story.tsx` mirrors its
dimensions; changing one means changing both.

**Watch the closed height on a phone.** Stacking `Learn more` under the row
first time out cost about 100px per entry and put four entries — 800px, most of
a screen — between a reader and the transport information below them. The
action sits at the right as a 44px target, and the teaser is clamped to two
lines. Measured at 375px: 115–137px per row. If a change pushes that back over
150, it is taking the page back.

### UFG's facts are sourced now

The panel used to carry three sentences. It now carries the creation date, the
five schools and the campuses, from
https://ufg.br/n/63408-historia and https://ufg.br/p/27153-campus (checked
9 September 2026), in `data/story-features.ts`.

**One thing on the history page is deliberately not reproduced.** It gives the
creation as 14 December 1960 and also describes a decree signed by Juscelino
Kubitschek on 18 December 1961. Those cannot both be the founding act, the page
does not reconcile them, and this site does not publish a fact it cannot
resolve. Only the creation date is on the page. If someone confirms the decree,
it can go in with its own source — do not add it from the history page alone.

## UFG, expanded — 10 September 2026

**Look at every photograph at full size before it is published.** The pair that
opened this panel until 10 September had been through a documented provenance
check that recorded "visible weathering and graffiti" — and shipped. The
graffiti read `FORA PM`, `REITOR TEM RABO PRESO` and `A+ ZONA ANTIFA`, on the
Central Library of the host university, on the page that introduces that
university to people arriving from seven countries. A licence check is not a
look. The provenance file now carries a `visualInspection` line that says what
was actually examined.

**A university is easier to describe by what it measures than by how many
people it enrols.** That is the panel's argument and it is checkable: UFG keeps
observatories pointed at the land (LAPIG), at the sky (CEMPA-Cerrado) and at
its own use of artificial intelligence (Observatório UFG-IA, which LAPIG built
— the same laboratory the participants sit in). CEIA is the fourth card and is
labelled `Builds the instruments`, not a fourth "watches": forcing the
symmetry would have been the device inventing a fact to complete its own
shape. `UFG_OBSERVATORIES` in `data/story-features.ts` carries the sources.

**The photographs are not a campus tour**, and that is the correction to what
was there before. A monkey hanging from the walkway of Campus Samambaia, an
agrometeorological station photographed from directly above, a case of fossils
and a music school: the range of one university, which is truer than its
façades and survives being seen by someone who has never been there. All four
are CC BY-SA 4.0 from Wikimedia Commons and every frame was opened at full
size first. Three sunset views of the same campus were rejected in the same
pass — each was a car park with overhead cables.

**`natural` on `StoryGallery` keeps each photograph's own proportions**, and
the ratio is written inline per image rather than left to `aspect-ratio: auto`.
That is not a style preference: with `auto`, an unloaded image reserves no
height at all, the gallery collapses to nothing, and every caption below it
jumps as the files land. Measured before the fix: four images at 0px tall.

**A pre-existing rule had to be narrowed for this.** `.story-photo:first-child`
was given `grid-column: 1 / -1` and `aspect-ratio: 16 / 9` for the stories that
lead with one wide frame. UFG was in that list and is not one of them any more;
leaving it there letterboxed a portrait photograph into 16:9. Goiânia and
Cidade de Goiás still are, and still want it.

**`scripts/build-entry-thumbs.mjs` reads the stories rather than a list.** The
hand-kept list went stale the first time a story changed its thumbnail and
failed on an image that no longer existed.

### One fact deliberately left out

UFG's own history page gives the creation as 14 December 1960 and also
describes a decree signed by Juscelino Kubitschek on 18 December 1961. Both
cannot be the founding act, the page does not reconcile them, and only the
creation date is published. The Observatório UFG-IA has no launch date on its
announcement either, so the site gives none.

## Campuses, FUNAPE and the science park — 10 September 2026

**The campus a visitor never notices is a campus.** Câmpus Colemar Natal e
Silva has no gate and no perimeter: the Faculty of Law, the Hospital das
Clínicas and their neighbours stand among ordinary streets in Goiânia's Setor
Universitário, four kilometres from Samambaia. The panel says that outright,
because a reader who walks past it will otherwise see a hospital and a law
school and not a university. It is named after the man who directed that
faculty, organised the assemblies and marches that argued for a federal
university in Goiás, and became UFG's first rector in 1961
(https://jornal.ufg.br/n/135985-a-criacao-da-ufg-uma-ousadia-historica).

That page also has JK signing the creation decree in **December 1960**, which
agrees with the 14 December 1960 date on the history page and makes the
"18 December 1961" sentence there look like a slip. Still only the creation
date is published, and still from one source.

**FUNAPE is a building, and the address is the argument.** The panel used to
be two paragraphs about administrative support, which is true and forgettable.
It now opens on the building itself — 1,772 m², two floors, a roof garden and
a training room for 97, opened December 2020 — and then lists its neighbours in
the Parque Tecnológico Samambaia: the innovation agency, the prototyping lab,
the incubator, and LaMCAD, whose largest client is the CEMPA-Cerrado that
forecasts the weather in the UFG panel. Naming the neighbours says what the
foundation is for better than a sentence about contracting does.

**It still claims no role in this workshop.** Every sentence describes what
FUNAPE is and does generally. Its place in the institutions row remains
unconfirmed — see the earlier entry — and nothing in the panel was written to
make that placement look settled.

### What is not there, and why

Wikimedia Commons has no photograph of the Parque Tecnológico, of FUNAPE, or
of Câmpus Colemar Natal e Silva under any licence. The FUNAPE building comes
from Portal UFG under its attributed, non-commercial terms — the same basis as
the FICA and LAPIG photographs. The park itself has none and is drawn in type,
as FICA is.

**Three Commons photographs of the Faculty of Law were rejected**, and they are
the best that exists there: each is a wall of window air-conditioners on
stained concrete. The Hospital das Clínicas frame was taken instead, and it is
honest about what that campus looks like — an urban block on a working street.
Its provenance note records what is in it, including the parked cars, because
the rule now is that the record says what was actually seen.

### A pre-existing layout bug, found while doing this

`.story-photo-essay .story-photo-open img` carried `aspect-ratio: auto`, so
the LAPIG and FICA essays reserved **no height at all** until their images
arrived: measured at 0px, with every caption below them jumping on load. Both
now pass `natural` to `StoryPhotos`, which writes each ratio inline. If a new
gallery wants natural proportions, use `natural` — never bare
`aspect-ratio: auto`.

## The numerals, and FICA rebuilt — 10 September 2026

Two things, and the first is the site's and not FICA's.

### The figures were old-style everywhere

Reported by the client on the FICA panel and true on all four routes: the
numbers looked crooked. They were. Cormorant Garamond ships old-style figures
as its default, so every serif number on the site — the hero's `14–18`, the
`2` in the Time2Graze wordmark, `Mon · 14 Sep` on the day tabs, `1994`,
`1727 · 1937 · 2001`, `Inside FICA 2026` — was set with descending nines,
threes and fours. The rule is in
[Type and detail rules](#type-and-detail-rules); the fix is one inherited
declaration on `body` plus `lining-nums` written into the thirteen
`tabular-nums` rules that would otherwise have reset it.

The client also said the numbers looked like "what every AI site uses", and
that half of it is not solved by an OpenType feature: a 60px serif figure on a
cream ground is the current house style of generated design. Where a figure is
a **count**, it is now Manrope — FICA's `38 / 7 / 4`. Where it is a **date in a
sequence** — Goiânia's steps, the town's spine — the serif stays, because there
the year is being read as a date and not as a measurement. Do not flatten that
distinction in either direction.

### The panel

FICA is the one subject with no cleared photography beyond three archive
frames, so the panel is built out of type and out of the festival's own words.
What it now carries, and why each part is there:

- **A masthead that spells the acronym out of the name.** `FICA` set large,
  and under it `Festival Internacional de Cinema e Vídeo Ambiental` with the
  four initials it gave up marked in the accent. A reader who does not read
  Portuguese gets the acronym explained without a sentence explaining it, and
  the festival's own name — not a translation of it — is what the panel is
  titled. `keyed()` in `components/stories/fica.tsx` walks the mark against the
  title and returns null if any letter fails to land on a word initial, so a
  future edit that breaks the correspondence renders plain text rather than a
  wrong claim about the name.
- **A title card, flush on the film.** `Cidade de Goiás, Goiás`, one line
  saying what the festival is, then `1999 / 27 / 4`. It is dark, and it sits
  directly on top of `StoryCinema` with no gap, so the card and the screen read
  as one block: the room going down before the projector. That is the only dark
  surface in the stories, and it is there because the subject is cinema — not
  because a panel needed contrast.
- **Four competitive showcases, with their real Portuguese names**, ordered
  from the widest reach inwards: international, then Indigenous cinema and
  traditional peoples, then the state, then `Becos da Minha Terra` — the town
  Friday goes to. The Indigenous showcase sits second because it is not a
  geographic category at all; forcing it onto that axis to tidy the shape would
  be the order inventing a claim. They are a `ul`, not an `ol`: a set, not a
  ranking, and the `01 02 03 04` that used to number them was both arbitrary
  and the worst of the old-style figures.
- **The Cora Coralina link.** The best feature in the main competition wins the
  Prêmio Cora Coralina, and the poet's house is a museum a few streets from the
  festival's cinema, already covered in the town's own story. Two subjects the
  site already carries turn out to be one fact.

Sources and the deliberate omissions are in
`research/optional-content-fica.md`. The structured material is in
`data/story-features.ts` beside the other devices'.

**The lime fact row is gone.** It carried `1999`, `16–21 June 2026` and `27` in
60px serif, and the middle one was a June date set in display type on a
September workshop's site.

### Then it was rebuilt again, the same day

The first pass was assembled entirely out of the festival's reporting of its
27th edition, and the client read the result correctly: **it was a page about
the 27th FICA, not about FICA.** A dated title card opened it and the reader
met a theme, a venue, a selection and a prize list before ever learning what
the festival is.

Three rules came out of that, and they generalise past this panel:

- **A subject's page opens on the subject.** The most recent edition is now one
  labelled block — `The most recent edition` — near the foot, styled as the
  quietest band in the panel. It is a fact *about* FICA; it is not FICA.
- **A count belonging to one year is not the shape of the institution.** `38
  films / 7 countries` and the per-showcase feature counts were true and were
  2026's. The showcases now say what each is *for*, permanently. The title
  card's figures are `1999 / 27 / 4`, none of which belongs to a single year.
- **Explain before you show.** `StoryChapters` moved up to sit directly under
  the film block, so a reader learns the festival's subject, the journalist who
  set its line, what it does between screenings and who runs it before reaching
  the competition structure.

**No prize values anywhere**, on the client's instruction of 10 September 2026.
The Prêmio Cora Coralina keeps its name — the name is the whole point of it —
and the Acari Passos and João Bennio prizes are not named at all, because
nothing consulted says who those figures were and a prize name whose owner you
cannot identify adds nothing.

### The frame stopped branching on id

`optional-story.tsx` had one `id === 'fica'` branch left, inside the shared
opening, which is exactly what
[Story devices](#story-devices--9-september-2026) says should not be there. The
default opening is now `StoryOpening` in `story-parts.tsx`, and a subject whose
opening is its own exports one that an `OPENINGS` registry picks up — the same
shape as `BODIES`. `Story` gained two optional fields for it: `mark`, the
acronym a subject is known by, and `note`, the one misreading a subject invites.
FICA is the only user of either. Adding a third `id ===` branch instead of a
registry entry is the failure this replaced.

### A second pre-existing bug, found in the same pass

`.story-steps li p` set `font-size: var(--t-body)` and outranked
`.story-steps-year` on specificity, so Goiânia's `1933 · 1937 · 2003` — written
as display type at `clamp(34px, 3.4vw, 52px)`, with its own mobile and print
step-downs — had been rendering at 16px since the device was built. Nobody saw
it while the years were serif and small; putting them in a heavy sans made it
obvious immediately. The paragraph rule is now `.story-steps li > div p`, which
is where the prose actually lives.

The general shape of this is worth keeping: **a rule written for one child of a
list, sitting beside a rule written for the list's descendants, loses.** If a
device gives an element a display size and the element does not look like
display type, check what else in the file can reach it.

## The phone pass — 10 September 2026

Three things reported from a phone, all of them real.

### A figure and its label were half a screen apart

`.story-facts` and `.fica-figures` both stacked to one column below 600px and
then split each pair into **two equal halves** — `minmax(0, 1fr)
minmax(0, 1fr)`. At 390px that put the number at the left edge and its label at
the right, with room left over for the label to wrap onto two lines. `4` sat
alone opposite `Competitive showcases`, and the reader could not tell which
label belonged to which number.

Both are now `auto minmax(0, 1fr)` on a shared **baseline**: the figure column
shrinks to the widest value and the label starts immediately after it. Hairline
rules separate the pairs, so each row is one thing.

**The rule this generalises to:** on a phone, a label belongs to the value it
names, not to the opposite margin. Two equal columns are a desktop habit —
`auto` plus a baseline is what makes a pair read as a pair. `.fica-edition`
takes the same treatment stacked, with the gap inside a pair smaller than the
gap between them.

### The film chooser did not read as a control

The block ran screen → description → **three notes** → chooser, which on a
phone is a wall of grey type between the screen and the only thing that changes
what is on it. The chooser then read as three unrelated cards.

`components/story-cinema.tsx` now runs screen → the film's own line → chooser →
small print. Three things carry the relationship, and **none of them is a
paragraph explaining the interface** — that rule still holds:

- The chooser is a `fieldset` with a `legend` reading `Choose a film`. Not a
  `div` with `role="group"`: `jsx-a11y/prefer-tag-over-role` asks for the native
  pair, and it needs no id wiring. **`min-width: 0` on the fieldset is
  load-bearing** — a fieldset defaults to `min-width: min-content` and will not
  shrink inside the panel.
- Every row wears a play badge over its own frame, so a row reads as a film you
  can start rather than as a card that links somewhere.
- The row already loaded says `On screen now`; the others say `Watch next`.

### The thumbnails looked cropped

They were `110px` wide with `height: auto` inside a `93px` row, so each frame
floated as a short sliver with dead space above and below it. The frame now
stretches the row (`align-items: stretch`, `122px` wide, the image filling it
with `object-fit: cover`), which is what makes it read as a frame.

Both changes are shared with LAPIG, which uses the same component. Check both
panels after touching it.

### Then the same check was run on all seven

The phone pass above was done on FICA alone, which was the wrong scope: the
same faults were sitting in the other panels. `.story-facts` is shared, so the
pairing fix reached LAPIG, FUNAPE and both city stories the moment it landed —
but two things had to be found by looking.

**There are three choosers, not one.** Films, views (`story-explorer`) and
scales (`story-scale`) all ask the reader to pick, and only the container ever
carried the word — in an `aria-label` no sighted reader saw and which, on the
explorer's bare `div` with no role, assistive technology ignored as well. All
three are now `fieldset` + `legend` with the shared `.story-picker` /
`.story-picker-label` pair: `Choose a film`, `Choose a view`, `Choose a scale of
observation`. If a fourth device asks the reader to choose, it uses the same
two classes.

**Standalone links were between 18px and 37px tall on a phone.** The campus
link was the worst at 18 — under even the 24px WCAG 2.5.8 AA minimum, and the
site's own convention is the 44px target the story trigger already uses. One
rule in the ≤600px block now raises every standalone link to 44. **Links inside
a credit sentence are deliberately excluded**: 2.5.8 exempts a target in a
block of text, and padding them out would break the line they sit in.

The audit is `scripts/`-free on purpose — it was a throwaway Playwright pass at
390px over all seven panels, checking for horizontal overflow, text under 12px,
targets under 40px, and label/value pairs more than 55px apart. Worth
re-running by hand after a layout change; the useful part is the list of what
to look for, which is this paragraph.


## The participants' group — 11 September 2026

The client supplied the workshop's WhatsApp group invite and asked for it on the
site. It is the first link on any page that leaves the site for a destination
that is not an institution's own website, and it landed in two places.

**On the home page, as a coda to the directory.** Not a fourth destination: the
directory indexes the site's three other pages, and this one does not belong in
that count. The strip sits directly under the cards, shares their frame — those
cards' bottom rule is its top rule — and takes the mark into the column the
card indices occupy, so both text columns start on the same left edge. It
carries the outward arrow the internal cards never do. The order of the home
page is unchanged and the argument now ends one step further on: what is
happening now, what this is, where to go, how to reach everyone.

**In the footer, on the second row of the centre column.** Under the name it
belongs to, so a reader on `/programme/` or `/materials/` does not have to go
home for it. The three-column balance the footer already had is untouched:
nothing moved, one row appeared. Both links are direct children of `footer`
because the print rule hides `footer > a`, and a wrapper would have put them
back on paper.

Four things about it are deliberate:

- **The stored link is the canonical invite**, `chat.whatsapp.com/<code>`. It
  arrived from WhatsApp's share sheet carrying `?s=sw&p=i&mlu=4&ilr=4`; those
  parameters describe how the organiser happened to copy it, not the group, and
  publishing them would hand them to every reader.
- **The copy states what happens and who can join, and nothing else.** "Opens
  in WhatsApp. Anyone with the link can join." What the group is *for* has not
  been stated by the organiser, so it is not described. The second sentence is
  also the one property worth knowing before tapping: **an invite link on a
  public page is open to anyone who finds the page**, and this site is published
  on GitHub Pages. If that becomes a problem, the fix is the organiser's —
  reset the invite in WhatsApp and supply a new code — not a change here.
- **The glyph is the real one**, from Simple Icons (CC0), because a generic
  speech bubble does not say which application is about to open. It is drawn in
  `currentColor` and never in WhatsApp's green: the workshop has no badge and
  does not acquire one by linking out. Provenance is in
  `research/logos/README.md`.
- **It is hidden in print**, with the directory and the footer's links. A join
  button on paper does nothing.


## The agenda, reconciled again — 11 September 2026

A newer copy of the organiser's own workbook (`T2G_Brazil_Workshop.xlsx`,
`Agenda` sheet) was compared line by line against `data/agenda.ts`. Five things
had moved; everything else matched exactly, and the reconciliation of
9 September stands.

| Day | Was | Is |
| --- | --- | --- |
| 1, 09:40–10:00 | absent | Welcome Coffee, inside the UFG tour's window |
| 2, 14:00–15:30 | Biomass Data: Methodology and Updates | Remote sensing overview and grassland biomass monitoring: State of the art and future applications (Leandro/OGH) |
| 2, 16:45–17:30 | Open Agenda | A few lessons from recent field campaigns in Brazil (Laerte/LAPIG) |
| 3, 09:00–09:45 | State of the Art: Remote Sensing of Pasture & Decision Support Tools (Leandro/OGH, Emily/WWF) | On the ground biomass estimation: Key concepts and methodologies (Nathália/LAPIG) |
| 5, 09:30–12:00 | Field Visit: Grazing Livestock Farm | …(Fazenda Buriti Queimado) |

The count is 47 scheduled items, not 46. Everything that reads the agenda
followed on its own: the home page's count, the Materials total (22 expected
files, up one — the new Day 2 talk declares slides) and the `.ics` files.

Four decisions in it:

- **Ids did not change.** `d2-open-agenda-afternoon` now holds a talk and
  `d3-state-of-the-art` a different subject, and both keep their names because
  an id is the address a shared link, a material and a recap point at. The
  slot did not move; only what happens in it. Each carries a comment saying so.
- **Two spellings were corrected** — `lessos` and `campaings` — as `Aligment`
  was before them. Nothing else about the supplied wording was touched, and
  the one capital in `On the ground Biomass estimation` came down for the same
  reason.
- **The farm rides `venueNote`, not the title.** It renders as
  `Field Visit: Grazing Livestock Farm (Fazenda Buriti Queimado)` in the `.ics`
  and as a `Note` line on the page, which is exactly how the organiser wrote
  it — and it keeps the title a title rather than a blob holding a place.
  `research/pending-information.md` records that this supersedes the
  8 September "farm names are not required". The Day 1 experimental area stays
  unnamed because nothing names it.
- **The welcome coffee overlaps the tour, and the grid now draws overlaps.**
  See below.

### Overlapping items on the axis

The organiser's sheet gives the UFG tour 08:30–10:00 and the welcome coffee
09:40–10:00 — the coffee closes the tour rather than following it. Both are
kept as written.

Two items running at once are **not** a split session: nobody chooses between
them, so they cannot be `tracks`. Until now every block was `left: 0; right: 0`
and two of them at the same hour would have been drawn on top of each other.
`lanes()` in `components/programme.tsx` now walks a day in start order,
chains items into runs of overlap, and gives each the lowest column free at
its start; `--col` and `--cols` reach the CSS, where they collapse to
`left: 0; width: 100%` at one column — which is every block on four of the
five days. A run shares its width down its whole length, as a week of
calendars has always drawn it.

The chronological list, print and the `.ics` needed nothing: a list is
chronological whether or not two items overlap, and a calendar has always
allowed it. `NowNext` shows the first running item in document order, which
during that twenty minutes is the tour — still true, and the band shows one
item by design.

**If the tour is meant to end at 09:40**, that is a one-line change to
`d1-ufg-tour` and the lane machinery goes quiet on its own. It is not a
guess this file should make.

## The farm map sheet — 12 September 2026

LAPIG supplied a map sheet of Fazenda Buriti Queimado, the Day 5 morning
field visit, prepared by Vinícius V. Mesquita (LAPIG/UFG) on 11 September:
the farm boundary and numbered paddocks over a CBERS-4A image, a locator map,
and six panels — land use and land cover, pasture vigour, pasture
productivity, elevation, slope and median vegetation height.

**It lives in two places, and one of them is the source.** The file is a
material on `d5-farm-morning` in `data/agenda.ts`, so `/materials/` lists it
under Day 5 with its session link, and the assistant corpus picks it up.
`data/field-visit.ts` reads that `href` for the block on Travel & stay,
`components/farm-map.tsx`, rendered as a row of the Friday block
(`#fazenda-buriti-queimado`) — the farm is in Cidade de Goiás and the same
coach reaches both. It is not a venue: no pin, no ride link, no address.

**What ships is two derivatives, not the original.** The supplied sheet is A4
at 300 dpi — a 7015 × 9933 PNG of 29.7 MB, which no one should download on
hotel wi-fi. `public/files/fazenda-buriti-queimado-map.webp` is the whole
sheet at half resolution (3508 × 4967, 3.2 MB): every paddock number and
legend stays sharp under pinch-zoom. The page shows
`public/images/farm/fazenda-buriti-queimado-preview.webp` (1000px, 390 KB),
lazy-loaded, and links it to the full file rather than opening a lightbox, so
a phone uses its own image viewer and the page ships no script for it. Both
were resized with Pillow's Lanczos filter, WebP quality 85 and 80. If a
revised sheet arrives, regenerate both at the same sizes and update the
dimensions and size in `data/field-visit.ts`.

**Everything written beside the sheet is transcribed from it.** The list of
maps and the facts (author, date, projection, data sources) are the sheet's
own lines. The paddock count, the farm's area and any reading of the panels
are not stated on the sheet and are not stated on the site.

On a phone the farm comes before the town's photograph — it is Friday's first
stop — and the "Open full-size map" button comes before the sheet. In print
the sheet floats at 65mm beside its list, and the button is hidden.

**Replaced on 14 September 2026 with a corrected sheet.** The first sheet
carried two legends in Portuguese — `Formação Florestal / Formação Savânica /
Pastagem / Mosaico de Usos / Corpo D'água` and `Baixo / Médio / Alto` — on an
otherwise English sheet. The corrected PNG reads `Forest Formation / Savanna
Formation / Pasture / Mosaic of Uses / Waterbody` and `Low / Medium / High`
(`Mosaic of Uses` is MapBiomas's own English class name). A pixel difference
between the two originals found nothing else changed: every differing pixel
sat inside those two legends. Both derivatives were regenerated at the same
sizes and under the same file names, so no link moved and
`data/field-visit.ts` did not change.

## The Visual Inspection deck — 14 September 2026

Ana Paula's slides for the Day 1 split session arrived as a self-contained HTML
deck (`treinamento-time2graze-modulo1.html`) plus a folder of 49 images, minutes
before the session. They are a material on the `d1-visual-inspection` track in
`data/agenda.ts`, so `/materials/` lists them under Day 1 with the session link.

**What ships is a copy, not the original.** `public/files/visual-inspection-module-1/`
holds the page and `assets/`: only the images the page references, capped at
1920px and converted to WebP (11 MB → 4 MB — the supplied folder held 127 MB of
unused drafts). Three edits to the HTML and no others: image paths point at
`assets/*.webp`; "Back to programme" is relative
(`../../programme/#d1-split-inspection-gee`) instead of the full Pages URL, so
it works under `npm run dev` and any host; and the footer's template leftover
"Example slides, fictitious content" was removed at the organiser's request.
The slides' own text is the presenter's and is not edited here. If a revised deck arrives, rerun the same
conversion over it rather than patching the copy by hand.

**Where a deck is found, and what its button says.** A participant sitting in
the room looks for the slides on the session, not on a page of every file. A
published material now shows on the session or track that uses it — in the
grid (`tabIndex={-1}`, as `ChooseChip`) and in the list (dropped above 1280px,
as the chip is) — and on the home band while its session is running or next.
The button reads `Open slides` for an HTML deck or an external link, and
`Download` only for a real file (`materialAction` in `lib/materials.ts`): the
first deck shipped behind a `Download` button that downloaded nothing. The GEE
course's deck is a Google Slides link, supplied the same morning; whether it
opens for a participant depends on that deck's own sharing, not on the site.
The same pass fixed a pre-existing phone bug: `.resource-file` sat in the 26px
icon column below 760px and overflowed it.

## Daily summary correction — 14 September 2026

The organiser explicitly rejected the session form and JSON interface described above. The current workflow is **one rich-text document per day**: paste or import Word/text/HTML, publish, then edit the document directly during the group reading. `components/recap-editor.tsx` provides a Tiptap editor, and `lib/recap-document.ts` sanitizes rich text and converts old summaries for reading/editing. Do not restore session selectors, decision/action fields, JSON controls or line-flagging as the editing workflow. See `docs/daily-recap.md` for the current procedure.

The live model adds `document?: string` while retaining `sections` for backwards compatibility. Apps Script stores the document without silent truncation; clients sanitize before rendering. A failed or conflicting save keeps local text. Confirming a timed-out save requires reading back the submitted content, not merely finding any published recap. This is one shared saved document, not simultaneous multi-cursor editing.

## Daily summaries move to Google Docs — 14 September 2026

The organiser replaced the in-site rich-text editor with **one Google Doc per day**, shared "Anyone with the link → Commenter", with editors named by email. The site and the repository are public, so link access must never be Editor. The Doc is the official text, and the site displays only accepted text, with a "Comment or suggest edits" link. `apps-script/recap-docs.gs` exports each doc anonymously and caches it for 60 s. `lib/recap-doc.ts` converts the export into the summary's own typography. The Tiptap editor, `components/recap-editor.tsx`, and the `@tiptap/*` and `mammoth` dependencies were removed. Do not restore an in-site editor or a password workflow. See `docs/daily-recap.md` for the doc links and the procedure.

The Ask assistant reads the same summaries live and in full. The worker and the panel both turn the Apps Script response into corpus entries with `lib/recap-corpus.ts`, so the ids the model cites resolve in the panel. Do not move that conversion into only one of them.

## Laerte's field-campaigns deck — 15 September 2026

The Day 2 talk *A few lessons from recent field campaigns in Brazil*
(`d2-open-agenda-afternoon`) was supplied as a Google Slides link. It ships as
a copy, not as a link: exported to PDF, each of its 29 pages rendered to WebP
at 2400px and served by the same full-screen viewer as the Field Protocol
deck (`public/files/field-lessons-brazil/`).

**Self-hosting is the default for a deck, and here it was also the safe
option.** The supplied presentation was shared "Anyone with the link →
Editor", and the site and repository are public: publishing that URL would
have handed every reader write access to the presenter's file. The rule
already written for the daily summaries — link access is never Editor —
applies to slides as well. Ask for a Viewer link, or do what was done here and
serve a copy, which also survives the deck being moved, renamed or reshared.

A revised deck is republished by rerunning the same export and render over it,
not by patching the images in place.

## LAPIG's own channels — 15 September 2026

The host laboratory's Instagram, YouTube and LinkedIn were requested on the
site and sit in the `Institutional affiliations` band on the home page, under
the marks and above the stories, labelled `LAPIG, the host laboratory`
(`LAPIG_CHANNELS` in `data/institutions.ts`).

Three decisions there are deliberate:

- **Not in the footer.** Site-wide chrome would read as the workshop's own
  accounts, and the workshop has none — the same reason it has no badge. Next
  to LAPIG's mark, they are plainly the laboratory's.
- **Names, not brand glyphs.** lucide carries no brand marks, and Simple Icons
  has dropped LinkedIn's at the company's request, so a complete set does not
  exist to draw. The names carry the site's external-link arrow instead.
- **Facebook is left out.** The icon row on lapig.iesa.ufg.br opens with one,
  but it points at UFG's page rather than the laboratory's.

## Santiago's Time2Graze vision deck — 15 September 2026

The Day 2 opening talk `Project Overview & Theory of Change`
(`d2-overview-toc`) was supplied as a PowerPoint file and ships like the
others: converted to PDF, rendered to WebP at 2400px, served by the
full-screen viewer (`public/files/time2graze-vision/`).

Two things about converting a `.pptx` that are easy to get wrong:

- **Install the fonts before converting.** LibreOffice needs
  `libreoffice-impress` (the core package alone refuses the file with "source
  file could not be loaded"), and the deck's Arial, Calibri, Montserrat and
  Roboto need `fonts-liberation`, `fonts-crosextra-carlito`,
  `fonts-montserrat` and `fonts-roboto`. Without them the export silently
  substitutes and the line breaks move.
- **Hidden slides stay hidden.** The file holds 22 slides, two of them hidden
  by the presenter; the PDF export drops those on its own and the published
  deck is the 20 that are shown. Check the count against
  `p:sld … show="0"` before assuming an export lost something.

A local `npx serve` is not a faithful preview of these decks: it redirects
`…/index.html` to `…/index`, which re-bases every relative `slides/NN.webp`
and 404s the lot. GitHub Pages serves the file as asked. Preview with
`python3 -m http.server` inside `out/`.

## A PDF copy behind every deck — 15 September 2026

Each published deck ships a PDF of the same pages beside its viewer
(`deck.pdf` in the deck's folder). It is the fallback: it opens in any browser
with no JavaScript, it can be kept on a phone before the room loses wi-fi, and
it survives whatever happens to the viewer.

**It is a second button on the deck, not a material of its own.**
`Material.pdfCopy` holds its path, and `/materials/`, the programme and the
home band each add one download next to the deck's own link. Declared as a
separate material — which is how it shipped first — the page listed the same
presentation twice under the same session title and counted it as two
expected files. A PDF earns a row of its own only when it is a different
document, as Teles et al. (2025) is.

- **The PDF is built from the published WebP pages, not from the source
  file.** What it shows is exactly what the viewer shows, and the deck folder
  stays the single origin — no second export to keep in step. JPEG at 1800px
  wide keeps Laerte's 29 pages at 3.9 MB against 11 MB for the original
  export; the text stops being selectable, which is the price of a fallback a
  phone will actually finish downloading.
- The viewer's own bar carries the same file as `PDF`, next to `Full screen`.

Laerte's deck also exists as a Google Slides link, and it is deliberately not
published: that presentation is shared `Anyone with the link → Editor`, and
this site is public. The PDF is the plan B instead — see the note on his deck
above.

## Two more Day 2 decks — 15 September 2026

Lindsey's `Priorities and Barriers` (9 slides, a PowerPoint held in Drive) went
onto `d2-priorities-barriers`, which had been expecting it.

Emily Moberg's `Decision Support Tools` (17 slides, Google Slides) fills the
11:00 hour, so `d2-open-agenda` is no longer open: the title, the presenter and
the deck are hers now. **The id keeps its old name**, exactly as
`d2-open-agenda-afternoon` did in the afternoon — an id is the address a shared
link, a recap and the `.ics` point at, and the slot did not move; only what
happens in it. The calendar feed rebuilt itself from the agenda and no longer
mentions an Open Agenda on Day 2.

Emily's deck is shared `Anyone with the link → Editor`, like Laerte's. Serving a
copy is what keeps that off a public page; Lindsey's is `Anyone with the link →
Viewer`, which is the setting to ask for.

## Leandro's two decks, published without a PDF — 15 September 2026

`Remote sensing overview and grassland biomass monitoring` (34 slides, on
`d2-biomass-methodology`) and `Pasto Legal` (19 slides, on `d2-pasto-legal`)
went up as viewers only: both were still being edited when they were supplied,
and the organiser asked for no PDF copy.

**Hours later both were switched to the presentation itself**
(`docs.google.com/presentation/d/…/preview`, `format: 'Google Slides'`), and
the rendered copies were deleted. The viewer is a copy too: it does not follow
the edits, it only differs from a PDF in that the stale version can be
replaced in place rather than sitting on someone's phone. While a deck is
still moving, the link is the honest thing to publish, and it is what the
organiser asked for.

`/preview` rather than `/edit`: it opens the read-only view, and nothing on
this site should invite a reader into someone's editor. Whether it opens at
all depends on that deck's own sharing — both are `Anyone with the link →
Viewer` — not on the site.

When the organiser says a deck is final, rerun the same export and render, put
the folder back under `public/files/<slug>/`, and add the `pdfCopy` then.
While a deck is in flux, a PDF is the one version nobody can correct: it is a
file a participant keeps. Omit `pdfCopy`, and if a viewer is published without
one, delete the `PDF` line from its bar — the template carries one now, and
it would point at a file that does not exist.

## The team directory — 15 September 2026

The project asked for a directory of who is on Time2Graze and what each person
works on, and for the form to be on this site rather than in Google Forms. The
questions, their wording, their order and which of them are required come from
the organiser's specification and are reproduced verbatim: `data/directory.ts`
**is** the form, not a paraphrase of it. Ten questions, three of them a
dropdown, a checkbox group and a multiple choice, one of them a file upload.

**It is deployed.** The Apps Script side went live on 15 September 2026
(`clasp push`, then a redeploy of the existing deployment — never a new one)
and was checked against the published endpoint, photograph included.
[`docs/team-directory.md`](docs/team-directory.md) is the procedure for any
later change, and says why the manifest now carries the full Drive scope:
`DriveApp` refused the photograph under `drive.file`, and a new scope breaks
every endpoint on the web app until the owner accepts it in the editor.

**It is at `/team-directory/`, linked from the home page.** It was published
unlisted first (15 September 2026), so the organiser could share the link and
have people check it before announcing it; the same day it was made visible.
The route stayed, because that address is the one people already had. The home
page carries a panel for it, `#team-directory`, in
`components/team-directory-invite.tsx`: the lede and one link, after the
participants' group and before "Purpose and format", where the organiser asked
for it. It closes the block the hero opens, on that block's paper and rail, and
it is forest with the lime rule — the pairing the hero's date and the "now" band
use — because it is the one thing on the page that asks the reader for
something. The form is not inlined there: ten questions would add about three
screens to a phone, on the page that was split into four to stop exactly that.
It is not a fifth destination either, and is not in the navigation. On its own
page the form is always open and has no close control — the organiser found
one pointless, since anyone arriving there came to answer it.

**It is the first POST the site makes on its own behalf.** Calendar sharing,
recap flagging and the split-session choices are a field each and travel as
JSONP in a query string; a directory entry carries a paragraph and a
photograph, and both would be refused by a URL long before the script refused
them. So `lib/directory.ts` uses the transport the recap publisher established
on 14 September 2026 — a `text/plain` POST, which the browser treats as a
simple request and sends with no preflight Apps Script could not answer. Apps
Script answers it with a 302 the browser follows as a GET, and both hops carry
`access-control-allow-origin: *`. Re-checked against the live endpoint on
15 September 2026 before any of this was written.

**The photograph is resized in the browser, and is allowed to fail on its
own.** Ten megabytes is not a portrait, it is whatever a phone camera
produced, so `lib/directory-photo.ts` accepts the stated size and sends a
1000px JPEG — about 20 kB from a 141 kB original in the test. A file the canvas
cannot decode (an iPhone HEIC, most often) is refused with that reason rather
than stored as an empty image under somebody's name. On the server the row is
written first and the file attempted afterwards: Drive refusing a photograph
must never cost a person the nine answers they typed, and they are told exactly
which of the two happened.

**One row per e-mail address, not one row per send.** The address is the key,
matched lower-cased, so someone correcting their job title rewrites their row
instead of leaving the organiser two entries to reconcile — the same decision
`tracks.gs` makes about a name. An update carrying no new file keeps the
photograph already on the sheet. The browser remembers the entry it sent
(`hooks/use-directory-entry.ts`, the photograph excepted, being too large), so
a correction opens with every answer already in it.

**A "no" to the permission question is recorded, not discarded.** The question
asks whether the information *may be included*, so the answer is the
organiser's to act on and the sheet carries it in its own column. The site says
the same thing before and after sending. Nothing written here is ever read back
on the site: a participant sees their own submission from their own browser and
never anyone else's.

**The endpoint is bounded on the same three sides as the others.** Every choice
has to name an option the form offers — an unknown id is a malformed request,
not a new area of expertise, because the sheet's columns are only comparable
while every row names the same list. The volume is capped per day. And it
closes on 31 October 2026, in two places: `DIRECTORY_CLOSES` in
`data/directory.ts` takes the form off the page, and the same constant in
`apps-script/directory.gs` refuses the write.
`scripts/directory.test.mjs` fails if either copy of the questions, the limits
or the closing date drifts from the other.

### How it was checked

`scripts/directory.test.mjs` runs the real `apps-script/directory.gs` against
fake Google services and the real `lib/directory.ts` against a fake `fetch`:
33 tests over the row keying, the option lists, the caps, the window and the
photograph's independent failure. `scripts/apps-script-fixture.mjs` grew a
second transport for it, and resolves `data/` as well as `lib/` now.

Beyond that, the form was driven in Chromium against the **static export** —
what Pages actually serves — with the request to `script.google.com`
intercepted and forwarded to a local server running the real `directory.gs` and
answering with the same 302 the web app answers with, so the redirect-following
and the CORS read are the browser's own. 91 checks: every question present and
worded as the document words it, an empty form refused with focus on the first
unanswered question, the checkbox group refused where the browser cannot refuse
it, a complete entry with a photograph landing as a sheet row and a JPEG, a
correction replacing that row, a second person adding a second one, "Other"
demanding its own field, the Drive failure, the daily cap, a cut connection, a
double-pressed send sending once, and the whole thing again at 390px. That
harness is not in the repository — it needs a browser download — but it is what
the claim that this works rests on, next to the live check of the deployed
endpoint.

**The assistant knows about it.** `scripts/build-assistant-corpus.mjs` adds
one entry pointing at `/#team-directory` — the home card, since the assistant
test only admits links to the four destinations — so a participant asking
where to add themselves is sent to it rather than told a directory exists.
`components/team-directory-invite.tsx` is among the page sources
`scripts/assistant.test.mjs` checks anchors against.

## Laerte's talk moves to Day 3; Nathália's biomass talk is dropped — 15 September 2026

The organiser cancelled *On the ground biomass estimation* (Nathália, Day 3,
09:00–09:45) for good, and moved *A few lessons from recent field campaigns in
Brazil* (Laerte) from Day 2, 16:45–17:30, into that hour.

- **`d3-state-of-the-art` keeps its id** and now holds Laerte's talk, deck and
  recap prompt. The deck's "Back to programme" link points at it.
- **The Day 2 hour was not reopened.** `d2-open-agenda-afternoon` is gone:
  Pasto Legal runs 16:00–17:00 and the Daily Summary 17:00–18:00, as the
  organiser asked. Do not put an Open Agenda back there.
- **Nathália's biomass deck is not published.** It was built as
  `public/files/on-the-ground-biomass/` but never shipped, and nothing
  references it. Her Day 1 Field Protocol session and deck are unaffected.
