'use client';

import {
  CheckCircle2,
  CircleAlert,
  ImageUp,
  LoaderCircle,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from 'react';
import {
  DIRECTORY_CONSENT,
  DIRECTORY_CONSENT_STATEMENT,
  DIRECTORY_EXPERTISE,
  DIRECTORY_INTRO,
  DIRECTORY_LIMITS,
  DIRECTORY_OTHER,
  DIRECTORY_TEAMS,
  DIRECTORY_TITLE,
  directoryOpen,
} from '@/data/directory';
import { useSentEntry, rememberEntry } from '@/hooks/use-directory-entry';
import { useWorkshopClock } from '@/hooks/use-workshop-clock';
import {
  directoryEnabled,
  submitDirectoryEntry,
  type DirectoryStatus,
} from '@/lib/directory';
import { preparePhoto, type PhotoError } from '@/lib/directory-photo';

/**
 * The Time2Graze team directory form.
 *
 * **At a route of its own, `/team-directory/`.** It was first published there
 * unlisted, so the organiser could share the link before announcing it; it is
 * now linked from the home page (`components/team-directory-invite.tsx`) and
 * from the assistant, and that address is the one people already have.
 *
 * **Always open.** Anyone on this page came to answer it, so the questions are
 * simply there; there is nothing to fold them into.
 *
 * **An answer already sent is not a blank form.** The page says what was sent
 * and shows the form with every answer already in it, because nobody on hotel
 * wi-fi should retype a paragraph to fix a job title — the entry is keyed by
 * e-mail address on the organiser's sheet, so the correction replaces the row
 * rather than adding a second one.
 */

const MESSAGES: Record<DirectoryStatus | 'sending', string> = {
  sending: 'Sending…',
  saved: 'Sent. Your entry is with the Time2Graze organisers.',
  updated: 'Updated. Your earlier entry has been replaced.',
  invalid: 'Some answers were not accepted. Check the required questions and try again.',
  limit: 'The directory has reached today’s limit. Try again tomorrow, or tell an organiser.',
  closed: 'The directory has closed. Tell an organiser directly.',
  timeout: 'That took too long. Check your connection and try again.',
  error: 'That did not send. Try again, or tell an organiser directly.',
};

const PHOTO_MESSAGES: Record<PhotoError, string> = {
  type: 'That file is not an image. Choose a JPEG or PNG.',
  size: 'That file is over 10 MB. Choose a smaller one.',
  unreadable:
    'That image could not be read — an iPhone HEIC file often cannot be. Choose a JPEG or PNG.',
};

type Draft = {
  name: string;
  organization: string;
  jobTitle: string;
  regions: string;
  team: string;
  role: string;
  expertise: string[];
  expertiseOther: string;
  email: string;
  consent: string;
};

const EMPTY: Draft = {
  name: '',
  organization: '',
  jobTitle: '',
  regions: '',
  team: '',
  role: '',
  expertise: [],
  expertiseOther: '',
  email: '',
  consent: '',
};

/** Kilobytes, for the one line that says what is about to be sent. */
function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function sentDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function TeamDirectory() {
  const clock = useWorkshopClock();
  const sent = useSentEntry();
  const id = useId();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  /* Null until this reader touches the form, so a remembered entry is what the
     fields show until then — the same shape as the split-session chooser. */
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<DirectoryStatus | 'sending' | null>(null);
  const [photoState, setPhotoState] = useState<
    { kind: 'none' } | { kind: 'reading' } | { kind: 'error'; reason: PhotoError } | {
      kind: 'ready';
      preview: string;
      bytes: number;
      data: { name: string; type: string; data: string };
    }
  >({ kind: 'none' });
  const [photoStored, setPhotoStored] = useState<'stored' | 'failed' | 'none'>('none');
  const [expertiseError, setExpertiseError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const expertiseGroup = useRef<HTMLFieldSetElement>(null);

  if (!directoryEnabled || !directoryOpen(clock?.date ?? null)) return null;

  const values: Draft = touched
    ? draft
    : sent
      ? {
          name: sent.name,
          organization: sent.organization,
          jobTitle: sent.jobTitle,
          regions: sent.regions,
          team: sent.team,
          role: sent.role,
          expertise: sent.expertise,
          expertiseOther: sent.expertiseOther,
          email: sent.email,
          consent: sent.consent,
        }
      : EMPTY;

  const sending = state === 'sending';
  const done = state === 'saved' || state === 'updated';

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setTouched(true);
    setDraft({ ...values, [key]: value });
    setState(null);
  }

  function toggleExpertise(optionId: string, checked: boolean) {
    const next = checked
      ? [...values.expertise, optionId]
      : values.expertise.filter((entry) => entry !== optionId);
    setExpertiseError(false);
    set('expertise', next);
  }

  async function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoState({ kind: 'reading' });
    const result = await preparePhoto(file);
    setPhotoState(
      result.ok
        ? {
            kind: 'ready',
            preview: result.photo.preview,
            bytes: result.photo.bytes,
            data: result.photo.photo,
          }
        : { kind: 'error', reason: result.reason },
    );
    if (!result.ok && fileInput.current) fileInput.current.value = '';
  }

  function clearPhoto() {
    setPhotoState({ kind: 'none' });
    if (fileInput.current) fileInput.current.value = '';
  }

  async function send(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    /* The browser checks every field it can. This is the one question it
       cannot: a checkbox group is valid when none of its boxes is ticked. */
    if (values.expertise.length === 0) {
      setExpertiseError(true);
      expertiseGroup.current?.querySelector('input')?.focus();
      return;
    }

    setState('sending');
    const result = await submitDirectoryEntry({
      ...values,
      photo: photoState.kind === 'ready' ? photoState.data : null,
    });
    setState(result.status);
    setPhotoStored(result.photo);

    if (result.status === 'saved' || result.status === 'updated') {
      rememberEntry({
        ...values,
        email: values.email.trim().toLowerCase(),
        sentAt: new Date().toISOString(),
        photo: result.photo === 'stored' || (sent?.photo ?? false),
      });
      setTouched(false);
      clearPhoto();
    }
  }

  const otherPicked = values.expertise.includes(DIRECTORY_OTHER);
  const roleLeft = DIRECTORY_LIMITS.role - values.role.length;
  const stamp = sent ? sentDate(sent.sentAt) : null;

  return (
    <section
      className="team-directory section-pad"
      id="team-directory"
      aria-labelledby="team-directory-title"
    >
      <div className="section-title">
        <p>Time2Graze</p>
        <h1 id="team-directory-title">{DIRECTORY_TITLE}</h1>
      </div>

      <div className="td-card">
        <div className="td-head">
          <p className="td-intro">{DIRECTORY_INTRO}</p>
          {sent && (
            <p className="td-sent">
              <CheckCircle2 aria-hidden="true" />
              <span>
                Sent as <strong>{sent.email}</strong>
                {stamp ? ` on ${stamp}` : ''}. Sending again from that address
                replaces it.
              </span>
            </p>
          )}
        </div>

        <div className="td-body">
          <form className="td-form" onSubmit={send} aria-busy={sending}>
            <p className="td-required-note">
              Every question is required except where it says otherwise.
            </p>

            <div className="td-field">
              <label htmlFor={`${id}-name`}>Full name</label>
              <input
                id={`${id}-name`}
                name="name"
                type="text"
                required
                maxLength={DIRECTORY_LIMITS.name}
                autoComplete="name"
                value={values.name}
                readOnly={sending}
                onChange={(event) => set('name', event.target.value)}
              />
            </div>

            <div className="td-field">
              <label htmlFor={`${id}-organization`}>Organization</label>
              <input
                id={`${id}-organization`}
                name="organization"
                type="text"
                required
                maxLength={DIRECTORY_LIMITS.organization}
                autoComplete="organization"
                value={values.organization}
                readOnly={sending}
                onChange={(event) => set('organization', event.target.value)}
              />
            </div>

            <div className="td-field">
              <label htmlFor={`${id}-job`}>Job title</label>
              <input
                id={`${id}-job`}
                name="jobTitle"
                type="text"
                required
                maxLength={DIRECTORY_LIMITS.jobTitle}
                autoComplete="organization-title"
                value={values.jobTitle}
                readOnly={sending}
                onChange={(event) => set('jobTitle', event.target.value)}
              />
            </div>

            <div className="td-field">
              <label htmlFor={`${id}-regions`}>
                Which countries or regions do you support through Time2Graze?
                <span className="td-optional">Optional</span>
              </label>
              <input
                id={`${id}-regions`}
                name="regions"
                type="text"
                maxLength={DIRECTORY_LIMITS.regions}
                value={values.regions}
                readOnly={sending}
                onChange={(event) => set('regions', event.target.value)}
              />
            </div>

            <div className="td-field">
              <label htmlFor={`${id}-team`}>
                Which Time2Graze team are you part of?
              </label>
              <select
                id={`${id}-team`}
                name="team"
                required
                value={values.team}
                disabled={sending}
                onChange={(event) => set('team', event.target.value)}
              >
                <option value="">Choose one…</option>
                {DIRECTORY_TEAMS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="td-field">
              <label htmlFor={`${id}-role`}>What is your role on Time2Graze?</label>
              <p className="td-help" id={`${id}-role-help`}>
                Please briefly describe your main responsibilities or
                contributions in two or three sentences.
              </p>
              <textarea
                id={`${id}-role`}
                name="role"
                required
                rows={4}
                maxLength={DIRECTORY_LIMITS.role}
                aria-describedby={`${id}-role-help`}
                value={values.role}
                readOnly={sending}
                onChange={(event) => set('role', event.target.value)}
              />
              {roleLeft < 200 && (
                <p className="td-help td-count">{roleLeft} characters left</p>
              )}
            </div>

            <fieldset className="td-field td-group" ref={expertiseGroup}>
              <legend>What are your areas of expertise?</legend>
              <p className="td-help">Select all that apply.</p>
              <div className="td-options">
                {DIRECTORY_EXPERTISE.map((option, index) => (
                  <label className="td-option" key={option.id}>
                    <input
                      type="checkbox"
                      name="expertise"
                      value={option.id}
                      /* Only the first box carries `required`, and only while
                         nothing is ticked: a checkbox is `required` when it
                         alone must be checked, so putting it on all eleven
                         would demand all eleven. */
                      required={index === 0 && values.expertise.length === 0}
                      checked={values.expertise.includes(option.id)}
                      disabled={sending}
                      onChange={(event) =>
                        toggleExpertise(option.id, event.target.checked)
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {otherPicked && (
                <div className="td-other">
                  <label htmlFor={`${id}-other`}>Which other area?</label>
                  <input
                    id={`${id}-other`}
                    name="expertiseOther"
                    type="text"
                    required
                    maxLength={DIRECTORY_LIMITS.expertiseOther}
                    value={values.expertiseOther}
                    readOnly={sending}
                    onChange={(event) => set('expertiseOther', event.target.value)}
                  />
                </div>
              )}
              {expertiseError && (
                <p className="td-error" role="alert">
                  Choose at least one area.
                </p>
              )}
            </fieldset>

            <div className="td-field">
              <label htmlFor={`${id}-email`}>Email address</label>
              <input
                id={`${id}-email`}
                name="email"
                type="email"
                required
                maxLength={DIRECTORY_LIMITS.email}
                autoComplete="email"
                inputMode="email"
                value={values.email}
                readOnly={sending}
                onChange={(event) => set('email', event.target.value)}
              />
              <p className="td-help">
                One entry is kept per address. Sending again from the same
                address replaces your earlier answers.
              </p>
            </div>

            <div className="td-field">
              <label htmlFor={`${id}-photo`}>
                Profile photo<span className="td-optional">Optional</span>
              </label>
              <p className="td-help" id={`${id}-photo-help`}>
                Please upload a clear head-and-shoulders photo for the
                directory. One image, up to 10 MB. It is resized in your browser
                before it is sent.
              </p>
              <input
                className="td-file"
                id={`${id}-photo`}
                name="photo"
                type="file"
                accept="image/*"
                ref={fileInput}
                disabled={sending}
                aria-describedby={`${id}-photo-help`}
                onChange={pickPhoto}
              />
              <output className="td-photo-state" aria-live="polite">
                {photoState.kind === 'reading' && (
                  <span className="td-photo-line">
                    <LoaderCircle className="calendar-spinner" aria-hidden="true" />
                    Preparing the image…
                  </span>
                )}
                {photoState.kind === 'error' && (
                  <span className="td-photo-line" data-state="error">
                    <CircleAlert aria-hidden="true" />
                    {PHOTO_MESSAGES[photoState.reason]}
                  </span>
                )}
                {photoState.kind === 'ready' && (
                  <span className="td-photo-ready">
                    {/* Unoptimised export and a data: URL: next/image would
                        have nothing to optimise and no loader to reach. */}
                    <Image
                      src={photoState.preview}
                      alt="The photo you chose, as it will be stored"
                      width={72}
                      height={72}
                      unoptimized
                    />
                    <span className="td-photo-line">
                      <ImageUp aria-hidden="true" />
                      Ready to send · {sizeLabel(photoState.bytes)}
                    </span>
                    <button type="button" onClick={clearPhoto} disabled={sending}>
                      <Trash2 aria-hidden="true" />
                      Remove
                    </button>
                  </span>
                )}
                {photoState.kind === 'none' && sent?.photo && (
                  <span className="td-photo-line">
                    A photo is already on file. Choose another only to replace it.
                  </span>
                )}
              </output>
            </div>

            <fieldset className="td-field td-group">
              <legend>Directory permission</legend>
              <p className="td-statement">{DIRECTORY_CONSENT_STATEMENT}</p>
              <div className="td-options td-options-inline">
                {DIRECTORY_CONSENT.map((option) => (
                  <label className="td-option" key={option.id}>
                    <input
                      type="radio"
                      name="consent"
                      value={option.id}
                      required
                      checked={values.consent === option.id}
                      disabled={sending}
                      onChange={() => set('consent', option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {values.consent === 'no' && (
                <p className="td-help">
                  Your answers still reach the organisers, and nothing you
                  provided is added to the directory.
                </p>
              )}
            </fieldset>

            <div className="td-actions">
              <button type="submit" disabled={sending}>
                {sending && (
                  <LoaderCircle className="calendar-spinner" aria-hidden="true" />
                )}
                {sending ? 'Sending…' : sent ? 'Send update' : 'Send entry'}
              </button>
            </div>

            <output
              className="td-status"
              data-state={done ? 'success' : state && !sending ? 'error' : undefined}
              aria-live="polite"
              aria-atomic="true"
            >
              {state && (
                <>
                  {done ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : sending ? (
                    <LoaderCircle className="calendar-spinner" aria-hidden="true" />
                  ) : (
                    <CircleAlert aria-hidden="true" />
                  )}
                  <span>
                    {MESSAGES[state]}
                    {done && photoStored === 'failed' && (
                      <>
                        {' '}
                        Your photo could not be stored — an organiser will ask
                        you for it.
                      </>
                    )}
                    {done && values.consent === 'no' && (
                      <> You said no, so nothing you provided goes into the directory.</>
                    )}
                  </span>
                </>
              )}
            </output>
          </form>
        </div>
      </div>
    </section>
  );
}
