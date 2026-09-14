import { AGENDA } from '@/data/agenda';

/** A one-use marker set by Ask before it moves to a programme source. */
export const ASK_HIGHLIGHT_SESSION = 'time2graze-ask-highlight-session';

/** '#day-3' -> index 2. Null when the hash does not name a day. */
export function dayFromHash(hash: string) {
  const match = /^#?day-(\d+)$/.exec(hash);
  if (!match) return null;
  const index = AGENDA.findIndex((d) => d.index === Number(match[1]));
  return index >= 0 ? index : null;
}

/**
 * '#recap-day-3' -> index 2. Checked separately from `dayFromHash` because the
 * recap only exists in the DOM while its own day is open: a link arriving from
 * the home band or from a message has to switch the day before the browser can
 * find anything to scroll to.
 */
export function dayFromRecapHash(hash: string) {
  // '#recap-day-3', or one topic of it: '#recap-d3-field-protocol-alignment'.
  const match = /^#?recap-(?:day-(\d+)|d(\d+)(?:-[a-z0-9-]+)?)$/.exec(hash);
  if (!match) return null;
  const index = AGENDA.findIndex((d) => d.index === Number(match[1] ?? match[2]));
  return index >= 0 ? index : null;
}

/** '#d3-country-uruguay' -> index of the day holding that session. */
export function dayFromSessionHash(hash: string) {
  const id = hash.replace(/^#/, '');
  if (!id) return null;
  const index = AGENDA.findIndex((d) => d.sessions.some((s) => s.id === id));
  return index >= 0 ? index : null;
}

/**
 * A `#day-3` link used to switch the day and leave the reader at the top of
 * the page, with the panel below the fold and no sign that anything had
 * happened — arriving from the week index, it read like any other page change.
 * This scrolls to the tabs, which show which day is open just above the panel.
 */
export function scrollToDayPanel() {
  if (document.readyState !== 'complete') {
    addEventListener('load', () => scrollToDayPanel(), { once: true });
    return;
  }

  // `scroll-padding-top` on the html already clears the sticky header.
  document.querySelector('.day-tabs')?.scrollIntoView({ block: 'start' });
}

/**
 * Scrolls to the session in whichever representation is on screen: the
 * proportional grid on desktop, the list everywhere else.
 *
 * Neither carries an `id`, and that is deliberate: with one, the browser makes
 * its own jump to the element before React has switched days and fights this
 * scroll — on desktop it aimed at the one-pixel clipped copy and stopped in
 * the wrong place.
 */
function visibleSession(id: string): HTMLElement | null {
  const gridVisible = window.innerWidth >= 1280;
  const candidates = [...document.querySelectorAll<HTMLElement>(`[data-session="${CSS.escape(id)}"]`)];
  const inList = (el: Element) => el.closest('.session-list') !== null;
  return gridVisible
    ? candidates.find((el) => !inList(el)) ?? null
    : candidates.find(inList) ?? null;
}

export function scrollToSession(id: string) {
  // Scrolling before the page has finished loading misses: the hero image is
  // still going to shift everything below it.
  if (document.readyState !== 'complete') {
    addEventListener('load', () => scrollToSession(id), { once: true });
    return;
  }

  /**
   * Which representation is shown is decided by the breakpoint, so read the
   * viewport rather than the computed style of the grid: a scroll fired before
   * `load` (as a session link does) can measure the grid before the stylesheet
   * applies, find it `display: block`, and roll to the hidden desktop block
   * instead of the mobile list.
   */
  const target = visibleSession(id);
  if (!target) return;

  // No `behavior`: the CSS decides, and it already switches to instant under
  // prefers-reduced-motion.
  target.scrollIntoView({ block: 'center' });
  return target;
}

/**
 * Makes the item reached from Ask briefly unmistakable without changing its
 * address or leaving a marker behind in a copied programme link.
 */
export function highlightSession(id: string) {
  const target = visibleSession(id);
  if (!target) return;

  target.classList.remove('session-assistant-focus');
  // Restart the short visual cue when a reader opens the same source twice.
  void target.getBoundingClientRect();
  target.classList.add('session-assistant-focus');
  window.setTimeout(() => target.classList.remove('session-assistant-focus'), 4200);
}

/** Scrolls to the day's recap, once the day holding it has rendered. */
export function scrollToRecap() {
  if (document.readyState !== 'complete') {
    addEventListener('load', () => scrollToRecap(), { once: true });
    return;
  }

  document.querySelector('.recap')?.scrollIntoView({ block: 'start' });
}
