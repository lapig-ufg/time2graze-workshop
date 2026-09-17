import { AGENDA } from './agenda';
import type { Day, Session } from './types';

/**
 * The NotebookLM prompt that drafts each day's recap, one per day.
 *
 * These never render on the site: the prompt is the organiser's drafting
 * tool. To use one, log the day's text (or read it from this module in a
 * scratch file) and paste it into NotebookLM; the draft that comes out is
 * reviewed and then published live on `/programme/` — see
 * `docs/daily-recap.md`, which is the whole procedure.
 *
 * The prompt is written for content, not for speakers. A recording of a room
 * cannot say reliably who said a sentence, and a recap that tries will guess.
 * Presenters come from the agenda, which is already right; owners of actions
 * come from the note-takers, who wrote them down.
 *
 * The session list is read from `data/agenda.ts`, so a retitled session never
 * leaves a prompt asking about the old title. What to look for in each
 * session is written by hand below, keyed by the same ids.
 */

/** What each session is expected to produce, beyond "what was presented". */
const FOCUS: Record<string, string> = {
  'd1-ufg-tour':
    'Brief. Only what was presented about LAPIG and its work that bears on Time2Graze. No description of the tour itself.',
  'd1-visual-inspection':
    'The interpretation criteria taught (colour, tone, texture, shape, context, spectral indices, temporal patterns), how the classes are separated, and any difficulty participants raised in applying them to their own landscapes.',
  'd1-gee-course':
    'Which apps and data layers were shown, what metrics they hold, how the layers are accessed in the Earth Engine Code Editor, and any limitation or missing feature that was raised.',
  'd1-field-protocol':
    'The protocol itself: variables, measurement procedures, plot design, timing and equipment. Separate clearly what was agreed as common to all countries, what differs by country, and what was left to decide.',
  'd1-field-visit':
    'What was shown in the experimental area and what it means for the field protocol. Audio outdoors is poor: rely on the notes and photographs.',
  'd2-checkin': 'Only anything that changes the day or the week. Omit if there is nothing.',
  'd2-overview-toc':
    'The project’s objectives, the theory of change and its main pathways, and how the workshop connects to them.',
  'd2-priorities-barriers':
    'An interactive session. Record the priorities, barriers and partner needs that came out of the room or the group work, grouped by country or partner where the notes or boards group them. Do not attribute a point to an individual.',
  'd2-open-agenda': 'The topics raised and anything settled about them.',
  'd2-biomass-methodology':
    'Sensors, models and methods covered for grassland biomass, their current limits, and the applications proposed for the project.',
  'd2-pasto-legal':
    'What Pasto Legal is, what it delivers, and how it relates to Time2Graze data and users.',
  'd3-checkin': 'Only anything that changes the day or the week. Omit if there is nothing.',
  'd3-mattermost':
    'What Mattermost is for in the project, how participants join and use it, and anything agreed about how the team will communicate there.',
  'd3-state-of-the-art':
    'The concrete lessons from the field campaigns: logistics, sampling, data quality and what should be done differently.',
  'd4-checkin': 'Only anything that changes the day or the week. Omit if there is nothing.',
  'd4-collaboration-map':
    'A two-hour interactive workshop. Record, by country, the actors and partnerships identified, the steps of the uptake journey, and the gaps or dependencies found. Use the boards and group outputs in the notes as the main source.',
  'd4-dst-data-production':
    'The challenges and synergies between AI-based back-ends and the decision-support tool as presented, and anything agreed about how they connect.',
  'd4-methane-data':
    'The methane emission data and methods presented, their coverage and uncertainty, and how they enter the project.',
  'd4-roadmap':
    'The next steps as agreed: each step, its time frame and its owner as written in the notes. Keep what was agreed separate from what was only proposed.',
  'd4-wrap-up':
    'The key takeaways as presented. Do not add takeaways the session did not state.',
  'd5-farm-morning':
    'The grazing system, management and monitoring practices shown at the farm, and what they mean for the project. Audio outdoors will be poor: work from the notes and photographs.',
};

/** The same structure for every country, so seven presentations can be compared. */
const COUNTRY_FOCUS =
  'Use the same headings for every country, so the presentations can be compared: context of grazing and pasture systems; data and field work available; methods in use; challenges; what the country needs from the project. Leave out a heading the presentation did not cover rather than filling it.';

/** Meals, breaks, transport and social items produce nothing to record. */
function recorded(session: Session): boolean {
  if (session.id.endsWith('-daily-summary')) return false;
  return session.kind === 'technical' || session.kind === 'field';
}

function focusFor(id: string): string | undefined {
  if (id.startsWith('d3-country-')) return COUNTRY_FOCUS;
  return FOCUS[id];
}

function presenters(names: Session['speakers']): string {
  if (!names?.length) return '';
  return ` (${names.map((s) => (s.org ? `${s.name} / ${s.org}` : s.name)).join(', ')})`;
}

function sessionLines(day: Day): string {
  const lines: string[] = [];
  for (const session of day.sessions.filter(recorded)) {
    const time = `${session.start}–${session.end ?? ''}`;
    if (session.tracks?.length) {
      lines.push(
        `- ${time} ${session.title} — two activities in parallel, each with its own recording. Write one block per activity:`,
      );
      for (const track of session.tracks) {
        lines.push(`  - ${track.title}${presenters(track.speakers)} [${track.id}]`);
        const focus = focusFor(track.id);
        if (focus) lines.push(`    Focus: ${focus}`);
      }
      continue;
    }
    const venue = session.venueNote ? `, ${session.venueNote}` : '';
    lines.push(`- ${time} ${session.title}${presenters(session.speakers)}${venue} [${session.id}]`);
    const focus = focusFor(session.id);
    if (focus) lines.push(`  Focus: ${focus}`);
  }
  return lines.join('\n');
}

/** A note about the day's sources that the prompt should act on. */
const DAY_NOTES: Record<number, string> = {
  1: 'There is no summary session today; the day ends with the Welcome Dinner. The field visit was outdoors, so its audio is likely poor.',
  2: 'The last session runs straight into the 17:30 Daily Summary. If its recording is not in the notebook yet, cover it from the notes, or leave it out and say so.',
  3: 'Six country presentations. Keep them in the order they were held and on the same headings. Laerte’s talk moved to 17:00 and runs straight into the 17:45 Daily Summary; if its recording is not in the notebook yet, cover it from the notes or say it is missing.',
  4: 'Uganda’s country presentation, moved from Day 3, opened the day at 09:00; give it the same headings as the Day 3 countries. The 17:30 wrap-up and this record are the same content: the takeaways in the wrap-up should come from the sessions below, not from new statements.',
  5: 'A field day. Audio outdoors will be poor or missing; the notes and photographs are the main source. The city tour and the lookout are not technical and are not recorded.',
};

function promptFor(day: Day): string {
  const date = new Date(`${day.date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });

  return `You are writing the internal record of Day ${day.index} (${date}) of the Time2Graze Brazil Workshop, from the sources selected in this notebook: session recordings, the note-takers' notes and photographs of notes or boards.

This is a record of CONTENT. Report what was presented, discussed, agreed and left open. Do not try to work out who is speaking in a recording, and do not attribute statements, opinions or questions to individuals. Write "the group discussed…", "it was proposed that…", "a question was raised about…". The presenter of each session is given below from the agenda; use that and nothing else to name them.

Use only sources from Day ${day.index}. ${DAY_NOTES[day.index] ?? ''}

SESSIONS, in the order they were held. Session ids are in brackets; keep them in your headings.

${sessionLines(day)}

FOR EACH SESSION, write:

## <session title> [<session id>]
WHAT HAPPENED: one paragraph, at most 120 words. The substance, not the format of the session.
DECISIONS: only what the room actually settled. One line each.
OPEN QUESTIONS: what was raised and left unresolved. One line each.
ACTIONS: one line each, starting with the owner in square brackets, e.g. "[LAPIG] Circulate the revised field protocol." Take the owner only from the written notes or from an explicit assignment ("LAPIG will…"). If no owner is written down, use "[Owner not recorded]". Never infer an owner from a voice.

Leave out a heading that has nothing under it. If a session has no usable source, write "No source for this session." and move on.

RULES
- English only, even where the room spoke Portuguese or Spanish.
- Use only what the sources support. Where the audio is unclear or the sources disagree, write an open question instead of choosing.
- Keep numbers, dates, dataset names, places and technical terms exactly as they appear in the sources.
- Name institutions and countries when the content belongs to them ("INIA reported…"); never name a person except the presenter from the agenda or an action owner from the notes.
- No preamble, no conclusion, no praise of the day or of the presenters. This is a record, not a report of how the day went.`;
}

/** The prompt for every day, keyed by `Day.index`. Never rendered anywhere. */
export const RECAP_PROMPTS: Record<number, string> = Object.fromEntries(
  AGENDA.map((day) => [day.index, promptFor(day)]),
);
