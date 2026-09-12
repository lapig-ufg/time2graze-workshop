import Image from 'next/image';
import Link from 'next/link';
import { Expand, Map as MapIcon } from 'lucide-react';
import { FARM_MAP } from '@/data/field-visit';
import { withBasePath } from '@/lib/base-path';
import { timeLabel } from '@/lib/schedule';

/**
 * Friday morning's farm, inside the Friday block because the farm is in
 * Cidade de Goiás and the same coach takes people to both.
 *
 * The preview is a link to the full sheet rather than a lightbox: a phone
 * opens the WebP in its own viewer, where pinch-zoom reaches the paddock
 * numbers, and the page ships no script for it. The list of maps is the
 * text source, as the numbered legend is for the orientation plates.
 */
export function FarmMap() {
  const { name, session, full, preview, alt, maps, facts } = FARM_MAP;
  const fullHref = withBasePath(full.src);

  return (
    <section
      className="farm-map"
      id="fazenda-buriti-queimado"
      aria-labelledby="fazenda-buriti-queimado-title"
    >
      <figure className="farm-map-sheet">
        <a href={fullHref} target="_blank" rel="noreferrer">
          <Image
            src={withBasePath(preview.src)}
            alt={alt}
            width={preview.width}
            height={preview.height}
            sizes="(max-width: 900px) 100vw, 40vw"
            loading="lazy"
          />
          <span className="farm-map-zoom" aria-hidden="true">
            <Expand />
          </span>
        </a>
        <figcaption>Map sheet · LAPIG/UFG, 11 September 2026</figcaption>
      </figure>

      <div className="farm-map-body">
        <p className="travel-eyebrow">
          <MapIcon aria-hidden="true" />
          Friday · {timeLabel(session)}
        </p>
        <h4 id="fazenda-buriti-queimado-title">{name}</h4>
        <p className="farm-map-context">
          {session.title} ·{' '}
          <Link href={`/programme/#${session.id}`}>View session</Link>
        </p>

        <a
          className="farm-map-open"
          href={fullHref}
          target="_blank"
          rel="noreferrer"
        >
          <Expand aria-hidden="true" />
          <span>
            Open full-size map
            <small>
              {full.format} · {full.width} × {full.height} px · {full.size}
            </small>
          </span>
        </a>

        <h5>On the sheet</h5>
        <ol className="farm-map-list">
          {maps.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>

        <dl className="farm-map-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
