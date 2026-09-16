'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { RecapReader } from './recap-reader';
import { AGENDA } from '@/data/agenda';
import { RECAPS } from '@/data/recaps';
import type { Day, DayRecap as Recap } from '@/data/types';
import type { Clock } from '@/lib/now';
import { formatRecapStamp } from '@/lib/recap';
import { googleDocHtml } from '@/lib/recap-doc';
import { recapDocument } from '@/lib/recap-document';
import { loadRecaps, recapLiveEnabled, type RecapsState } from '@/lib/recap-live';

let shared: Promise<RecapsState | null> | null = null;
export function recaps() {
  shared ??= recapLiveEnabled ? loadRecaps() : Promise.resolve(null);
  return shared;
}

/**
 * What a day's summary block shows. A day with a Google Doc is that doc and
 * nothing else — an empty doc is "to be published", never an older stored
 * recap. Only a day without a doc falls back to the stored or repository one.
 * Client only: the doc is converted with `DOMParser`.
 */
function summaryFor(state: RecapsState | null, dayIndex: number) {
  const doc = state?.docs[dayIndex];
  if (doc) return { doc, html: doc.html ? googleDocHtml(doc.html) : '', recap: null };
  const recap: Recap | null = state?.recaps[dayIndex]?.recap ?? RECAPS[dayIndex] ?? null;
  return { doc: null, html: recapDocument(recap), recap };
}

/**
 * The days whose summary has text, in programme order, or null until the
 * endpoint has answered. One shared fetch feeds the home page's band and
 * record, and the programme's summary links.
 */
export function usePublishedRecapDays(): number[] | null {
  const [state, setState] = useState<RecapsState | null | undefined>(undefined);
  useEffect(() => { let active = true; void recaps().then(s => { if (active) setState(s); }); return () => { active = false; }; }, []);
  return useMemo(() => state === undefined ? null
    : AGENDA.map(day => day.index).filter(index => summaryFor(state, index).html !== ''), [state]);
}

export function DayRecap({ day }: { day: Day; clock: Clock | null }) {
  const [live, setLive] = useState<RecapsState | null>(null);
  const [loading, setLoading] = useState(recapLiveEnabled);
  useEffect(() => {
    let active = true;
    async function refresh() {
      const state = await loadRecaps();
      if (!active) return;
      if (state) { shared = Promise.resolve(state); setLive(state); }
      setLoading(false);
    }
    if (recapLiveEnabled) void refresh();
    const timer = setInterval(() => { if (!document.hidden && recapLiveEnabled) void refresh(); }, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [day.index]);
  // Nothing renders from the endpoint before it answers, so the server render
  // and the first client render agree.
  const { doc, html, recap } = loading ? { doc: null, html: '', recap: null } : summaryFor(live, day.index);
  const unavailable = !loading && (doc?.html === null || (!live && recapLiveEnabled));
  const stamp = loading ? 'Loading summary…'
    : unavailable ? 'Summary unavailable'
    : !html ? 'To be published'
    : recap ? `${recap.revised ? 'Updated' : 'Published'} ${formatRecapStamp(recap.revised ?? recap.published)}`
    : null;
  return <section className="recap" aria-labelledby={`recap-day-${day.index}`}>
    <div className="recap-head">
      <h3 id={`recap-day-${day.index}`}>Day {day.index} summary</h3>
      {stamp && <p className="recap-stamp">{stamp}</p>}
      {doc && <a className="recap-edit-toggle" href={doc.url} target="_blank" rel="noopener"><ExternalLink aria-hidden="true" />Comment or suggest edits</a>}
    </div>
    {html ? <RecapReader day={day.index} exported={doc?.html} html={html} />
      : !loading && !unavailable && <p className="recap-pending">The day’s summary has not been published yet.</p>}
    {unavailable && <output className="recap-pending">Could not load the summary. <button onClick={() => window.location.reload()}>Try again</button></output>}
  </section>;
}
