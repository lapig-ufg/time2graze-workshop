import { CITY_STORIES } from '@/data/city-guide';
import { FreeTimeMap } from '@/components/free-time-map';

/**
 * Part two of Travel & stay: the city itself, for the hours the programme
 * does not claim. Cidade de Goiás is not repeated here — it is a Friday
 * workshop destination and lives in part one, with its own history.
 */
export function Orientation() {
  const city = CITY_STORIES.goiania;
  return (
    <section
      className="travel-part city-guide"
      id="orientation"
      aria-labelledby="goiania-title"
    >
      <div className="city-introduction">
        <header className="city-introduction-heading">
          <h2 className="travel-part-title" id="goiania-title">
            Goiânia
          </h2>
          <p className="city-introduction-label">History &amp; free time</p>
        </header>
        <div className="city-prose">
          <h3>{city.subtitle}</h3>
          {city.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <a
            className="city-source"
            href={city.source.href}
            target="_blank"
            rel="noreferrer"
          >
            {city.source.label}
          </a>
        </div>
      </div>

      <section
        className="city-free-time"
        id="recommendations"
        aria-labelledby="free-time-title"
      >
        <header className="city-free-time-heading">
          <h3 id="free-time-title">Free time in Goiânia</h3>
          <p>
            Cafés, parks, culture and shopping. Check opening hours with each
            place before setting out.
          </p>
        </header>
        <FreeTimeMap />
      </section>
    </section>
  );
}
