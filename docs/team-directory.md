# The team directory form

The Time2Graze project is collecting an internal directory of who is on the
project and what each person works on. The questions come from the organiser's
specification (`TIME2GRAZE TEAM DIRECTORY`, 15 September 2026) and are
reproduced on the site word for word.

The form is at **`/team-directory/`** — on Pages,
`https://lapig-ufg.github.io/time2graze-workshop/team-directory/`. The home
page has a card for it at `/#team-directory`, and the assistant knows where it
is. It is not in the navigation. It was unlisted for its first hours so the
link could be shared and checked before it was announced; that address is
kept so those links still work.

## Deploying the script

The endpoint that stores the answers lives in the Apps Script project, and
only its owner can deploy it. It was deployed on 15 September 2026 (version 13
of the existing deployment) and checked live: a first entry, a correction from
the same address, a refused option and a photograph stored in Drive.

After any change under `apps-script/`:

```
cd apps-script
clasp push
clasp deploy -i <deploymentId>          # the existing deployment, never a new one
```

`clasp deploy` on its own mints a new `/exec` URL and quietly leaves the site
talking to the old version. `-i` keeps the URL that `lib/apps-script.ts`
already holds, so nothing in the site has to change.

The spreadsheet and the photo folder are created by the first entry that
arrives; `directorySetup`, run from the editor, does the same on demand and
logs the address of both.

### The Drive scope is required

`DriveApp` is refused under `drive.file` alone — the first live test stored the
row and answered `photo: failed`. The manifest therefore carries the full
`https://www.googleapis.com/auth/drive` scope as well. A scope added to the
manifest is not granted by deploying it: the web app runs as its owner, so
**until the owner runs a function in the editor and accepts the new consent,
every request to the web app fails** — calendar sharing, recaps and split
sessions included. Push, deploy and accept in one sitting.

The sheet is **Time2Graze team directory**, private to the account running the
script. The photographs go to a Drive folder called **Time2Graze team directory
photos**, and the sheet's last-but-one column carries each file's link.

### Check it from the live site

Open `/team-directory/`, fill the form in with your own details and send it.
You should see "Sent. Your entry is with the Time2Graze organisers." and a row
in the sheet within a second or two. Send it again with a changed job title
from the same address: the answer becomes "Updated" and the row is rewritten
rather than a second one appearing.

### If a photograph does not arrive

The participant is told "Your photo could not be stored" and the rest of the
entry is on the sheet regardless. If it happens to everyone rather than to one
person, look first at the scope above: whether `appsscript.json` still carries
`auth/drive`, and whether the owner has accepted it since it was last pushed.

## What the sheet holds

One row per e-mail address, twelve columns:

| Column | Holds |
| --- | --- |
| Received (Goiânia) | When the entry last arrived, in `America/Sao_Paulo` |
| Full name, Organization, Job title | As typed |
| Countries or regions | The optional question |
| Time2Graze team | The label, not the id — `Remote Sensing Team` |
| Role on Time2Graze | The paragraph |
| Areas of expertise | The labels, comma-separated |
| Other expertise | What "Other" meant, when it was chosen |
| Email address | Lower-cased; the key the row is found by |
| Profile photo | The Drive link, or empty |
| Directory permission | `Yes` or `No` |

**A `No` is recorded, not discarded.** The question asks whether the
information *may be included* in the directory, so the answer is the
organiser's to act on: filter the sheet on that column before building the
directory. The site tells the person the same thing before and after they send.

## When it closes

`DIRECTORY_CLOSES` is 31 October 2026, in two places — `data/directory.ts`
takes the form off the page and `apps-script/directory.gs` refuses the write.
The site's copy is a courtesy so nobody is offered a control that would be
refused; the script is what enforces it. Extending it means changing both, and
`scripts/directory.test.mjs` fails if only one of them moves.

Leaving a public write endpoint open on a site nobody is watching any more is
the thing being avoided, exactly as it is for recap flagging and the
split-session choices.
