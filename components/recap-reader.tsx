'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ASK_HIGHLIGHT_SESSION } from '@/lib/deep-link';
import { recapTopicIds } from '@/lib/recap-corpus';
import { googleDocTopics } from '@/lib/recap-doc';

/**
 * Opens, scrolls to and (when Ask sent the reader) highlights the topic a
 * `#recap-d1-…` link names. The summary arrives after the page, so this runs
 * whenever the topics change as well as on every hash change, and only once
 * per arrival: a background refresh must not scroll the reader back.
 */
function useTopicFromHash(ids: string[], open: (index: number) => void) {
  const handled = useRef('');
  useEffect(() => {
    function reveal() {
      const hash = decodeURIComponent(location.hash.slice(1));
      const index = ids.indexOf(hash);
      if (index < 0 || handled.current === hash) return;
      handled.current = hash;
      open(index);

      let highlight = false;
      try {
        highlight = sessionStorage.getItem(ASK_HIGHLIGHT_SESSION) === hash;
        if (highlight) sessionStorage.removeItem(ASK_HIGHLIGHT_SESSION);
      } catch { /* Optional browser storage. */ }

      // A timer, not an animation frame: frames do not run in a hidden tab, and
      // the reader may switch back to it after the answer.
      const land = () => window.setTimeout(() => {
        const target = document.getElementById(hash);
        if (!target) return;
        target.scrollIntoView({ block: 'start' });
        if (!highlight) return;
        target.classList.remove('recap-topic-focus');
        // Restart the cue when a reader opens the same source twice.
        void target.getBoundingClientRect();
        target.classList.add('recap-topic-focus');
        window.setTimeout(() => target.classList.remove('recap-topic-focus'), 4200);
      }, 50);
      // Scrolling before load misses: the images above still shift the page.
      if (document.readyState === 'complete') land();
      else addEventListener('load', land, { once: true });
    }
    reveal();
    const again = () => { handled.current = ''; reveal(); };
    addEventListener('hashchange', again);
    return () => removeEventListener('hashchange', again);
  }, [ids, open]);
}

/** Open sections survive background document refreshes. */
export function RecapReader({ day, exported, html }: { day: number; exported?: string | null; html: string }) {
  const content = useMemo(() => exported ? googleDocTopics(exported) : { introduction: html, topics: [] }, [exported, html]);
  const ids = useMemo(() => recapTopicIds(day, content.topics.map(topic => topic.title)), [day, content]);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const openTopic = useMemo(() => (index: number) => {
    const key = content.topics[index]?.key;
    if (key) setOpened(previous => ({ ...previous, [key]: true }));
  }, [content]);
  useTopicFromHash(ids, openTopic);
  if (!content.topics.length) return <div className="recap-document" dangerouslySetInnerHTML={{ __html: html }} />;
  function setAll(open: boolean) {
    setOpened(Object.fromEntries(content.topics.map(topic => [topic.key, open])));
  }
  return <div className="recap-reader">
    {content.introduction && <div className="recap-document" dangerouslySetInnerHTML={{ __html: content.introduction }} />}
    <div className="recap-reader-tools">
      <span>{content.topics.length} {content.topics.length === 1 ? 'topic' : 'topics'}</span>
      <button type="button" onClick={() => setAll(true)}>Expand all</button>
      <button type="button" onClick={() => setAll(false)}>Collapse all</button>
    </div>
    {content.topics.map((topic, index) => <section className="recap-topic" id={ids[index]} key={topic.key}>
      <h4><button type="button" aria-expanded={Boolean(opened[topic.key])} onClick={() => setOpened(previous => ({ ...previous, [topic.key]: !previous[topic.key] }))}>
        <span>{topic.title}</span><ChevronDown aria-hidden="true" />
      </button></h4>
      <div hidden={!opened[topic.key]} className="recap-document" dangerouslySetInnerHTML={{ __html: topic.html }} />
    </section>)}
  </div>;
}
