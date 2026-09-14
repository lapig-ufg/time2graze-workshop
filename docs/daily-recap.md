# Daily summaries

Each day's summary is a Google Doc. `/programme/` shows it under that day's schedule, with a **Comment or suggest edits** link. The Doc is the official text, and the site only displays it.

| Day | Google Doc |
| --- | --- |
| 1 · 14 Sep | https://docs.google.com/document/d/10YecIt3hD6TBvapNhHzjsGllC69Bz7qwV1qP7H4WIpI/edit |
| 2 · 15 Sep | https://docs.google.com/document/d/1yzRITg8PNnSumo4J3kkgTCYVK3nJUy6fTHsylM0TWVs/edit |
| 3 · 16 Sep | https://docs.google.com/document/d/1HmwB2trPUC0QzKwrVmvwhY3Coyxm_AstbaXGcqrHXXg/edit |
| 4 · 17 Sep | https://docs.google.com/document/d/1LF9-MYGmMKYGlKtnc7iskXlTQdeKoyRlANZj_4FuUCk/edit |
| 5 · 18 Sep | https://docs.google.com/document/d/1FYNJXrWtpiubmHy8vrCkWUkMB6XXE8bcPmd2XQwRdiA/edit |

The docs are owned by victoramaral.lapig@gmail.com.

## Setup (once per doc)

Each doc is shared **Anyone with the link → Commenter**. That was set on 14 September 2026. The site and the repository are public, so the link must not grant edit access. Anyone signed in to Google can comment or suggest edits, and only named editors can accept them. Add the people who write the summaries as editors by email, and turn off "Editors can change permissions and share".

The site reads each doc anonymously, as any visitor with the link would. That works at Commenter or Viewer access, provided "Viewers and commenters can download" stays on. A doc without link access shows as "To be published". The site shows only accepted text: suggestions and comments do not appear there.

## Procedure

1. Paste or write the summary into the day's doc below its first line, "Day N summary — …". The site omits that first line because the block already has that heading.
2. The group reads the doc and comments or suggests edits. Editors accept the suggestions.
3. The site updates on its own. Exports are cached for one minute, and open pages check again every 30 seconds, so a change appears within about 90 seconds.

A doc that has only its first line counts as unpublished. The site keeps headings, paragraphs, bold, italic, underline, lists and links. Images, tables, colours, comments and footnotes are left out.

## Implementation

`apps-script/recap-docs.gs` lists the doc IDs in `RECAP_DOCS`. For each doc it fetches `…/export?format=html` anonymously, caches the result for 60 seconds in `CacheService`, and returns `docs: { [day]: { url, html } }` from `?action=recaps`. A doc it cannot read comes back as `html: null`. No new OAuth scope is needed, because `script.external_request` was already granted. `lib/recap-doc.ts` converts the export in the browser. It resolves Docs' class and inline styles into `strong`/`em`/`u`, removes the `google.com/url` redirect from links, and passes the result to the shared sanitizer in `lib/recap-document.ts`.

A day listed in `RECAP_DOCS` shows only its doc. Recaps stored by the earlier password editor are still returned, and a day appears as a stored recap only if it has no doc. The password editor has been removed from the site. Its POST endpoint is still in the script but nothing calls it.

To change a doc, edit `RECAP_DOCS`, then run `clasp push` from `apps-script/` and `clasp deploy -i AKfycbzpmYFJq7WFRxtnGHGZkW0FFhiit9441UHtfZnwfrNZI6Vuku1MY6Rb7JBBIcFwGcBi -d "…"`. The endpoint URL does not change.
