import type {
  Clause,
  ClauseBoundary,
  ClauseTrigger,
  ClauseTriggerRecognizer,
  SentenceStructure,
  StructuralAnalyzer,
} from "../core/utilities.ts";

const SURROUNDING_PUNCT = /^[.,;:!?"'»«()[\]]+|[.,;:!?"'»«()[\]]+$/gu;

// Subordinating conjunctions — send the finite verb to the clause end. Any of
// these can legitimately open a sentence (a fronted subordinate clause).
const CONJUNCTIONS = new Set<string>([
  "als", "wenn", "weil", "dass", "ob", "obwohl", "obgleich", "während",
  "nachdem", "bevor", "sobald", "seit", "seitdem", "bis", "solange", "ehe",
  "da", "falls", "sofern", "damit", "sodass", "indem", "sooft", "sowie",
]);

// Relative pronoun forms. Unlike conjunctions, these can NEVER open a
// sentence as a relative-clause trigger — a relative clause always needs an
// antecedent before it. "der/die/das" collide lexically with the definite
// article, which is exactly why canStartSentence must be false here.
const RELATIVE_PRONOUNS = new Set<string>([
  "der", "die", "das", "den", "dem", "deren", "dessen",
  "welcher", "welche", "welches", "welchen", "welchem",
]);

function tokenizeWithCommas(sentence: string): { words: string[]; commaAfter: boolean[] } {
  const words: string[] = [];
  const commaAfter: boolean[] = [];
  for (const raw of sentence.split(/\s+/)) {
    if (raw.length === 0) continue;
    const hasComma = raw.includes(",");
    const word = raw.replace(SURROUNDING_PUNCT, "");
    if (word.length === 0) continue;
    words.push(word);
    commaAfter.push(hasComma);
  }
  return { words, commaAfter };
}

function buildSentenceStructure(clauses: Clause[], boundaries: ClauseBoundary[]): SentenceStructure {
  return {
    clauses,
    boundaries,
    findSubordinateClause(kind?: string): Clause | undefined {
      return clauses.find((c) => c.role === "subordinate" && (kind === undefined || c.trigger?.kind === kind));
    },
  };
}

/**
 * Default, offline StructuralAnalyzer. Ships with "conjunction" and
 * "relativePronoun" trigger recognizers pre-registered; more can be added via
 * registerTrigger without changing this file (e.g. a future zu-infinitive
 * marker for Konnektoren). Pure structural analysis: it locates clauses and
 * what introduced them, and never judges correctness — that is always the
 * consuming skill's job.
 */
export class DefaultStructuralAnalyzer implements StructuralAnalyzer {
  private readonly recognizers: ClauseTriggerRecognizer[] = [];

  constructor() {
    this.registerTrigger({
      kind: "conjunction",
      canStartSentence: true,
      recognize: (token) => CONJUNCTIONS.has(token.toLowerCase()),
    });
    this.registerTrigger({
      kind: "relativePronoun",
      canStartSentence: false,
      recognize: (token) => RELATIVE_PRONOUNS.has(token.toLowerCase()),
    });
  }

  registerTrigger(recognizer: ClauseTriggerRecognizer): void {
    this.recognizers.push(recognizer);
  }

  /**
   * Finds the trigger that introduces a subordinate clause.
   *
   * Prefers a candidate immediately preceded by a comma over one that isn't,
   * falling back to the first lexical match anywhere only when no
   * comma-adjacent candidate exists. This disambiguates a relative pronoun
   * from an identically-spelled definite article earlier in the sentence —
   * e.g. "Er besucht die Frau, die schön ist.": the ARTICLE "die" (index 2,
   * before the comma) must lose to the real relative pronoun "die" (index 4,
   * immediately after the comma). A non-fronted clause trigger in this
   * exercise family always immediately follows a comma, so preferring that
   * position is a general rule, not a per-recognizer special case.
   *
   * The fallback preserves two existing, deliberately-tested behaviors: a
   * fronted trigger at index 0 (no comma precedes the very first word), and a
   * clause whose REQUIRED comma the student omitted (the trigger must still
   * be found so Comma can correctly report it missing, rather than the clause
   * silently vanishing).
   */
  private findTrigger(words: readonly string[], commaAfter: readonly boolean[]): ClauseTrigger | undefined {
    const commaAdjacent = this.scanForTrigger(words, (i) => i > 0 && commaAfter[i - 1] === true);
    if (commaAdjacent) return commaAdjacent;
    return this.scanForTrigger(words, () => true);
  }

  private scanForTrigger(
    words: readonly string[],
    eligible: (index: number) => boolean,
  ): ClauseTrigger | undefined {
    for (let i = 0; i < words.length; i++) {
      if (!eligible(i)) continue;
      for (const recognizer of this.recognizers) {
        if (i === 0 && !recognizer.canStartSentence) continue;
        if (recognizer.recognize(words[i]!)) {
          return { kind: recognizer.kind, token: words[i]!, tokenIndex: i };
        }
      }
    }
    return undefined;
  }

  analyze(sentence: string): SentenceStructure {
    const { words, commaAfter } = tokenizeWithCommas(sentence);
    const trigger = this.findTrigger(words, commaAfter);

    if (!trigger) {
      return buildSentenceStructure([{ role: "main", tokens: words }], []);
    }

    const T = trigger.tokenIndex;

    // The subordinate clause ends at the next comma at or after T, or at the
    // sentence's end if no such comma exists.
    let end = words.length - 1;
    let closingCommaFound = false;
    for (let k = T; k < commaAfter.length; k++) {
      if (commaAfter[k]) {
        end = k;
        closingCommaFound = true;
        break;
      }
    }

    const clauses: Clause[] = [];
    const boundaries: ClauseBoundary[] = [];

    if (T > 0) {
      clauses.push({ role: "main", tokens: words.slice(0, T) });
      boundaries.push({ index: clauses.length - 1, hasComma: commaAfter[T - 1] === true });
    }

    clauses.push({ role: "subordinate", tokens: words.slice(T, end + 1), trigger });

    if (end < words.length - 1) {
      boundaries.push({ index: clauses.length - 1, hasComma: closingCommaFound });
      clauses.push({ role: "main", tokens: words.slice(end + 1) });
    }
    // else: if T === 0 and no closing comma was found, the whole sentence is
    // swallowed into the subordinate clause above — a degraded case (fronted
    // trigger, no comma anywhere) preserving the pre-analyzer behavior: no
    // distinct main clause, no boundaries.

    return buildSentenceStructure(clauses, boundaries);
  }
}
