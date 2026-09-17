import { AGENDA } from '@/data/agenda';
import { WORKSHOP_BOARDS } from '@/data/workshop-boards';
import { WORKSHOP_BOARDS as COLLABORATION_BOARDS } from '@/data/collaboration-boards';
import { RecapDayList } from '@/components/recap-index';
import { RecordBoards, type BoardCollection } from '@/components/record-boards';
import { dayLabel, presenterLabel } from '@/lib/schedule';

/** Each published board collection's content, keyed by the material's href. */
const BOARD_DATA: Record<string, typeof WORKSHOP_BOARDS> = {
  '/files/workshop-boards/': WORKSHOP_BOARDS,
  '/files/collaboration-boards/': COLLABORATION_BOARDS,
};

/** The sessions holding boards, read from the agenda like every material. */
const COLLECTIONS: BoardCollection[] = AGENDA.flatMap((day) =>
  day.sessions.flatMap((session) =>
    (session.materials ?? [])
      .filter((material) => material.format === '3D' && material.href && BOARD_DATA[material.href])
      .map((material) => ({
        id: session.id,
        // "Workshop boards · 71 contributions" — the card counts per board itself.
        title: (material.title ?? 'Workshop boards').split(' · ')[0],
        day: day.index,
        dayLabel: dayLabel(day.date),
        session: { id: session.id, title: session.title, presenter: presenterLabel(session) || undefined },
        href: material.href!,
        preview: material.preview,
        boards: BOARD_DATA[material.href!].map((board) => ({
          id: board.id,
          title: board.title,
          contributions: board.notes.filter((note) => !note.label).length,
          facilitator: board.facilitator,
        })),
      })),
  ),
);

/**
 * What the workshop has produced so far: the daily summaries and the boards.
 *
 * Both used to be reachable only from inside the programme — a summary under
 * its day's tab, the boards as one link among a session's files. This band
 * gives them a place on the home page, after the block the hero opens and
 * before the overview, because during the week and after it they are what a
 * returning reader comes for. It is an index, not a destination: every link
 * leads to the programme or to the boards themselves.
 */
export function WorkshopRecord() {
  return (
    <section
      className="record section-pad"
      id="workshop-record"
      aria-labelledby="workshop-record-title"
    >
      <div className="section-title">
        <p>Workshop record</p>
        <h2 id="workshop-record-title">Summaries and boards</h2>
      </div>

      <div className="record-layout">
        <div className="record-summaries">
          <h3>Daily summaries</h3>
          <RecapDayList />
        </div>

        {COLLECTIONS.length > 0 && <RecordBoards collections={COLLECTIONS} />}
      </div>
    </section>
  );
}
