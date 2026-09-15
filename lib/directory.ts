/**
 * One person's entry in the Time2Graze team directory, sent to the organiser.
 *
 * **Not JSONP.** The other three writes on this site travel in a query string
 * because they are a word each; a directory entry carries a paragraph and,
 * optionally, a photograph. Both would be refused by a URL long before they
 * were refused by the script. This is the transport the recap publisher
 * established on 14 September 2026 and which was checked cross-origin from
 * the live site: a `text/plain` POST, which the browser treats as a simple
 * request and sends with no preflight Apps Script could not answer. Apps
 * Script answers it with a 302 the browser follows as a GET, and both hops
 * carry `access-control-allow-origin: *`, so the reply is readable.
 *
 * Nothing sent here is ever read back on the site. A participant sees their
 * own submission from their own browser, never anyone else's, and never a
 * list — the sheet on the organiser's account is the directory's only copy.
 */

import { APPS_SCRIPT_ENDPOINT, appsScriptEnabled } from './apps-script';
// Relative, not `@/data/directory`, for the reason `lib/recap-text.ts` is:
// `scripts/directory.test.mjs` loads this module in node, which resolves no
// alias, and the limits are a value rather than a type it can strip away.
import { DIRECTORY_LIMITS } from '../data/directory';

export const directoryEnabled = appsScriptEnabled;

/** The photograph, already read and resized by `lib/directory-photo.ts`. */
export type DirectoryPhoto = {
  name: string;
  type: string;
  /** Base64, without the `data:` prefix. */
  data: string;
};

export type DirectoryEntry = {
  name: string;
  organization: string;
  jobTitle: string;
  regions: string;
  team: string;
  role: string;
  expertise: string[];
  expertiseOther: string;
  email: string;
  consent: string;
  photo: DirectoryPhoto | null;
};

export type DirectoryStatus =
  /** First entry for this address. */
  | 'saved'
  /** This address had already answered; the row now says this instead. */
  | 'updated'
  | 'invalid'
  | 'limit'
  /** The directory has closed. */
  | 'closed'
  | 'timeout'
  | 'error';

/** What became of the photograph. The entry is saved either way. */
export type DirectoryPhotoResult = 'stored' | 'failed' | 'none';

export type DirectoryResult = {
  status: DirectoryStatus;
  photo: DirectoryPhotoResult;
};

const ANSWERS = ['saved', 'updated', 'invalid', 'limit', 'closed'];
const PHOTO_RESULTS = ['stored', 'failed', 'none'];

/** Long enough for a photograph on hotel wi-fi, short enough to admit defeat. */
const TIMEOUT_MS = 60000;

/** Trimmed and capped here as well as in the script: the field is the contract. */
function field(value: string, max: number) {
  return value.trim().slice(0, max);
}

export function directoryPayload(entry: DirectoryEntry) {
  const payload: Record<string, unknown> = {
    action: 'directory',
    name: field(entry.name, DIRECTORY_LIMITS.name),
    organization: field(entry.organization, DIRECTORY_LIMITS.organization),
    jobTitle: field(entry.jobTitle, DIRECTORY_LIMITS.jobTitle),
    regions: field(entry.regions, DIRECTORY_LIMITS.regions),
    team: entry.team,
    role: field(entry.role, DIRECTORY_LIMITS.role),
    expertise: entry.expertise,
    expertiseOther: field(entry.expertiseOther, DIRECTORY_LIMITS.expertiseOther),
    email: field(entry.email, DIRECTORY_LIMITS.email).toLowerCase(),
    consent: entry.consent,
  };
  if (entry.photo) payload.photo = entry.photo;
  return payload;
}

export async function submitDirectoryEntry(
  entry: DirectoryEntry,
): Promise<DirectoryResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(APPS_SCRIPT_ENDPOINT, {
      method: 'POST',
      // text/plain keeps the request simple; the body is JSON regardless.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(directoryPayload(entry)),
      signal: controller.signal,
    });
    const data = await response.json();
    const status = ANSWERS.includes(data?.status)
      ? (data.status as DirectoryStatus)
      : 'error';
    const photo = PHOTO_RESULTS.includes(data?.photo)
      ? (data.photo as DirectoryPhotoResult)
      : 'none';
    return { status, photo: status === 'saved' || status === 'updated' ? photo : 'none' };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return { status: aborted ? 'timeout' : 'error', photo: 'none' };
  } finally {
    clearTimeout(timer);
  }
}
