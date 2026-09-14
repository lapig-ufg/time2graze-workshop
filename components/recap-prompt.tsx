'use client';

import {
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  LoaderCircle,
  Pencil,
} from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import {
  RECAP_PROMPT_EDIT_CLOSES,
  RECAP_PROMPT_MAX,
  RECAP_PROMPTS,
} from '@/data/recap-prompts';
import type { Day } from '@/data/types';
import type { Clock } from '@/lib/now';
import { formatRecapStamp } from '@/lib/recap';
import {
  loadPrompts,
  recapPromptsEnabled,
  savePrompt,
  type PromptsState,
  type SaveStatus,
} from '@/lib/recap-prompt';

const MESSAGES: Record<SaveStatus | 'sending', string> = {
  sending: 'Saving…',
  saved: 'Saved. Everyone opening this page now sees this version.',
  conflict:
    'Someone else saved this prompt while you were editing. Their version is loaded below; copy your changes into it and save again.',
  denied: 'Wrong password.',
  invalid: 'This prompt is too long to save.',
  limit: 'Too many wrong passwords today. Editing is locked until tomorrow.',
  closed: 'Editing has closed for this workshop.',
  unconfigured: 'Editing is not switched on yet.',
  error: 'That did not save. Check your connection and try again.',
};

const PASSWORD_KEY = 't2g-prompt-password';

/**
 * One request per page, shared by every day: switching tabs remounts this
 * component, and should not fetch the same five prompts again each time.
 */
let shared: Promise<PromptsState | null> | null = null;
function prompts() {
  shared ??= loadPrompts();
  return shared;
}

function storedPassword(): string {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) ?? '';
  } catch {
    return '';
  }
}

function rememberPassword(value: string) {
  try {
    sessionStorage.setItem(PASSWORD_KEY, value);
  } catch {
    /* A browser that refuses storage asks again next time. */
  }
}

/**
 * The prompt that drafts this day's recap in NotebookLM, and the place the
 * organisers change it. It sits under the recap because it is how the recap is
 * made; it is not printed, for the same reason the recap is not.
 */
export function RecapPrompt({ day, clock }: { day: Day; clock: Clock | null }) {
  const original = RECAP_PROMPTS[day.index] ?? '';
  const [state, setState] = useState<PromptsState | null | 'loading'>(
    recapPromptsEnabled ? 'loading' : null,
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<SaveStatus | 'sending' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!recapPromptsEnabled) return;
    let live = true;
    void prompts().then((result) => {
      if (live) setState(result);
    });
    return () => {
      live = false;
    };
  }, []);

  const loaded = state !== 'loading' && state !== null ? state : null;
  const stored = loaded?.prompts[day.index] ?? null;
  const text = stored?.text ?? original;
  const open = clock === null || clock.date <= RECAP_PROMPT_EDIT_CLOSES;
  const canEdit = Boolean(loaded?.editable) && open;
  const sending = status === 'sending';

  function startEditing() {
    setDraft(text);
    setPassword(storedPassword());
    setStatus(null);
    setEditing(true);
  }

  function applyStored(next: PromptsState['prompts'][number] | null) {
    if (!loaded) return;
    const nextPrompts = { ...loaded.prompts };
    if (next) nextPrompts[day.index] = next;
    else delete nextPrompts[day.index];
    const nextState = { ...loaded, prompts: nextPrompts };
    shared = Promise.resolve(nextState);
    setState(nextState);
  }

  async function save(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setStatus('sending');
    // Saving the original text back is a reset, so the page says "Original".
    const outgoing = draft.trim() === original.trim() ? '' : draft;
    const result = await savePrompt(
      day.index,
      outgoing,
      password,
      stored?.updated ?? '',
    );
    setStatus(result.status);
    if (result.status === 'saved') {
      rememberPassword(password);
      applyStored(result.prompt ?? null);
      setEditing(false);
    } else if (result.status === 'conflict') {
      applyStored(result.prompt ?? null);
      setDraft(result.prompt?.text ?? original);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const stamp =
    state === 'loading'
      ? 'Checking for the latest version…'
      : stored
        ? `Edited ${formatRecapStamp(stored.updated)}`
        : state === null && recapPromptsEnabled
          ? 'Original · the edited version could not be loaded'
          : 'Original';

  return (
    <details className="recap-prompt">
      <summary>
        NotebookLM prompt for Day {day.index}
        <span>{stamp}</span>
      </summary>

      <div className="recap-prompt-body">
        {!editing && (
          <>
            <div className="recap-prompt-actions">
              <button type="button" onClick={copy}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
              {canEdit && (
                <button type="button" onClick={startEditing}>
                  <Pencil aria-hidden="true" />
                  Edit
                </button>
              )}
            </div>
            <pre className="recap-prompt-text">{text}</pre>
          </>
        )}

        {editing && (
          <form className="recap-form" onSubmit={save} aria-busy={sending}>
            <label htmlFor={`prompt-text-${day.index}`}>
              Prompt for Day {day.index}
            </label>
            <textarea
              id={`prompt-text-${day.index}`}
              className="recap-prompt-editor"
              rows={22}
              maxLength={RECAP_PROMPT_MAX}
              readOnly={sending}
              value={draft}
              spellCheck
              onChange={(event) => setDraft(event.target.value)}
            />
            <label htmlFor={`prompt-password-${day.index}`}>Edit password</label>
            <input
              id={`prompt-password-${day.index}`}
              type="password"
              required
              autoComplete="current-password"
              readOnly={sending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="recap-form-actions">
              <button type="submit" disabled={sending}>
                {sending && (
                  <LoaderCircle className="calendar-spinner" aria-hidden="true" />
                )}
                {sending ? 'Saving…' : 'Save for everyone'}
              </button>
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
              {draft !== original && (
                <button type="button" onClick={() => setDraft(original)}>
                  Restore original
                </button>
              )}
            </div>
          </form>
        )}

        <output
          className="recap-form-status"
          data-state={
            status === 'saved' ? 'success' : status && !sending ? 'error' : undefined
          }
          aria-live="polite"
          aria-atomic="true"
        >
          {status && !sending && (
            <>
              {status === 'saved' ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <CircleAlert aria-hidden="true" />
              )}
              <span>{MESSAGES[status]}</span>
            </>
          )}
        </output>
      </div>
    </details>
  );
}
