/**
 * Generates the corpus the assistant answers from, out of the same typed data
 * the pages render.
 *
 * The whole site is small enough to fit in one model context, so there is no
 * retrieval index here and no second copy of any fact: every entry is derived
 * from `data/`, and every entry carries the deep link the reader should be
 * sent to. An answer the corpus cannot support is an answer the assistant
 * must refuse — which only works while this file stays a projection of the
 * data rather than a place to write prose.
 *
 * What must never enter the corpus: the SVG path strings in `data/geography.ts`
 * (kilobytes of map geometry a model cannot use) and anything not already
 * published on a page. `scripts/assistant.test.mjs` enforces both.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AGENDA, TRACK_CHOICE_CLOSES } from '../data/agenda.ts';
import { VENUES } from '../data/venues.ts';
import { DESTINATIONS } from '../data/navigation.ts';
import { ACCOMMODATION_PLAN, SHUTTLE_PLAN } from '../data/practical.ts';
import { CITY_STORIES, GUIDE_PLACES } from '../data/city-guide.ts';
import {
  GOIANIA_FACTS,
  GOIANIA_HISTORY,
  GOIANIA_INTRO,
  TOWN_FACTS,
  TOWN_HISTORY,
  TOWN_INTRO,
} from '../data/geography.ts';
import { RECAPS } from '../data/recaps.ts';
import { VISUAL_INSPECTION_MODULE } from '../data/assistant-materials.ts';
import { dayLabel, presenterLabel, timeLabel } from '../lib/schedule.ts';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
/* Tests build their own copy rather than racing each other for the published
   one, so the destination is an argument with the real one as its default. */
const outputPath = process.argv[2]
  ? resolve(process.argv[2])
  : join(projectRoot, 'public', 'assistant-corpus.json');

/**
 * A ceiling, not a target. The corpus travels in every request the worker
 * makes, so its size is a running cost as well as a context budget; crossing
 * this means something large got in that probably should not have.
 */
const MAX_BYTES = 120_000;

/** @type {{ id: string, kind: string, title: string, text: string, href: string }[]} */
const entries = [];

const DESTINATION_LABEL = new Map(DESTINATIONS.map(({ href, label }) => [href, label]));

function locationFor(href, day) {
  const [path] = href.split('#');
  const page = DESTINATION_LABEL.get(path) ?? 'Workshop site';
  return day ? `${page} · Day ${day}` : page;
}

/* Where each place is drawn on Travel & stay, so a source button lands on the
   card rather than the top of the page. The anchors are the ones the page
   itself renders; `scripts/assistant.test.mjs` checks they still exist. */
const PLACE_HREF = {
  hotel: '/practical/#hotel',
  lapig: '/practical/#lapig',
  cidadeDeGoias: '/practical/#cidade-de-goias',
};
const CITY_HREF = {
  goiania: '/practical/#orientation',
  goias: '/practical/#cidade-de-goias',
};

function add(id, kind, title, text, href, day, details, extra = {}) {
  const body = text.replace(/\s+/g, ' ').trim();
  if (body)
    entries.push({
      id,
      kind,
      title,
      text: body,
      href,
      ...(day ? { day } : {}),
      location: extra.location ?? locationFor(href, day),
      ...(details?.length ? { details } : {}),
      ...(extra.source ? { source: extra.source } : {}),
      ...(extra.actions?.length ? { actions: extra.actions } : {}),
    });
}

/* The four destinations, so the assistant can route a reader who is lost
   rather than answering a navigation question with a fact. */
const PAGE_TEXT = {
  '/': 'The overview: what the workshop is, when and where it runs, the partner institutions, and during the week the session running now and the one due next.',
  '/programme/':
    'The five days in full, each session with its times and presenters, the printable programme, the calendar files, and each day’s recap once published.',
  '/practical/':
    'Travel and stay: the hotel, airport arrival, the daily shuttle, maps of every venue, and free-time recommendations in Goiânia.',
  '/materials/':
    'Presentations and documents, grouped by day and linked to the session that produces each one.',
};

for (const { href, label } of DESTINATIONS) {
  add(`page-${href}`, 'page', label, PAGE_TEXT[href] ?? '', href);
}

/* The programme. A session's anchor is its id, and the day panel resolves it
   from the hash on load — so a session link lands on the open day. */
for (const day of AGENDA) {
  const when = dayLabel(day.date);
  const summary = day.sessions.map((s) => `${s.start} ${s.title}`).join('; ');
  add(
    `day-${day.index}`,
    'day',
    `Day ${day.index} · ${day.label} · ${when}`,
    `Day ${day.index} of the workshop, ${when} (${day.label}). Sessions: ${summary}.`,
    `/programme/#day-${day.index}`,
    day.index,
  );

  for (const session of day.sessions) {
    const parts = [
      `Day ${day.index}, ${when}, ${timeLabel(session)} (America/Sao_Paulo).`,
      session.title + '.',
    ];

    const presenters = presenterLabel(session);
    if (presenters) parts.push(`Presented by ${presenters}.`);

    /* Venues are recorded on every session and rendered by none of them: the
       programme and the calendar have been silent on places since 5 September
       2026, and daily movement is the shuttle. Naming one here would make the
       assistant the only surface contradicting the pages. */
    if (session.venueNote) parts.push(`${session.venueNote}.`);
    if (session.status === 'tbd')
      parts.push('This item is not confirmed yet (TBD).');
    if (session.endStatus === 'provisional') {
      parts.push('The end time is provisional.');
    }

    if (session.tracks) {
      parts.push(
        `This is a split session: participants choose between ${session.tracks
          .map((t) => {
            const who = presenterLabel(t);
            return who ? `${t.title} (${who})` : t.title;
          })
          .join(
            ' and ',
          )}. Choices are accepted on /programme/ until ${TRACK_CHOICE_CLOSES}.`,
      );
    }

    add(
      session.id,
      'session',
      `${session.title} · Day ${day.index}`,
      parts.join(' '),
      `/programme/#${session.id}`,
      day.index,
    );

    /* An activity inside a split session is a thing a participant chooses and
       attends, with its own presenter and its own files. It is not separately
       anchored — the programme anchors the session that holds it — but a
       reader asking who runs the GEE course has to be able to find it. */
    for (const track of session.tracks ?? []) {
      const who = presenterLabel(track);
      add(
        track.id,
        'session',
        `${track.title} · Day ${day.index}`,
        `One half of the split session "${session.title}" on Day ${day.index}, ${when}, ${timeLabel(session)} (America/Sao_Paulo).${who ? ` Presented by ${who}.` : ''} Participants choose between this and ${session.tracks
          .filter((t) => t.id !== track.id)
          .map((t) => t.title)
          .join(', ')}.${track.description ? ` ${track.description}` : ''}`,
        `/programme/#${session.id}`,
        day.index,
      );
    }
  }
}

/* Files, and the session each belongs to. A material with no `href` is
   declared but not published — the assistant has to be able to say so. */
for (const day of AGENDA) {
  const declare = (material, context, sessionId) => {
    const state = material.href
      ? `Published${material.format ? ` as ${material.format}` : ''}${material.restricted ? ', open to workshop participants only' : ''}.`
      : 'Not published yet.';
    add(
      `material-${sessionId ?? `day-${day.index}`}-${material.kind}-${entries.length}`,
      'material',
      `${material.title ?? material.kind} · ${context}`,
      `${material.kind} for ${context}, Day ${day.index}. ${state}`,
      `/materials/#materials-day-${day.index}`,
      day.index,
    );
  };

  for (const material of day.materials ?? [])
    declare(material, `Day ${day.index}`);
  for (const session of day.sessions) {
    for (const material of session.materials ?? []) {
      declare(material, session.title, session.id);
    }
    for (const track of session.tracks ?? []) {
      for (const material of track.materials ?? []) {
        declare(material, track.title, session.id);
      }
    }
  }
}

/* Places. `address` and `arrivalNote` are only ever present once confirmed,
   so what is here is safe to repeat to someone standing in an arrivals hall;
   `pending` is what the page itself shows as missing. */
for (const [id, venue] of Object.entries(VENUES)) {
  /* What a reader copies or reads aloud goes in `details`, not in the text:
     the worker sends only the text to the model, and on 11 September 2026 the
     model wrote "Santa Genoveza" for Santa Genoveva twice while copying it.
     The panel sets these under the answer verbatim. */
  const details = [
    ['Area', venue.locality],
    ['Address', venue.address],
    ['Phone', venue.phone],
    ['Website', venue.website],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));

  const parts = [`${venue.name} — ${venue.use}.`];
  if (!venue.address)
    parts.push('No confirmed postal address is published for this place.');
  if (details.length) {
    parts.push(
      `Listed with it exactly as published: ${details.map((d) => d.label.toLowerCase()).join(', ')}.`,
    );
  }
  if (venue.arrivalNote) parts.push(venue.arrivalNote);
  if (venue.pending) parts.push(`Still to be confirmed: ${venue.pending}`);
  /* The pin itself, not its coordinates: a decimal degree is nothing a reader
     wants read back to them, and nothing a model should be tempted to
     calculate with. Travel & stay draws the map. */
  if (venue.coords) {
    parts.push(
      venue.ride
        ? 'Travel & stay maps this place and offers an Uber link to it.'
        : 'Travel & stay maps this place. No ride link is offered for it.',
    );
  }
  add(
    `venue-${id}`,
    'venue',
    venue.name,
    parts.join(' '),
    PLACE_HREF[id] ?? '/practical/',
    undefined,
    details,
    {
      actions: venue.ride
        ? [{ type: 'uber', venueId: id, label: `Open Uber to ${venue.short}` }]
        : [],
    },
  );
}

/* Module 1 is a published HTML presentation. Only its useful teaching text
   enters the corpus, in named slide ranges; its embedded imagery, styles and
   scripts would inflate every answer without making one more accurate. */
for (const section of VISUAL_INSPECTION_MODULE.sections) {
  add(
    section.id,
    'presentation',
    `${section.title} · ${VISUAL_INSPECTION_MODULE.title}`,
    `${section.text} This is published in ${VISUAL_INSPECTION_MODULE.title}, slides ${section.slides}.`,
    '/materials/#materials-day-1',
    1,
    undefined,
    {
      source: `${VISUAL_INSPECTION_MODULE.title} · slides ${section.slides}`,
      actions: [
        {
          type: 'material',
          href: `${VISUAL_INSPECTION_MODULE.href}#s${section.slides.split('–')[0]}`,
          label: `Open slides ${section.slides}`,
        },
      ],
    },
  );
}

/* Friday's farm has no venue record — nobody navigates there alone — but its
   map sheet is published on the Friday block, and a reader asking for "the
   farm map" should be sent to it. */
const farmVisit = AGENDA.flatMap((day) => day.sessions).find(
  (s) => s.id === 'd5-farm-morning',
);
if (farmVisit?.materials?.some((m) => m.href)) {
  add(
    'farm-map',
    'practical',
    `Map of ${farmVisit.venueNote}`,
    `${farmVisit.venueNote} hosts ${farmVisit.title}, Friday 18 September, ${farmVisit.start}–${farmVisit.end}, near Cidade de Goiás. A map sheet of the farm, prepared by LAPIG/UFG, is published on Travel & stay and on Materials: the farm boundary and numbered paddocks over a satellite image, with maps of land use and land cover, pasture vigour, pasture productivity, elevation, terrain slope and median vegetation height.`,
    '/practical/#fazenda-buriti-queimado',
    5,
  );
}

add(
  'stay-accommodation',
  'practical',
  'Accommodation',
  `Rooms are booked for ${ACCOMMODATION_PLAN.dates} at ${VENUES.hotel.name}. Payment: ${ACCOMMODATION_PLAN.payment}.`,
  '/practical/#stay',
);

add(
  'stay-shuttle',
  'practical',
  'Daily shuttle',
  `The workshop shuttle is how participants move each day. ${SHUTTLE_PLAN.map(
    (leg) =>
      `${leg.days}: ${leg.time}, ${leg.detail}${leg.provisional ? ' (provisional)' : ''}`,
  ).join('. ')}.`,
  '/practical/#transport',
);

/* City context and free-time places. These are recommendations, not workshop
   commitments, and the corpus says so: nothing here promises opening hours. */
for (const [id, story] of Object.entries(CITY_STORIES)) {
  const parts = [`${story.title} — ${story.subtitle}.`];
  if ('workshopContext' in story) parts.push(story.workshopContext);
  parts.push(...story.paragraphs);
  for (const detail of story.details ?? [])
    parts.push(`${detail.title}: ${detail.text}`);
  add(`city-${id}`, 'city', story.title, parts.join(' '), CITY_HREF[id] ?? '/practical/#orientation');
}

add(
  'city-goiania-facts',
  'city',
  'Goiânia in figures',
  `${GOIANIA_INTRO} ${GOIANIA_FACTS.map((f) => `${f.label}: ${f.value}${f.note ? ` (${f.note})` : ''}`).join('. ')}. History: ${GOIANIA_HISTORY.map((m) => `${m.year} — ${m.event}`).join(' ')}`,
  CITY_HREF.goiania,
);

add(
  'city-goias-facts',
  'city',
  'Cidade de Goiás in figures',
  `${TOWN_INTRO} ${TOWN_FACTS.map((f) => `${f.label}: ${f.value}${f.note ? ` (${f.note})` : ''}`).join('. ')}. History: ${TOWN_HISTORY.map((m) => `${m.year} — ${m.event}`).join(' ')}`,
  CITY_HREF.goias,
);

for (const place of GUIDE_PLACES) {
  add(
    `guide-${place.id}`,
    'guide',
    place.name,
    `${place.category} in ${place.area}, Goiânia. ${place.description} A free-time recommendation, not a workshop venue; opening hours are not published here.`,
    '/practical/#recommendations',
    undefined,
    place.website ? [{ label: 'Website', value: place.website }] : [],
  );
}

/* Recaps exist only after the day they describe, so most builds add nothing
   here. Flagged lines keep their ids: a reader asking about `d3-r7` is asking
   about the line the organiser reads the next morning. */
for (const [index, recap] of Object.entries(RECAPS)) {
  for (const section of recap.sections) {
    const lines = [
      section.summary,
      ...(section.decisions ?? []),
      ...(section.questions ?? []),
      ...(section.actions ?? []),
    ].filter(Boolean);
    for (const line of lines) {
      add(
        `recap-${line.id}`,
        'recap',
        `Day ${index} recap`,
        `${line.text}${line.owner ? ` (owner: ${line.owner})` : ''}`,
        `/programme/#recap-day-${index}`,
        Number(index),
      );
    }
  }
}

const ids = entries.map((e) => e.id);
const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
if (duplicate) throw new Error(`assistant: duplicate corpus id ${duplicate}`);

const corpus = {
  /* Read by the worker to refuse a corpus it did not expect, and printed in
     the panel so a stale cache is visible rather than silent. */
  generated: new Date().toISOString(),
  workshop:
    'Time2Graze Brazil Workshop · 14–18 September 2026 · Goiânia, Brazil',
  timezone: 'America/Sao_Paulo',
  entries,
};

const json = JSON.stringify(corpus, null, 1);
if (json.length > MAX_BYTES) {
  throw new Error(
    `assistant: corpus is ${json.length} bytes, over the ${MAX_BYTES} ceiling — something large got in`,
  );
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, json, 'utf8');
const { size } = await stat(outputPath);
console.log(`assistant: ${entries.length} entries — ${size} bytes`);
