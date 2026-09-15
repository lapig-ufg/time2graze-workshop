/**
 * The Time2Graze team directory form.
 *
 * The project is assembling an internal directory of who is involved and what
 * each person works on. The questions, their order, their wording and which of
 * them are required come from the organiser's specification
 * (`TIME2GRAZE TEAM DIRECTORY`, supplied 15 September 2026) and are reproduced
 * here verbatim — this file is the form, not a paraphrase of it.
 *
 * The answers travel to the same Apps Script web app every other write on this
 * site uses and land in a private spreadsheet on the organiser's account. The
 * script holds its own copy of the option lists, because a public endpoint has
 * to refuse anything that does not name a real one;
 * `scripts/directory.test.mjs` fails the moment the two drift apart.
 */

/** Last day the endpoint accepts an entry, in the workshop's timezone. */
export const DIRECTORY_CLOSES = '2026-10-31';

/**
 * Lengths. They are here rather than in the component because the script
 * enforces the same numbers, and one list is the only way that stays true.
 */
export const DIRECTORY_LIMITS = {
  name: 120,
  organization: 120,
  jobTitle: 120,
  regions: 200,
  role: 1200,
  expertiseOther: 120,
  email: 120,
  /** The specification's own ceiling on the uploaded file. */
  photoBytes: 10 * 1024 * 1024,
} as const;

export type DirectoryOption = { id: string; label: string };

/** "Which Time2Graze team are you part of?" — a dropdown, one answer. */
export const DIRECTORY_TEAMS: readonly DirectoryOption[] = [
  { id: 'remote-sensing-team', label: 'Remote Sensing Team' },
  { id: 'decision-support-team', label: 'Decision Support Team' },
  { id: 'both-or-neither', label: 'Both or neither' },
];

/**
 * "What are your areas of expertise?" — checkboxes, at least one.
 *
 * `other` carries a field of its own, as it does on a Google Form: an answer
 * of "Other" with nothing beside it tells the directory nothing.
 */
export const DIRECTORY_EXPERTISE: readonly DirectoryOption[] = [
  { id: 'remote-sensing', label: 'Remote sensing and Earth observation' },
  { id: 'machine-learning', label: 'Machine learning and data science' },
  { id: 'livestock-systems', label: 'Livestock systems' },
  { id: 'methane', label: 'Methane emissions' },
  { id: 'decision-support-tools', label: 'Decision-support tools' },
  { id: 'engagement-training', label: 'User engagement and training' },
  { id: 'policy-programmes', label: 'Policy and program applications' },
  { id: 'monitoring-evaluation', label: 'Monitoring, evaluation and learning' },
  { id: 'coordination', label: 'Project coordination' },
  { id: 'communications', label: 'Communications' },
  { id: 'other', label: 'Other' },
];

export const DIRECTORY_OTHER = 'other';

/** "Directory permission" — multiple choice, and the one that gates inclusion. */
export const DIRECTORY_CONSENT: readonly DirectoryOption[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];

/**
 * The statement the consent question is asking about, quoted from the
 * specification. It is the sentence a person agrees to, so it is rendered as
 * the question's own text and never summarised.
 */
export const DIRECTORY_CONSENT_STATEMENT =
  'I agree that the information and photo I provided may be included in an ' +
  'internal Time2Graze team directory.';

/**
 * The lede. Two sentences from the specification, unchanged: what the
 * directory is for, and what is being asked.
 */
export const DIRECTORY_INTRO =
  'We are creating an internal Time2Graze directory to help project partners ' +
  'understand who is involved and each person’s role and expertise. Please ' +
  'provide the information you would like included in the directory.';

export const DIRECTORY_TITLE = 'Time2Graze team directory';

/**
 * True until the end of DIRECTORY_CLOSES, read in the workshop's timezone.
 * A null date is the prerendered page and the moment before hydration, where
 * the form is offered: the script is what actually refuses a late entry, and
 * hiding the form on a guess would hide it from everyone the build reaches.
 */
export function directoryOpen(today: string | null): boolean {
  return today === null || today <= DIRECTORY_CLOSES;
}
