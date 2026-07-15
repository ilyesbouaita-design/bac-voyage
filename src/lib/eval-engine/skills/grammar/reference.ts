import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";
import type { GermanLinguistics } from "../../core/utilities.ts";

/**
 * Optional teacher-authored answer key for a grammar question. When present,
 * skills use it directly (deterministic, no guessing). When absent, skills
 * derive what they can from the correct answer via the linguistic utilities —
 * annotation is recommended for reliability.
 */
export interface VerbAnswerKey {
  /** Expected finite auxiliary or modal form, e.g. "habe", "wird", "muss". */
  auxiliary?: string;
  /** Auxiliary/modal lemma, e.g. "haben", "sein", "werden", "müssen". */
  auxiliaryLemma?: string;
  /** Expected finite verb form (person-carrying). Often equals `auxiliary`. */
  finite?: string;
  /** Expected Partizip II, e.g. "gespielt". */
  partizip?: string;
  /** Expected main-verb lemma, e.g. "spielen". */
  verbLemma?: string;
  /** Subject, e.g. "ich" (context for feedback). */
  subject?: string;
  /** Expected clause-final verb of the subordinate clause (Satzbau). */
  subordinateFinal?: string;
  /** Expected relative pronoun form, e.g. "den" (Satzbau / Relativsatz). */
  relativePronoun?: string;
  /** Expected interrogative, e.g. "wo" (Fragen stellen). */
  questionWord?: string;
}

/** The question reference (EvaluationInput.reference) for grammar exercises. */
export interface GrammarReference {
  correctAnswer: string;
  alternatives?: string[];
  answerKey?: VerbAnswerKey;
}

/** Expected verb facts, resolved from annotation and/or derived from the correct answer. */
export interface ResolvedVerbKey {
  auxiliaryForm?: string;
  auxiliaryLemma?: string;
  finiteForm?: string;
  partizip?: string;
  verbLemma?: string;
  verbStem?: string;
  source: "annotated" | "derived";
}

/** Validate that the reference is a GrammarReference; fail fast otherwise. */
export function asGrammarReference(expected: unknown, skill: string): GrammarReference {
  if (
    expected !== null &&
    typeof expected === "object" &&
    typeof (expected as { correctAnswer?: unknown }).correctAnswer === "string"
  ) {
    return expected as GrammarReference;
  }
  throw new Error(
    `${skill}: the question reference must be a GrammarReference with a string "correctAnswer" ` +
      `(and optionally an answerKey), supplied in EvaluationInput.reference.`,
  );
}

/** Resolve the expected verb facts, preferring annotation, falling back to derivation. */
export function resolveVerbKey(
  expected: unknown,
  german: GermanLinguistics,
  skill: string,
): ResolvedVerbKey {
  const ref = asGrammarReference(expected, skill);
  const key = ref.answerKey ?? {};

  const tokens = german.tokenize(ref.correctAnswer);
  const derivedFinite = german.findFiniteVerb(tokens);
  const derivedPartizip = tokens.find((token) => german.isPartizipII(token));

  const partizip = key.partizip ?? derivedPartizip;
  const verbStem =
    key.verbLemma !== undefined
      ? german.stem(key.verbLemma)
      : partizip !== undefined
        ? german.stem(partizip)
        : undefined;

  return {
    auxiliaryForm: key.auxiliary ?? derivedFinite?.token,
    auxiliaryLemma: key.auxiliaryLemma ?? derivedFinite?.lemma,
    finiteForm: key.finite ?? key.auxiliary ?? derivedFinite?.token,
    partizip,
    verbLemma: key.verbLemma,
    verbStem,
    source: ref.answerKey ? "annotated" : "derived",
  };
}

/** Build a one-item SkillResult with a single structured feedback entry. */
export function grammarResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params);
}
