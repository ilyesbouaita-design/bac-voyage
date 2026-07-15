import type { OverlapResult, SimilarityOptions, TextSimilarity } from "../core/utilities.ts";

// A modest, multilingual (DE / FR / EN) function-word list. Overridable per call.
const DEFAULT_STOPWORDS = new Set<string>([
  // German
  "der", "die", "das", "ein", "eine", "einen", "einem", "einer", "und", "oder", "ist", "sind",
  "zu", "den", "dem", "des", "in", "im", "mit", "für", "auf", "an", "am", "ich", "du", "er",
  "sie", "es", "wir", "ihr", "nicht", "sich", "auch", "als", "wie",
  // French
  "le", "la", "les", "un", "une", "des", "de", "du", "d", "et", "ou", "est", "sont", "à", "en",
  "que", "qui", "ce", "cette", "il", "elle", "je", "tu", "nous", "vous", "ils", "dans", "pour",
  "sur", "avec", "ne", "pas", "se", "son", "sa", "ses", "au", "aux", "l",
  // English
  "the", "a", "an", "is", "are", "and", "or", "to", "of", "on", "with", "for",
]);

const SURROUNDING_PUNCT = /^[.,;:!?"'»«()[\]]+|[.,;:!?"'»«()[\]]+$/gu;

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(SURROUNDING_PUNCT, "");
}

export class DefaultTextSimilarity implements TextSimilarity {
  contentTokens(text: string, options: SimilarityOptions = {}): string[] {
    const stop = options.stopwords ? new Set(options.stopwords) : DEFAULT_STOPWORDS;
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of text.split(/\s+/)) {
      const token = normalizeToken(raw);
      if (token.length === 0 || stop.has(token) || seen.has(token)) continue;
      seen.add(token);
      result.push(token);
    }
    return result;
  }

  overlap(reference: string, candidate: string, options: SimilarityOptions = {}): OverlapResult {
    const ref = this.contentTokens(reference, options);
    const cand = this.contentTokens(candidate, options);
    const candSet = new Set(cand);
    const refSet = new Set(ref);
    const matched = ref.filter((token) => candSet.has(token));
    const missing = ref.filter((token) => !candSet.has(token));
    const extra = cand.filter((token) => !refSet.has(token));
    const unionSize = new Set([...ref, ...cand]).size;
    return {
      matched,
      missing,
      extra,
      coverage: ref.length === 0 ? 1 : matched.length / ref.length,
      jaccard: unionSize === 0 ? 1 : matched.length / unionSize,
    };
  }
}
