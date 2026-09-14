'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { googleDocTopics } from '@/lib/recap-doc';

/** Open sections survive background document refreshes. */
export function RecapReader({ exported, html }: { exported?: string | null; html: string }) {
  const content = useMemo(() => exported ? googleDocTopics(exported) : { introduction: html, topics: [] }, [exported, html]);
  const [opened, setOpened] = useState<Record<string, boolean>>({});
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
    {content.topics.map(topic => <section className="recap-topic" key={topic.key}>
      <h4><button type="button" aria-expanded={Boolean(opened[topic.key])} onClick={() => setOpened(previous => ({ ...previous, [topic.key]: !previous[topic.key] }))}>
        <span>{topic.title}</span><ChevronDown aria-hidden="true" />
      </button></h4>
      <div hidden={!opened[topic.key]} className="recap-document" dangerouslySetInnerHTML={{ __html: topic.html }} />
    </section>)}
  </div>;
}
