# Publishing a daily recap

The record of each workshop day, on `/programme/`, published the same evening
and corrected afterwards from what participants flag.

This is the only document the nightly work needs. Read the loop once before
Day 1; after that, [Each day](#each-day) is the whole procedure.

---

## The loop

1. Every session is recorded, one audio file per session, uploaded to the
   NotebookLM notebook **as the session ends** — not in a batch at 17:00.
2. Two note-takers write during the day, on paper or in a document. Photographs
   of their notes go into the same notebook.
3. Before the day's summary session, NotebookLM produces the draft from those
   sources. That draft is what runs the session in the room.
4. The room corrects it out loud. **That corrected version is what gets
   published**, after the session — not the draft that went in.
5. It goes on the site the same evening. Readers flag lines they think are
   wrong; those land in a private spreadsheet.
6. The next morning, before 08:30, the flagged lines are fixed and the recap is
   republished with `revised` set.

A day's recap therefore *settles* on the following morning. Say so in the room
on Day 1, or the first correction will read like a failure.

## The shape of the week

| Day | Summary session | Notes |
| --- | --- | --- |
| 1 · Mon 14 Sep | none | Ends in the Welcome Dinner. Publish during or after it. |
| 2 · Tue 15 Sep | 17:30–18:00 | The 16:00 session runs to 17:30 — no gap. |
| 3 · Wed 16 Sep | 17:30–18:00 | Same. Seven country presentations to cover. |
| 4 · Thu 17 Sep | 17:30–18:00 Wrap-up (Laerte) | The wrap-up slides and this recap are the same content. Do not write it twice. |
| 5 · Fri 18 Sep | none | Field visit. Audio outdoors will be poor — expect to work from notes. |

Because Days 2 and 3 have **no gap** before the summary session, the automatic
draft realistically covers the day up to the coffee break. The last block is
added by the note-takers, by hand, in the room.

---

## Once, before Day 1

**The endpoint is live.** Pushed, authorised and redeployed on 9 September
2026: deployment `AKfycbzpmYFJq7…` at version 2, same `/exec` URL as before, so
[`lib/apps-script.ts`](../lib/apps-script.ts) was not touched. A test flag was
sent through it and the row arrived. Calendar sync was unaffected — 44 events,
nothing changed.

The corrections spreadsheet is **not linked from this file**: the repository is
public, and there is no reason to publish the id of a private document. Run
`flagSheetUrl()` from the Apps Script editor to get its address, and bookmark
it on your phone.

Still to do:

- [ ] Delete the test row from the spreadsheet (row 2, "TEST ROW - delete me").
- [ ] Dry-run NotebookLM with a real 60-minute recording and a photograph of
      handwritten notes, and check two things specifically: that it accepts the
      photograph as a source at all, and that it reads the handwriting. If it
      does not, transcribe the photographs in the Gemini app first and paste
      the text in as a source instead. **Find this out now, not on Day 1.**
- [ ] Announce the recording on Day 1, before the first session.

### If the script ever has to be redeployed

Three steps, and the middle one is the only part a person has to do by hand.
**Do them in this order** — deploying before authorising takes calendar
sharing down with it.

1. **Push the source.** From `apps-script/`: `clasp push --force`. `--force` is
   needed whenever the manifest changed, and it is safe: the live endpoint
   serves a frozen version, so pushing does not change what participants reach.
2. **Authorise, in the browser.** Open the script editor and run `setup()`.
   Google shows a consent screen for any new scope, because the web app
   executes as you. Nothing else can grant that.
3. **Redeploy the deployment the site already points at**, keeping its URL:

       clasp deploy -i AKfycbzpmYFJq7WFRxtnGHGZkW0FFhiit9441UHtfZnwfrNZI6Vuku1MY6Rb7JBBIcFwGcBi -d "<what changed>"

   `-i` redeploys an existing deployment rather than minting a new one, so the
   `/exec` URL does not change. Only create a *new* deployment if you want a
   new URL — and then `APPS_SCRIPT_ENDPOINT` has to be updated in the same
   commit, because calendar sharing reads it too.

## Each day

### Capturing

- **One file per session**, named with the session id from
  [`data/agenda.ts`](../data/agenda.ts): `d3-country-uganda.m4a`. That name is
  what makes the recap map onto the programme.
- **Upload after each session.** Eight hours of audio over campus wi-fi at
  17:00 is the most likely way this fails.
- **Two recorders** for the split sessions — Day 1 10:00–12:00 (Visual
  Inspection / GEE course) and Day 4 14:00–15:30 (DST / Methane). Both tracks
  have their own id.
- **The two note-takers divide by function, not by narrative**: one takes
  decisions and actions with the name of the person who owns each; the other
  takes questions and disagreements. A decision and its owner are exactly what
  a recording cannot give you, and the only part of the recap nobody else can
  reconstruct.

### Producing the draft

In NotebookLM, with the day's sources selected and nothing from other days,
paste **that day's prompt**. It is on `/programme/`, under the day's summary:
open *NotebookLM prompt for Day N* and press **Copy prompt**.

There is one prompt per day, because each day asks for different things — the
country presentations on Day 3 all use the same headings so they can be
compared, Day 4's roadmap separates what was agreed from what was only
proposed, Day 5 works from notes because the audio is outdoors. The session
list in each prompt is read from `data/agenda.ts`, so it never names a session
by an old title.

**Every prompt asks for content, not speakers.** A room recording cannot say
reliably who said a sentence, and a model asked to will guess. The prompt names
presenters only from the agenda, attributes content to institutions and
countries where it belongs to them, and takes action owners only from what the
note-takers wrote — `[Owner not recorded]` otherwise. That is why the
note-takers' split below matters.

**Editing a prompt.** Press **Edit** on the page, change the text, type the
edit password and **Save for everyone**. The change is live at once, for
everyone, with no commit: the edited text is kept by the Apps Script
(`apps-script/prompts.gs`), and the site shows the original from
`data/recap-prompts.ts` only when no edit exists or the script cannot be
reached. **Restore original** and save puts a day back on the repository
version. If two people edit the same day, the second save is refused and shows
the first person's text rather than overwriting it.

The password is the script property `PROMPT_EDIT_PASSWORD`, set in the Apps
Script editor under *Project Settings → Script properties*. It is never written
into this repository, which is public. With no password set, the Edit button
does not appear. After 40 wrong passwords in a day, editing locks until the
next day. Editing closes after 21 September 2026, with the corrections.

Read the result. It is a draft, not a record.

### In the room

Run the summary session from the draft. Mark the corrections people call out.

### Publishing

Paste the corrected text into Claude Code with one sentence:

> Publish the Day 3 recap. Here is the corrected text: …

It converts the text to [`data/recaps.ts`](../data/recaps.ts), runs
`node --test scripts/recap.test.mjs`, and commits. GitHub Actions republishes in
about two minutes.

The conversion rules are in [The contract](#the-contract) below, and they are
not negotiable per day — the ids depend on them.

### The next morning

Open the corrections spreadsheet. For each row that is not yet marked
**Applied**:

- Read the item id (`d3-r7`) and find that line in `data/recaps.ts`.
- Check it against the audio. The reader may be wrong; the recording decides.
- Fix the text **in place, keeping the id**.
- Mark the row Applied.

Then bump the recap's header:

```ts
published: '2026-09-16T18:12',
revised: '2026-09-17T07:50',
corrections: 3,
```

`corrections` counts the reader-raised points the revision resolved, not the
number of edits. It is rendered, so it has to be true.

Push. Readers see `Revised 17 September, 07:50 · 3 reader corrections applied`
under the summary — which is the only reason anyone flags a second line.

---

## The contract

What converting the text into `data/recaps.ts` must always do.

**One entry per day, keyed by day index**, in `RECAPS`. Never write an entry
for a day that has not been held.

**Every flaggable line is a `RecapItem` with an id of the form `d<day>-r<n>`.**

- Unique within its day, and its day number must match the entry it sits in.
- **Serial numbers only ever grow, and are never reused.** A revision that
  deletes a line retires its number; a revision that adds one takes the next
  number after the highest ever used that day. Renumbering the lines around an
  edit silently redirects every flag already raised against them.
- A corrected line **keeps its id**. That is the whole point of the id.

**Sections.** One per session, in the order the sessions were held, carrying
`sessionId` — the id from `data/agenda.ts`, which may be a track id. A block
about the day as a whole carries `title` instead (`'Across the day'`). One or
the other, never neither.

**Fields.** `summary` is the one-paragraph "what happened". `decisions`,
`questions` and `actions` are lists. Every action carries an `owner`. Omit an
empty field rather than writing an empty array.

**Stamps** are `YYYY-MM-DDTHH:MM` in Goiânia time, no timezone suffix —
the site formats them without touching a timezone, on purpose. `published` is
the first publication and never changes afterwards. `revised` is the latest
revision.

**English**, and the register of the rest of the site: institutional, factual,
no promotional phrasing. Names as the agenda writes them.

**Never invent.** If the corrected text is silent on a session, that session
gets no block. A thin recap is honest; a padded one is not.

`scripts/recap.test.mjs` enforces the id format, uniqueness, the day match, the
session references, action owners and the stamp ordering. Run it before
committing. It will not catch a wrong fact — only you and the room can.

---

## When something breaks

**A flag arrives for an id that no longer exists.** Someone renumbered. Find
the line the reader meant from the note text, fix it, and stop renumbering.

**The corrections sheet is empty and you expected rows.** Either the
deployment was never updated — the site is posting to a version that has no
`flag` action and answers "Unknown action" — or someone created a *new*
deployment instead of redeploying the existing one, and
`APPS_SCRIPT_ENDPOINT` now points at the old URL.

**Calendar sharing stopped working right after the deploy.** The new version
was deployed before `setup()` was run, so the web app is asking for scopes you
have not granted and every action fails, not just flagging. Run `setup()` in
the editor and accept the consent screen.

**A reader reports the flag button does nothing.** After 21 September the
window is closed by design, in both the site and the script.

**The build fails after a recap edit.** Almost always the test: a duplicated id
or a `sessionId` that does not exist. Read the assertion message; it names the
id.

**There is no time to publish tonight.** Publish tomorrow with the real
`published` stamp. A late recap is fine. A recap stamped with a time it did not
go up is not.
