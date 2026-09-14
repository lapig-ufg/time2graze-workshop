import DOMPurify from 'dompurify';
import type { DayRecap } from '@/data/types';
import { sectionHeading } from './recap';

export function cleanDocument(html: string): string {
  return DOMPurify.sanitize(html.replace(/<(\/?)(?:h1|h2|h3|h5|h6)(?=[\s>])/gi, '<$1h4'), {
    ALLOWED_TAGS: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a'],
    ALLOWED_ATTR: ['href', 'start'],
  });
}

export function plainDocument(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.split(/\r?\n\s*\r?\n/).map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`).join('');
}

export function recapDocument(recap: DayRecap | null): string {
  if (!recap) return '';
  if (recap.document !== undefined) return cleanDocument(recap.document);
  return recap.sections.map(section => {
    const heading = `<h4>${plainDocument(sectionHeading(section)).slice(3, -4)}</h4>`;
    const summary = section.summary ? plainDocument(section.summary.text) : '';
    const groups = [['Decisions', section.decisions], ['Open questions', section.questions], ['Actions', section.actions]] as const;
    return heading + summary + groups.map(([label, items]) => items?.length
      ? `<h4>${label}</h4><ul>${items.map(item => `<li>${plainDocument((item.owner ? item.owner + ': ' : '') + item.text)}</li>`).join('')}</ul>` : '').join('');
  }).join('');
}
