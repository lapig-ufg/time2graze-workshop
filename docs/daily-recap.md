# Daily summaries

Each day has one document on `/programme/`, beneath its schedule.

1. Open the day and select **Add summary**.
2. Paste the generated summary directly into the document, or choose **Import file** for a Word (`.docx`), text (`.txt`) or HTML file. No session selection or prescribed structure is needed.
3. Enter the existing edit password and choose **Publish summary**.
4. Read the document together. Select **Edit summary**, make corrections directly in the text, and choose **Save changes**.

The toolbar provides headings, bold, italic, underline, lists, undo and redo. Word imports retain supported text formatting; images and complex page layouts are omitted. Files are converted in the browser. Google Docs content can be pasted directly or downloaded as Word and imported.

Unsaved edits have a recovery copy in this browser when browser storage is available. **Download copy** exports the current document as HTML, including unsaved changes. It can be opened in a browser or imported again. A failed save leaves the editor open. If someone else saves first, the editor preserves your text and shows their published version for comparison; download your work before opening that version and combining the changes. This is a shared saved document, not simultaneous Google Docs collaboration. Readers refresh automatically every 30 seconds while the page is visible.

The edit password and closing date are unchanged. Publishing closes on 21 September 2026. There is no public line-flagging workflow in this editor. Existing structured summaries remain readable and become a single document when edited.

## Implementation

The Apps Script endpoint stores a `document` string and empty legacy `sections`; old section records remain compatible. Rich text is sanitized with a restricted tag and attribute allowlist before display, import and save. The server rejects documents above 50,000 characters instead of truncating them, stamps publication/revision times, and checks the revision the edit started from. JSON is an internal transport only.

After changing the Apps Script source, push from `apps-script/` with `clasp push`, then redeploy the existing deployment with `clasp deploy -i AKfycbzpmYFJq7WFRxtnGHGZkW0FFhiit9441UHtfZnwfrNZI6Vuku1MY6Rb7JBBIcFwGcBi -d "Daily summary document editor"`. This change introduces no new scopes. Keep the endpoint URL and edit password unchanged.
