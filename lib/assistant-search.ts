/**
 * The answer that never needs a key.
 *
 * This ranks corpus entries against a question by weighted word overlap. It is
 * not a model and does not pretend to be one: it returns the entries
 * themselves, so what a reader sees is the published line and the link to it.
 * That makes it both the fallback when no model is reachable and the floor
 * under the model — whatever else fails, a question about the hotel still
 * finds the hotel.
 *
 * Participants travel from Uruguay, Argentina, Colombia and Brazil, and the
 * site is English by rule. The bridge below is the concession: a small,
 * explicit table of the words those readers actually type, mapped to the words
 * the corpus uses. It is not translation and must not grow into one.
 */
import type { Corpus, CorpusEntry } from '@/lib/assistant';

const BRIDGE: Record<string, string> = {
  // Portuguese. Nothing here may map onto a word in STOP: bridging is applied
  // after the stop list, so 'cómo' → 'how' would smuggle 'how' back in and
  // match every entry containing it.
  hospedagem: 'accommodation', quarto: 'room', almoco: 'lunch',
  jantar: 'dinner', cafe: 'coffee', comida: 'food', onibus: 'shuttle',
  transporte: 'shuttle', translado: 'shuttle', aeroporto: 'airport',
  chegada: 'arrival', voo: 'flight', programa: 'programme',
  programacao: 'programme', sessao: 'session', acontece: 'session',
  horario: 'time', hora: 'time', semana: 'week', apresentacao: 'slides',
  material: 'material', documento: 'document', mapa: 'map',
  endereco: 'address', cidade: 'city', parque: 'park', fazenda: 'farm',
  visita: 'visit', campo: 'field', passeio: 'tour', uber: 'ride',
  taxi: 'ride', pagamento: 'payment',
  // Spanish, where it differs
  alojamiento: 'accommodation', almuerzo: 'lunch', cena: 'dinner',
  autobus: 'shuttle', llegada: 'arrival', aeropuerto: 'airport',
  vuelo: 'flight', presentacion: 'slides', ciudad: 'city',
  direccion: 'address', granja: 'farm', pago: 'payment', paseo: 'tour',
};

/** Words that match everything and rank nothing. */
const STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'is', 'are', 'and', 'or',
  'for', 'what', 'when', 'where', 'who', 'which', 'how', 'i', 'my', 'me',
  'do', 'does', 'it', 'this', 'that', 'we', 'us', 'be', 'will', 'can', 'from',
  'de', 'da', 'o', 'e', 'em', 'no', 'na', 'um', 'uma', 'que', 'eu', 'se',
  'el', 'la', 'los', 'las', 'y', 'en', 'un', 'una', 'es', 'del', 'por',
  'desde', 'para', 'com', 'con', 'ao', 'as', 'os',
]);

/**
 * Weekdays, as the five workshop days. A reader asking about Wednesday and a
 * reader asking about Day 3 are asking the same question.
 */
const WEEKDAY_TO_DAY: Record<string, number> = {
  monday: 1, segunda: 1, lunes: 1,
  tuesday: 2, terca: 2, martes: 2,
  wednesday: 3, quarta: 3, miercoles: 3,
  thursday: 4, quinta: 4, jueves: 4,
  friday: 5, sexta: 5, viernes: 5,
};

/** Lowercased, unaccented words. 'Almoço' and 'almoco' have to meet. */
/** Everything an entry can be found by: its text and its published details. */
function bodyOf(entry: CorpusEntry): string {
  return [entry.text, ...(entry.details ?? []).map((detail) => detail.value)].join(' ');
}

function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * The day a question is about, if it names one.
 *
 * Without this, "when is lunch on day 3" answers with all five lunches, which
 * is not an answer. A day named is a hard filter, not a ranking hint: the
 * reader asked about one day.
 */
function dayAsked(question: string): number | null {
  const normalised = words(question).join(' ');
  const numbered = /\b(?:day|dia) ?([1-5])\b/.exec(normalised);
  if (numbered) return Number(numbered[1]);
  for (const [name, index] of Object.entries(WEEKDAY_TO_DAY)) {
    if (normalised.includes(name)) return index;
  }
  // The workshop runs 14–18 September, so a date in that range names a day.
  const dated = /\b1([4-8])(?: sep| de set| setembro| septiembre|\b)/.exec(
    normalised,
  );
  if (dated) return Number(dated[1]) - 3;
  return null;
}

/** Words that named the day rather than the subject; see `dayAsked`. */
const DAY_WORDS =
  /^(day|dia|feira|sep|september|setembro|septiembre|[1-9]|1[0-9])$/;

function queryTerms(question: string, day: number | null): string[] {
  const terms = new Set<string>();
  for (const word of words(question)) {
    if (word.length < 2 || STOP.has(word)) continue;
    // A day already extracted must not also compete as a search term: it
    // matches every entry of that day equally and tells them apart not at all.
    if (day !== null && (DAY_WORDS.test(word) || word in WEEKDAY_TO_DAY))
      continue;
    terms.add(word);
    const bridged = BRIDGE[word];
    if (bridged) terms.add(bridged);
  }
  return [...terms];
}

/**
 * How much one word is worth, by how rare it is in the corpus.
 *
 * A flat count cannot rank: 'day' appears in most entries and 'airport' in
 * one, and a question mentioning both is asking about the airport. This is
 * computed once per corpus, not once per question.
 */
const weights = new WeakMap<Corpus, Map<string, number>>();

function termWeights(corpus: Corpus): Map<string, number> {
  const cached = weights.get(corpus);
  if (cached) return cached;

  const frequency = new Map<string, number>();
  for (const entry of corpus.entries) {
    for (const word of new Set([...words(entry.title), ...words(bodyOf(entry))])) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }

  const total = corpus.entries.length;
  const weighted = new Map<string, number>();
  for (const [word, count] of frequency) {
    weighted.set(word, Math.log(total / count));
  }
  weights.set(corpus, weighted);
  return weighted;
}

export type Match = { entry: CorpusEntry; score: number };

/**
 * The ranked entries for a question.
 *
 * A title hit counts for more than a body hit: someone typing "Golden Lis" is
 * naming a thing, not describing one. Results are kept relative to the best
 * one rather than against a fixed floor, so a question with one strong word
 * and four filler words still answers — and a question the corpus cannot
 * answer at all still comes back empty, which is what lets the panel say so.
 */
export function search(corpus: Corpus, question: string, limit = 4): Match[] {
  const day = dayAsked(question);
  const terms = queryTerms(question, day);
  const weight = termWeights(corpus);

  if (!terms.length && day === null) return [];

  /**
   * Naming a day is itself evidence. It admits that day's entries even when no
   * search term landed — "what happens on Wednesday" names no subject at all —
   * and the day's own summary outranks the sessions inside it, because the
   * summary is what that question asked for.
   */
  const dayBonus = (entry: CorpusEntry) => {
    if (day === null || entry.day !== day) return 0;
    return entry.id === `day-${day}` ? 4 : 1.5;
  };

  const matches: Match[] = [];
  for (const entry of corpus.entries) {
    // An entry belonging to another day cannot answer a question about this
    // one. Entries with no day — venues, the city, travel — always can.
    if (day !== null && entry.day !== undefined && entry.day !== day) continue;

    const title = new Set(words(entry.title));
    const body = new Set(words(bodyOf(entry)));

    let score = dayBonus(entry);
    for (const term of terms) {
      const value = weight.get(term);
      if (value === undefined) continue;
      if (title.has(term)) score += value * 3;
      else if (body.has(term)) score += value;
    }

    // A whole page is the least specific thing that can answer anything, so it
    // yields to any entry that scored as well.
    if (entry.kind === 'page') score -= 0.5;

    if (score > 0) matches.push({ entry, score });
  }

  matches.sort(
    (a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id),
  );

  const best = matches[0]?.score ?? 0;
  return matches.filter((match) => match.score >= best * 0.45).slice(0, limit);
}
