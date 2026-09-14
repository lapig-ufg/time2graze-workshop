import type { VenueId } from './venues';

export type MaterialKind = 'slides' | 'document' | 'protocol';

/**
 * A file a session is expected to produce. Declaring one before it exists is
 * how the site says "this is coming"; `href` stays absent until the file is
 * actually published, and is never invented.
 */
export type Material = {
  kind: MaterialKind;
  /** Only when the file needs a name of its own beyond its kind. */
  title?: string;
  /** Absent means not published yet. */
  href?: string;
  /** 'PDF', 'PPTX'. Only meaningful once there is an href. */
  format?: string;
  /** Open to workshop participants only, rather than to anyone with the link. */
  restricted?: boolean;
};

export type Speaker = {
  name: string;
  /** Institution, rendered after the name as "Name/ORG". */
  org?: string;
};

export type SessionKind =
  | 'technical'
  | 'meal'
  | 'break'
  | 'transport'
  | 'field'
  | 'social';

/** One activity inside a split session. Parallel activities are never a single title. */
export type Track = {
  id: string;
  title: string;
  /**
   * What the activity covers, in the presenter's own words. A participant
   * picks one of two parallel courses, and a title alone is not enough to
   * choose on — so this is the substance of the choice, not decoration.
   *
   * It is shown by the chooser and by the chronological session list. The
   * proportional grid is a fixed-height diagram that clips, so it is silent
   * on this by design.
   */
  description?: string;
  speakers?: Speaker[];
  materials?: Material[];
};

export type Session = {
  /**
   * Hand-written and stable. Never derive it from the title: materials, deep
   * links and calendar entries all point at this value.
   */
  id: string;
  /** Full ISO date. All times are America/Sao_Paulo. */
  date: string;
  start: string;
  /** End of the display interval. See `endStatus` before treating it as confirmed. */
  end?: string;
  /** A provisional end keeps the programme legible but must not drive "Now" or calendar files. */
  endStatus?: 'provisional';
  title: string;
  speakers?: Speaker[];
  /**
   * Recorded for every item, rendered by nothing: the programme, the `.ics`
   * and the home band are all silent on venues. `null` means no location is
   * known. See AGENTS.md, Data model.
   */
  venueId: VenueId | null;
  /** Parenthetical on the agenda line, e.g. "Pizza" in "Welcome Dinner (Pizza)". */
  venueNote?: string;
  kind: SessionKind;
  /** Present only for split sessions; `title` then acts as the group label. */
  tracks?: Track[];
  materials?: Material[];
  /** Omitted means confirmed. 'tbd' renders visibly as unresolved. */
  status?: 'tbd';
};

export type Day = {
  index: number;
  /** Full ISO date; the weekday label is derived from it. */
  date: string;
  /** 'Welcome' | 'Retreat' | 'Field' */
  label: string;
  sessions: Session[];
  /** Files belonging to the day as a whole rather than to one session. */
  materials?: Material[];
};

/**
 * One line of a day's recap, and the unit a reader flags.
 *
 * `id` is hand-assigned, unique within its day and **never reused**: a flag
 * raised against `d3-r7` is read hours later, against a text that may already
 * have been corrected, so the id has to keep meaning the same line. Retire a
 * number when its line is deleted; never renumber the ones around it.
 */
export type RecapItem = {
  /** `d3-r7` — day index, then a serial that only ever grows. */
  id: string;
  text: string;
  /** Who carries the action. Only meaningful inside `actions`. */
  owner?: string;
};

/**
 * The part of a recap covering one session. A block with no `sessionId` is
 * about the day as a whole and carries its own `title` instead — the two are
 * exclusive, and one of them is required.
 */
export type RecapSection = {
  /** A session or track id in `data/agenda.ts`. The heading links to it. */
  sessionId?: string;
  /** Heading for a block belonging to no single session. */
  title?: string;
  /** What happened, in one short paragraph. */
  summary?: RecapItem;
  decisions?: RecapItem[];
  /** Questions the room left open. */
  questions?: RecapItem[];
  actions?: RecapItem[];
};

/**
 * A day's record, published the same evening and corrected afterwards from
 * what readers flag. Absent until the day has actually been summarised —
 * `/programme/` says "to be published" rather than inventing one.
 */
export type DayRecap = {
  /** Rich text for the whole day. Sections remain readable for older recaps. */
  document?: string;
  /** ISO datetime in America/Sao_Paulo, when the first version went up. */
  published: string;
  /** Set on every revision after the first. Rendered; never back-dated. */
  revised?: string;
  /** How many flagged points the latest revision resolved. */
  corrections?: number;
  sections: RecapSection[];
};
