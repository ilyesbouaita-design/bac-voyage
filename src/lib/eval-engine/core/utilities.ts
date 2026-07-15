/**
 * Utility CONTRACTS live in the core so every outer layer depends only inward.
 * Concrete implementations live in `../utilities` and are injected into skills.
 *
 * These helpers are language helpers, NOT grammar rules. A skill decides IF and
 * HOW to use them, honoring its objective (e.g. a Tempus skill only ever asks
 * about the verb, so everything else is ignored for that exercise).
 */

export interface NormalizeOptions {
  /** Trim leading/trailing whitespace. Default: true. */
  trim?: boolean;
  /** Collapse internal whitespace runs to a single space. Default: true. */
  collapseWhitespace?: boolean;
  /** Lowercase the whole string. Default: false. */
  toLowerCase?: boolean;
  /** Remove trailing sentence punctuation ( . ! ? ; : , ). Default: false. */
  stripTrailingPunctuation?: boolean;
}

export interface Normalizer {
  normalize(input: string, options?: NormalizeOptions): string;
}

/** The result of a closestMatch() lookup — the nearest candidate and how close it is. */
export interface FuzzyMatch {
  /** The candidate closest to the compared value. */
  readonly candidate: string;
  /** Damerau-Levenshtein edit distance to that candidate (0 = identical). */
  readonly distance: number;
  /** 1 - distance / max(len(value), len(candidate)). 1.0 = identical, 0.0 = completely different. */
  readonly similarity: number;
}

export interface Matcher {
  equals(a: string, b: string): boolean;
  equalsAny(value: string, candidates: readonly string[]): boolean;
  /**
   * The single closest candidate to `value`, by Damerau-Levenshtein distance
   * (which — unlike plain Levenshtein — counts an adjacent-character
   * transposition, e.g. "hte" for "the", as ONE edit rather than two, the
   * most common real typo shape). Returns undefined only when `candidates`
   * is empty. Ties resolve to whichever candidate was found first.
   *
   * Migration Plan Phase 7: this is the native equivalent of
   * grading-engine-v2's Damerau-Levenshtein typo tolerance, ported as a
   * genuinely reusable Matcher capability rather than duplicated inline
   * logic. A skill decides whether and how to use it (see ExactMatchSkill's
   * opt-in `fuzzy` config) — the Matcher itself never decides what counts
   * as "close enough," it only measures.
   */
  closestMatch(value: string, candidates: readonly string[]): FuzzyMatch | undefined;
}

/** Auxiliary verb lemmas relevant to Perfekt and Passiv. */
export type AuxiliaryLemma = "haben" | "sein" | "werden";

/** A finite verb located in a sentence (either an auxiliary or a modal). */
export interface FiniteVerbHit {
  readonly token: string;
  readonly lemma: string;
  readonly kind: "auxiliary" | "modal";
}

/**
 * German-specific linguistic helpers, living at the bottom of the stack and
 * injected into skills. They locate and classify tokens; they are deliberately
 * small and heuristic. Skills prefer an explicit teacher answer key and use
 * these for detection in the learner's text and as a derivation fallback.
 */
export interface GermanLinguistics {
  /** Split into words, stripping surrounding punctuation, preserving case. */
  tokenize(sentence: string): string[];
  /** Map a finite form to its auxiliary lemma, if it is one. */
  classifyAuxiliary(token: string): AuxiliaryLemma | undefined;
  /** Map a finite form to its modal lemma, if it is one. */
  classifyModal(token: string): string | undefined;
  /** The first auxiliary or modal token in a token list. */
  findFiniteVerb(tokens: readonly string[]): FiniteVerbHit | undefined;
  /** Heuristic: does this token look like a Partizip II? */
  isPartizipII(token: string): boolean;
  /** A crude stem, for weak-verb lemma matching. */
  stem(word: string): string;
  /**
   * ASCII-transliterate German umlauts and eszett: ä/Ä -> ae/Ae, ö/Ö -> oe/Oe,
   * ü/Ü -> ue/Ue, ß -> ss. Case-preserving, everything else passed through
   * unchanged.
   *
   * Migration Plan Phase 2: the native equivalent of grading-engine-v2's
   * ACCEPT_UMLAUT_ALTERNATIVE tolerance rule (confirmed during the Phase 2
   * regression analysis to be one of its default-active normalization
   * rules, not a scored/partial-credit mechanism) — a student who cannot
   * easily type ä/ö/ü/ß is not making a spelling MISTAKE, so a skill that
   * opts into this treats the ASCII form as fully equivalent, not a typo
   * earning partial credit (that is what Matcher.closestMatch/fuzzy
   * tolerance is for instead). A skill decides whether and how to apply
   * this — it is never applied implicitly.
   */
  normalizeUmlauts(word: string): string;
}

/** Options for content-overlap similarity. */
export interface SimilarityOptions {
  /** Tokens to ignore as non-content (function words). */
  stopwords?: readonly string[];
}

/** The result of comparing reference content against candidate content. */
export interface OverlapResult {
  matched: string[];
  missing: string[];
  extra: string[];
  /** matched / reference-content-count, 0..1 (1 when the reference has no content tokens). */
  coverage: number;
  /** Jaccard index over content tokens, 0..1. */
  jaccard: number;
}

/**
 * Generic, language-independent content-overlap helpers. This is NOT semantic
 * AI: it measures shared content words, nothing more. Meaning-level fuzziness
 * is handled by the semantic skills that deliberately defer uncertain cases.
 */
export interface TextSimilarity {
  contentTokens(text: string, options?: SimilarityOptions): string[];
  overlap(reference: string, candidate: string, options?: SimilarityOptions): OverlapResult;
}

/** A target meaning to check the learner's answer against. */
export interface MeaningTarget {
  /** The information/answer to look for (in the answer's language). */
  readonly text: string;
  /** Supporting keywords: evidence that RAISES confidence — never a hard gate. */
  readonly keywords?: readonly string[];
}

/** Optional context for a meaning judgment. */
export interface MeaningContext {
  /** Model answer(s) for the question (whole-answer context, esp. for AI judges). */
  readonly modelAnswers?: readonly string[];
  /** The reading passage, for context-aware judges. */
  readonly passage?: string;
}

/** A meaning judgment: is the target expressed, and how sure are we? */
export interface MeaningVerdict {
  /** Best judgment: does the candidate express the target meaning? */
  readonly expressed: boolean;
  /** 0..1 certainty of the judgment. Low confidence should be deferred to a human. */
  readonly confidence: number;
  /** Optional matched terms/keywords, for transparency. */
  readonly evidence?: readonly string[];
}

/**
 * Judges whether a candidate answer EXPRESSES a target meaning, wording aside.
 * This is the seam that makes comprehension grading meaning-based rather than
 * keyword-based. The DEFAULT implementation is deterministic and offline: it
 * confirms strong evidence and abstains (low confidence) otherwise, so a
 * differently-worded answer is deferred to a human, never marked wrong. A host
 * (e.g. Lovable) can inject an AI-backed judge without touching the engine,
 * strategies, profiles, or skills.
 */
export interface MeaningJudge {
  judge(candidate: string, target: MeaningTarget, context?: MeaningContext): MeaningVerdict;
}

/**
 * An extensible category of word/phrase that can introduce a subordinate
 * clause (a conjunction, a relative pronoun, or any future registered kind).
 */
export interface ClauseTriggerRecognizer {
  /** Stable id for this category, e.g. "conjunction", "relativePronoun". */
  readonly kind: string;
  /**
   * Can this trigger legitimately be the sentence's very first token (e.g. a
   * fronted conjunction)? False for relative pronouns, which always need a
   * preceding antecedent and can never open a sentence.
   */
  readonly canStartSentence: boolean;
  /** Pure lexical check: does this exact token belong to this category? */
  recognize(token: string): boolean;
}

/** The specific trigger that introduced a subordinate clause. */
export interface ClauseTrigger {
  readonly kind: string;
  readonly token: string;
  /** Index within the FULL sentence's token list. */
  readonly tokenIndex: number;
}

/** One clause (main or subordinate) within a sentence. */
export interface Clause {
  readonly role: "main" | "subordinate";
  /** This clause's own tokens, in order (trigger token included, for subordinate clauses). */
  readonly tokens: readonly string[];
  /** Present only when role === "subordinate". */
  readonly trigger?: ClauseTrigger;
}

/** A comma boundary between two consecutive clauses. */
export interface ClauseBoundary {
  /** Sits between clauses[index] and clauses[index + 1]. */
  readonly index: number;
  readonly hasComma: boolean;
}

/** The structural analysis of one sentence: its clauses and the boundaries between them. */
export interface SentenceStructure {
  readonly clauses: readonly Clause[];
  readonly boundaries: readonly ClauseBoundary[];
  /** The first subordinate clause, optionally filtered to a specific trigger kind. */
  findSubordinateClause(kind?: string): Clause | undefined;
}

/**
 * Detects clause boundaries and what introduces each subordinate clause.
 * Pure structural analysis: it locates clauses and their triggers, and NEVER
 * judges correctness (that stays in the skills that consume it). New trigger
 * kinds are added via registerTrigger — no analyzer code change needed, the
 * same registry-style extensibility used for Skills/Strategies/Profiles.
 */
export interface StructuralAnalyzer {
  registerTrigger(recognizer: ClauseTriggerRecognizer): void;
  analyze(sentence: string): SentenceStructure;
}

/** The bundle of utilities injected into every skill. */
export interface SkillUtilities {
  readonly normalizer: Normalizer;
  readonly matcher: Matcher;
  readonly german: GermanLinguistics;
  readonly similarity: TextSimilarity;
  readonly meaningJudge: MeaningJudge;
  readonly structuralAnalyzer: StructuralAnalyzer;
}
