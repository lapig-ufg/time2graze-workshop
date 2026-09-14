'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { Pencil } from 'lucide-react';
import { RECAPS } from '@/data/recaps';
import type { Day } from '@/data/types';
import type { Clock } from '@/lib/now';
import { formatRecapStamp } from '@/lib/recap';
import { recapDocument } from '@/lib/recap-document';
import { loadRecaps, recapLiveEnabled, type RecapsState, type StoredRecap } from '@/lib/recap-live';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

const DocumentEditor = dynamic(() => import('./recap-editor'), { ssr: false, loading: () => <p className="recap-pending">Opening editor…</p> });
let shared: Promise<RecapsState | null> | null = null;
export function recaps() {
  shared ??= recapLiveEnabled ? loadRecaps() : Promise.resolve(null);
  return shared;
}
export function useLiveRecap(dayIndex: number): StoredRecap | null {
  const [state, setState] = useState<RecapsState | null>(null);
  useEffect(() => { let active = true; void recaps().then(s => { if (active) setState(s); }); return () => { active = false; }; }, []);
  return state?.recaps[dayIndex] ?? null;
}

export function DayRecap({ day }: { day: Day; clock: Clock | null }) {
  const [live, setLive] = useState<RecapsState | null>(null);
  const [loading, setLoading] = useState(recapLiveEnabled);
  const [editing, setEditing] = useState(false);
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  useEffect(() => {
    let active = true;
    async function refresh() {
      const state = await loadRecaps();
      if (!active) return;
      if (state) { shared = Promise.resolve(state); setLive(state); }
      setLoading(false);
    }
    if (recapLiveEnabled) void refresh();
    const timer = setInterval(() => { if (!document.hidden && !editing && recapLiveEnabled) void refresh(); }, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [day.index, editing]);
  const stored = live?.recaps[day.index] ?? null;
  const recap = stored?.recap ?? RECAPS[day.index] ?? null;
  const html = hydrated ? recapDocument(recap) : '';
  return <section className="recap" aria-labelledby={`recap-day-${day.index}`}>
    <div className="recap-head">
      <h3 id={`recap-day-${day.index}`}>Day {day.index} summary</h3>
      <p className="recap-stamp">{loading ? 'Loading summary…' : recap ? `${recap.revised ? 'Updated' : 'Published'} ${formatRecapStamp(recap.revised ?? recap.published)}` : 'To be published'}</p>
      {live?.editable && !editing && <button className="recap-edit-toggle" onClick={() => setEditing(true)}><Pencil aria-hidden="true" />{recap ? 'Edit summary' : 'Add summary'}</button>}
    </div>
    {editing ? <DocumentEditor day={day.index} stored={stored} initial={html} onClose={() => setEditing(false)} onSaved={next => {
      const state = { editable: true, recaps: { ...live?.recaps, [day.index]: next } };
      shared = Promise.resolve(state); setLive(state); setEditing(false);
    }} /> : recap ? <div className="recap-document" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="recap-pending">The day’s summary has not been published yet.</p>}
    {!loading && !live && recapLiveEnabled && <output className="recap-pending">Could not connect to the summaries. <button onClick={() => window.location.reload()}>Try again</button></output>}
  </section>;
}
