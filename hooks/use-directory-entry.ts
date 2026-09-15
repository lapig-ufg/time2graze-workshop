'use client';

import { useSyncExternalStore } from 'react';

/**
 * The directory entry this browser has already sent.
 *
 * The sheet on the organiser's account is the record; this exists so a person
 * coming back to correct their job title is not asked to type nine answers
 * again, and so the section can say what it already holds rather than offering
 * a blank form to someone who has answered.
 *
 * The photograph is deliberately not kept: a resized portrait is a few hundred
 * kilobytes of base64, which is most of what a browser will store, and the one
 * already on the sheet stays there unless a new file is picked.
 *
 * An external store rather than an effect: the site is prerendered, so the
 * markup carries no entry at all and only the client knows better — the same
 * reason `use-track-choice` and `use-workshop-clock` are built this way.
 */
const STORE_KEY = 't2g-team-directory';

export type SentEntry = {
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
  /** ISO date-time this browser last sent it, for the statement it shows. */
  sentAt: string;
  /** Whether the last send also carried a photograph that was stored. */
  photo: boolean;
};

/** The snapshot React holds while prerendering, and its identity must not move. */
const NONE = null;

let cached: SentEntry | null | undefined;
const listeners = new Set<() => void>();

function text(value: unknown) {
  return typeof value === 'string' ? value : '';
}

/**
 * Every access is guarded. Private windows, and browsers set to block site
 * data, throw on the accessor itself — and a reader in one of them must still
 * be able to answer, they are simply not reminded of it afterwards.
 */
function entry(): SentEntry | null {
  if (cached !== undefined) return cached;
  let stored: Partial<SentEntry> | null = null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    stored = raw ? (JSON.parse(raw) as Partial<SentEntry>) : null;
  } catch {
    stored = null;
  }
  cached = stored && typeof stored.email === 'string' && stored.email
    ? {
        name: text(stored.name),
        organization: text(stored.organization),
        jobTitle: text(stored.jobTitle),
        regions: text(stored.regions),
        team: text(stored.team),
        role: text(stored.role),
        expertise: Array.isArray(stored.expertise)
          ? stored.expertise.filter((id) => typeof id === 'string')
          : [],
        expertiseOther: text(stored.expertiseOther),
        email: stored.email,
        consent: text(stored.consent),
        sentAt: text(stored.sentAt),
        photo: stored.photo === true,
      }
    : null;
  return cached;
}

/** Records an accepted entry. The snapshot is replaced rather than mutated. */
export function rememberEntry(sent: SentEntry) {
  cached = sent;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(sent));
  } catch {
    /* Nothing to do: the entry is already recorded on the organiser's sheet. */
  }
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Null while prerendering and hydrating, then the truth from this browser. */
export function useSentEntry() {
  return useSyncExternalStore(subscribe, entry, () => NONE);
}
