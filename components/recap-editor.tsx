'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cleanDocument, plainDocument, recapDocument } from '@/lib/recap-document';
import { saveRecap, type SaveStatus, type StoredRecap } from '@/lib/recap-live';

const messages: Record<SaveStatus, string> = {
  saved: 'Summary saved.', denied: 'Incorrect edit password. Your text is still here.',
  conflict: 'Another person saved changes. Your text is preserved. Download your copy before opening their version to combine the changes.',
  invalid: 'The summary could not be saved. Check that it contains text and is within the size limit.',
  limit: 'Editing is temporarily locked after too many incorrect passwords.', closed: 'Editing has closed for this workshop.',
  unconfigured: 'Editing is not configured.', error: 'Could not confirm the save. Your text is still here. Check your connection and try again.',
};
type Draft = { html: string; base: string };

export default function DocumentEditor({ day, stored, initial, onClose, onSaved }: {
  day: number; stored: StoredRecap | null; initial: string; onClose: () => void; onSaved: (next: StoredRecap) => void;
}) {
  const key = `t2g-document-draft-${day}`;
  const [password, setPassword] = useState(() => { try { return sessionStorage.getItem('t2g-recap-password') ?? ''; } catch { return ''; } });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
      return saved && typeof saved.html === 'string' && typeof saved.base === 'string' && saved.html !== initial ? saved : null;
    } catch { return null; }
  });
  const [conflict, setConflict] = useState<StoredRecap | null>(null);
  const base = useRef(stored?.updated ?? '');
  const upload = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [4] }, link: { openOnClick: false } })],
    content: initial, immediatelyRender: false, shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: 'recap-document', role: 'textbox', 'aria-label': 'Daily summary document', 'aria-multiline': 'true' } },
    onUpdate: ({ editor }) => {
      setDirty(true);
      try { localStorage.setItem(key, JSON.stringify({ html: editor.getHTML(), base: base.current })); }
      catch { setNotice('This browser cannot keep a recovery copy. Save or download your changes before leaving.'); }
    },
  });
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => { editor?.setEditable(!sending, false); }, [editor, sending]);

  function download() {
    if (!editor) return;
    const blob = new Blob([`<!doctype html><html lang="en"><meta charset="utf-8"><title>Day ${day} summary</title><body>${cleanDocument(editor.getHTML())}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `day-${day}-summary.html`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file: File) {
    if (!editor) return;
    if (file.size > 5 * 1024 * 1024) { setNotice('Choose a document smaller than 5 MB.'); return; }
    if (!editor.isEmpty && !window.confirm('Replace the current text with this file?')) return;
    setSending(true); setNotice('Opening document…');
    try {
      let html: string;
      if (/\.docx$/i.test(file.name)) {
        const mammoth = await import('mammoth');
        const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })) });
        html = result.value;
      } else if (/\.(txt|html?)$/i.test(file.name)) {
        const text = await file.text(); html = /\.txt$/i.test(file.name) ? plainDocument(text) : text;
      } else { throw new Error('format'); }
      const safe = cleanDocument(html);
      if (safe.length > 50000) { setNotice('This document is too long. Shorten it before importing (50,000 characters including formatting).'); return; }
      editor.commands.setContent(safe);
      setNotice('Document imported. Review it and save when ready.');
    } catch { setNotice('Could not open this file. Use a Word (.docx), text (.txt) or HTML file, or paste the text into the document.'); }
    finally { setSending(false); }
  }
  async function save(event?: SyntheticEvent) {
    event?.preventDefault();
    if (!editor || sending) return;
    const html = cleanDocument(editor.getHTML());
    if (editor.isEmpty || !editor.getText().trim()) { setNotice('Add your summary before saving.'); return; }
    if (html.length > 50000) { setNotice('The summary is too long (50,000 characters including formatting). Your text has been kept.'); return; }
    setSending(true); setNotice('Saving…');
    const result = await saveRecap(day, { day, published: '', sections: [], document: html }, password, base.current);
    setSending(false); setNotice(messages[result.status]);
    if (result.status === 'saved' && result.recap) {
      try { localStorage.removeItem(key); sessionStorage.setItem('t2g-recap-password', password); } catch { /* Optional browser storage. */ }
      setDirty(false); onSaved(result.recap);
    } else if (result.status === 'conflict') { setConflict(result.recap ?? null); }
  }
  if (!editor) return <p className="recap-pending">Opening editor…</p>;
  const button = (label: string, action: () => void, active = false) => <button type="button" aria-pressed={active} disabled={sending} onClick={action}>{label}</button>;
  return <form className="recap-document-editor" onSubmit={save} aria-busy={sending}>
    {draft && <div className="recap-recovery">An unsaved draft is available.
      <button type="button" disabled={sending} onClick={() => { base.current = draft.base; editor.commands.setContent(cleanDocument(draft.html)); setDraft(null); }}>Restore draft</button>
      <button type="button" disabled={sending} onClick={() => { try { localStorage.removeItem(key); } catch {} setDraft(null); }}>Dismiss</button>
    </div>}
    <fieldset className="recap-document-toolbar" aria-label="Text formatting">
      <select aria-label="Text style" disabled={sending} value={editor.isActive('heading') ? 'heading' : 'paragraph'} onChange={e => e.target.value === 'heading' ? editor.chain().focus().setHeading({ level: 4 }).run() : editor.chain().focus().setParagraph().run()}>
        <option value="paragraph">Normal text</option><option value="heading">Heading</option>
      </select>
      {button('Bold', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {button('Italic', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {button('Underline', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
      {button('Bullets', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {button('Numbered list', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      <button type="button" disabled={sending || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
      <button type="button" disabled={sending || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      <button type="button" disabled={sending} onClick={() => upload.current?.click()}>Import file</button>
      <input ref={upload} type="file" hidden accept=".docx,.txt,.html,.htm" onChange={e => { const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = ''; }} />
    </fieldset>
    <EditorContent editor={editor} />
    <div className="recap-document-save">
      <label>Edit password<input type="password" required autoComplete="current-password" value={password} disabled={sending} onChange={e => setPassword(e.target.value)} /></label>
      <div className="recap-form-actions">
        <button type="submit" disabled={sending}>{sending ? 'Saving…' : stored ? 'Save changes' : 'Publish summary'}</button>
        <button type="button" disabled={sending} onClick={download}>Download copy</button>
        <button type="button" disabled={sending} onClick={() => { if (!dirty || window.confirm('Close without publishing? Your draft stays in this browser.')) onClose(); }}>Close editor</button>
      </div>
      <output aria-live="polite">{notice || (dirty ? 'Unsaved changes' : 'Paste or type your summary above, or import a file.')}</output>
      {conflict && <details><summary>View the latest published version</summary>
        <div className="recap-document" dangerouslySetInnerHTML={{ __html: recapDocument(conflict.recap) }} />
        <button type="button" onClick={() => { if (!window.confirm('Replace your editor text with the published version? Download your changes first.')) return; base.current = conflict.updated; editor.commands.setContent(recapDocument(conflict.recap)); setConflict(null); setNotice('Latest version opened. Add your changes and save.'); }}>Open this version in the editor</button>
      </details>}
    </div>
  </form>;
}
