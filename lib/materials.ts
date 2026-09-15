import { AGENDA } from '@/data/agenda';
import type { Day, Material, MaterialKind } from '@/data/types';

const KIND_LABEL: Record<MaterialKind, string> = {
  slides: 'Slides',
  document: 'Document',
  protocol: 'Protocol',
};

function materialLabel(material: Material) {
  return material.title ?? KIND_LABEL[material.kind];
}

/** A file, and the thing it belongs to. */
export type MaterialEntry = {
  id: string;
  material: Material;
  /** The session or track title, or the file's own name for day-level files. */
  context: string;
  /** Anchor of the session to link back to. Absent for day-level files. */
  sessionId?: string;
};

export type DayMaterials = { day: Day; entries: MaterialEntry[] };

/**
 * The materials section, read out of the agenda.
 *
 * There is no second list to keep in step: a file is declared on the session
 * that produces it, and appears here because of that. A track carries its own
 * files but links back to the session that holds it, since that is what the
 * programme anchors.
 */
export function materialsByDay(): DayMaterials[] {
  return AGENDA.map((day) => {
    const entries: MaterialEntry[] = [];

    for (const [index, material] of (day.materials ?? []).entries()) {
      entries.push({
        id: `material-day-${day.index}-${index}`,
        material,
        context: materialLabel(material),
      });
    }

    for (const session of day.sessions) {
      for (const [index, material] of (session.materials ?? []).entries()) {
        entries.push({
          id: `material-${session.id}-${index}`,
          material,
          context: session.title,
          sessionId: session.id,
        });
      }
      for (const track of session.tracks ?? []) {
        for (const [index, material] of (track.materials ?? []).entries()) {
          entries.push({
            id: `material-${track.id}-${index}`,
            material,
            context: track.title,
            sessionId: session.id,
          });
        }
      }
    }

    return { day, entries };
  }).filter((group) => group.entries.length > 0);
}

/** The line under the title: what the file is, and how it is reached. */
export function materialDetail(entry: MaterialEntry) {
  const parts = [
    entry.sessionId
      ? materialLabel(entry.material)
      : KIND_LABEL[entry.material.kind],
  ];
  if (entry.material.format) parts.push(entry.material.format);
  if (entry.material.restricted) parts.push('Participants only');
  return parts.join(' · ');
}

/**
 * What pressing the file does. A deck published as a web page, or hosted
 * elsewhere (Google Slides), opens in the browser; calling that `Download`
 * promised a file that never arrives.
 */
export function materialAction(material: Material) {
  const opens =
    material.format === 'HTML' ||
    isPdf(material) ||
    /^https?:\/\//.test(material.href ?? '');
  const verb = opens ? 'Open' : 'Download';
  return `${verb} ${KIND_LABEL[material.kind].toLowerCase()}`;
}

/**
 * A PDF hosted on the site opens in the browser's own viewer, and also carries
 * a second, explicit Download link: reading it in the room and keeping a copy
 * are both expected.
 */
export function isPdf(material: Material) {
  return material.format === 'PDF' && !/^https?:\/\//.test(material.href ?? '');
}

/** The files a session or track has actually published, in declared order. */
export function publishedMaterials(item: { materials?: Material[] }) {
  return (item.materials ?? []).filter(
    (m): m is Material & { href: string } => Boolean(m.href),
  );
}
