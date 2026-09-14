/**
 * The daily summaries as Google Docs.
 *
 * Each day's summary is one Google Doc, shared "Anyone with the link →
 * Editor", so the group reads and corrects it together in Docs. The site
 * only displays it: this endpoint exports each doc as HTML and the browser
 * reduces that HTML to the site's own typography (`lib/recap-doc.ts`).
 *
 * The export is fetched anonymously, the way any participant with the link
 * would open it. That needs no scope beyond `script.external_request`, and it
 * means a doc whose link sharing is off reads as unavailable rather than
 * leaking through the owner's account.
 *
 * Readers poll every 30 seconds, so exports are cached for a minute: five
 * fetches a minute in total, however many people have the page open.
 */

const RECAP_DOCS = {
  1: '10YecIt3hD6TBvapNhHzjsGllC69Bz7qwV1qP7H4WIpI',
  2: '1yzRITg8PNnSumo4J3kkgTCYVK3nJUy6fTHsylM0TWVs',
  3: '1HmwB2trPUC0QzKwrVmvwhY3Coyxm_AstbaXGcqrHXXg',
  4: '1LF9-MYGmMKYGlKtnc7iskXlTQdeKoyRlANZj_4FuUCk',
  5: '1FYNJXrWtpiubmHy8vrCkWUkMB6XXE8bcPmd2XQwRdiA',
};
const RECAP_DOC_CACHE_SECONDS = 60;
/** CacheService refuses values above 100 kB; larger exports are simply not cached. */
const RECAP_DOC_CACHE_MAX = 95000;
const RECAP_DOC_MAX = 500000;

function recapDocCacheKey(day) {
  return `RECAP_DOC_${day}`;
}

/**
 * The HTML of one export response, or null when the doc is not readable
 * anonymously (a redirect to sign-in) or the answer is not an export.
 */
function recapDocHtml(response) {
  if (response.getResponseCode() !== 200) return null;
  const html = response.getContentText('UTF-8');
  if (html.length > RECAP_DOC_MAX || !/<body[\s>]/i.test(html)) return null;
  if (/accounts\.google\.com/i.test(html) && !/doc-content/.test(html)) return null;
  return html;
}

/**
 * `{ [day]: { url, html } }` for every configured day. `html` is null while
 * a doc cannot be read; `url` is always the doc's edit link.
 */
function readRecapDocs() {
  const cache = CacheService.getScriptCache();
  const days = Object.keys(RECAP_DOCS);
  const cached = cache.getAll(days.map(recapDocCacheKey));
  const missing = days.filter((day) => !(recapDocCacheKey(day) in cached));

  const fresh = {};
  if (missing.length) {
    const responses = UrlFetchApp.fetchAll(
      missing.map((day) => ({
        url: `https://docs.google.com/document/d/${RECAP_DOCS[day]}/export?format=html`,
        muteHttpExceptions: true,
        followRedirects: false,
      })),
    );
    responses.forEach((response, i) => {
      const day = missing[i];
      const html = recapDocHtml(response);
      // An unreadable doc is cached as '' so a sharing mistake does not turn
      // every poll into five failing fetches.
      fresh[day] = html || '';
      if (fresh[day].length <= RECAP_DOC_CACHE_MAX) {
        try {
          cache.put(recapDocCacheKey(day), fresh[day], RECAP_DOC_CACHE_SECONDS);
        } catch (err) {
          console.log('recap doc day %s not cached: %s', day, err);
        }
      }
    });
  }

  const docs = {};
  for (const day of days) {
    const key = recapDocCacheKey(day);
    const html = key in cached ? cached[key] : fresh[day];
    docs[day] = {
      url: `https://docs.google.com/document/d/${RECAP_DOCS[day]}/edit`,
      html: html || null,
    };
  }
  return docs;
}
