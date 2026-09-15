# The team directory form

The Time2Graze project is collecting an internal directory of who is on the
project and what each person works on. The questions come from the organiser's
specification (`TIME2GRAZE TEAM DIRECTORY`, 15 September 2026) and are
reproduced on the site word for word.

The form is on the home page, at `/#team-directory`. It is not a fifth
destination and does not appear in the navigation.

## One step is still yours: deploy the script

The site is ready and the code is on the branch, but the endpoint that stores
the answers lives in the Apps Script project, and only its owner can deploy it.
**Until that is done, the form renders and validates but every send answers
"That did not send."**

```
cd apps-script
clasp push
clasp deploy -i <deploymentId>          # the existing deployment, never a new one
```

`clasp deploy` on its own mints a new `/exec` URL and quietly leaves the site
talking to the old version. `-i` keeps the URL that `lib/apps-script.ts`
already holds, so nothing in the site has to change.

Then, once, in the Apps Script editor:

1. Run `directorySetup`. It creates the spreadsheet and the photo folder and
   logs the address of both. Doing it now means the first participant to answer
   is not also the first to find out whether Drive will cooperate.
2. Accept the authorisation prompt if one appears. The manifest's scopes are
   unchanged — `spreadsheets` and `drive.file` were already there for the
   corrections sheet — so it normally will not.

The sheet is **Time2Graze team directory**, private to the account running the
script. The photographs go to a Drive folder called **Time2Graze team directory
photos**, and the sheet's last-but-one column carries each file's link.

### Check it once, from the live site

Open the published home page, fill the form in with your own details and send
it. You should see "Sent. Your entry is with the Time2Graze organisers." and a
row in the sheet within a second or two. Send it again with a changed job title
from the same address: the answer becomes "Updated" and the row is rewritten
rather than a second one appearing.

### If a photograph does not arrive

The row is written first and the photograph attempted afterwards, so a Drive
failure never costs anyone their answers — the participant is told "Your photo
could not be stored" and the rest of the entry is on the sheet. If it happens
to everyone rather than to one person, `DriveApp` is being refused under the
`drive.file` scope: add `https://www.googleapis.com/auth/drive` to
`oauthScopes` in `apps-script/appsscript.json`, push, redeploy, and re-run
`directorySetup` to accept the new consent.

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
