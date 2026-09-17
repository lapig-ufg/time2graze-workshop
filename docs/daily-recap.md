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

A doc that has only its first line counts as unpublished. The site keeps headings, paragraphs, bold, italic, underline, lists, links and tables. Images, colours, comments and footnotes are left out. A table keeps its columns and scrolls inside its own frame on a narrow screen; the assistant reads it as one line with ` · ` between cells.

## Implementation

`apps-script/recap-docs.gs` lists the doc IDs in `RECAP_DOCS`. For each doc it fetches `…/export?format=html` anonymously, caches the result for 60 seconds in `CacheService`, and returns `docs: { [day]: { url, html } }` from `?action=recaps`. A doc it cannot read comes back as `html: null`. No new OAuth scope is needed, because `script.external_request` was already granted. `lib/recap-doc.ts` converts the export in the browser. It resolves Docs' class and inline styles into `strong`/`em`/`u`, removes the `google.com/url` redirect from links, and passes the result to the shared sanitizer in `lib/recap-document.ts`.

A day listed in `RECAP_DOCS` shows only its doc. Recaps stored by the earlier password editor are still returned, and a day appears as a stored recap only if it has no doc. The password editor has been removed from the site. Its POST endpoint is still in the script but nothing calls it.

To change a doc, edit `RECAP_DOCS`, then run `clasp push` from `apps-script/` and `clasp deploy -i AKfycbzpmYFJq7WFRxtnGHGZkW0FFhiit9441UHtfZnwfrNZI6Vuku1MY6Rb7JBBIcFwGcBi -d "…"`. The endpoint URL does not change.

## Navigating a long summary

The site's summary starts as a compact list of expandable topics. Each main heading in the Google Doc becomes a topic; lower-level headings remain inside it. Use heading styles in Docs (for example, Heading 2 for activities and Heading 3 for their subsections). The existing Day 1 document already follows this structure. The site does not guess which agenda item a paragraph belongs to.

Readers can open individual topics or use **Expand all** / **Collapse all**. Background refreshes preserve open topics when their Google Docs heading IDs remain unchanged. Text before the first heading remains visible, and documents without headings remain a continuous document.

## The assistant

The Ask assistant uses the summaries in full. The worker (`worker/src/index.js`, `RECAPS_URL`) and the panel (`lib/assistant.ts`) both read `?action=recaps` and add entries with `lib/recap-corpus.ts`. There is one entry per top-level heading, with an id such as `recap-d1-visual-inspection-workshop-ana-paula-lapig`, plus one for any text before the first heading. Both sides build the ids with that same module, so every source the model cites resolves in the panel. The summaries are cached for 60 seconds, the site does not need redeploying, and accepted edits reach the assistant within about a minute and a half.

Each summary adds its full text to every question's prompt. Five days of summaries at Day 1's length add about 17,000 input tokens per question, roughly 2.5 times the corpus alone. The worker's `DAILY_LIMIT` bounds that. If usage becomes a problem, send only the summary sections that match the question.

Each topic on the programme has an anchor built by `recapTopicIds` in `lib/recap-corpus.ts`, for example `#recap-d1-interactive-session-field-protocol-alignment-nat`. An assistant source links to that anchor. The programme opens the day, expands the topic and scrolls to it. When the reader arrived from Ask, the topic is also briefly highlighted. Topic anchors come from the Doc's headings, so renaming a heading changes its link.
