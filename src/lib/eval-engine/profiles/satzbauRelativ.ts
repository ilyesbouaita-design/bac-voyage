import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_satzbau" / Relativsatz: combine two sentences into one using
 * a relative clause (e.g. "Der Mann, den ich kenne, wohnt hier."). This is
 * the first Satzbau sub-type built on StructuralAnalyzer's "relativePronoun"
 * trigger — the first genuinely new linguistic objective in the Satzbau
 * family (pronoun-antecedent agreement), unlike temporal/final/kausal/
 * konditional/konzessiv, which are all conjunction-based and share one shape.
 *
 * VerbPosition and Comma are reused UNMODIFIED:
 * - VerbPosition's default acceptedTriggerKinds already includes
 *   "relativePronoun" (anticipated during its StructuralAnalyzer migration),
 *   so it already checks the relative clause's own verb-final position.
 * - Comma already requires EVERY clause boundary to have a comma, which for
 *   a mid-sentence relative clause (main, subordinate, main — two
 *   boundaries) already correctly requires commas on BOTH sides of the
 *   embedded clause.
 * Neither needed a single code change for this profile.
 *
 * VerbLemma and Conjugation are deliberately NOT enabled: VerbPosition's
 * clause-final comparison already catches a wrong verb in the relative
 * clause as a side effect, the same reasoning already relied on for every
 * other conjunction-based Satzbau profile.
 *
 * Scoring is "deduction" with the same 0.25-per-aspect unit used by every
 * other Satzbau profile — the total is 0.75 (not 0.5) simply because this
 * exercise has one more checkable aspect (pronoun agreement) than the
 * conjunction-based clause types, not because a different unit was invented.
 *
 * Known heuristic limitation (disclosed, not fixed here): if a mid-sentence
 * relative clause's CLOSING comma specifically is missing, the analyzer's
 * clause spans to the sentence end and only one boundary is computed instead
 * of two — which can under-count how many commas were truly required. A
 * missing OPENING comma is unaffected (verified, tested). Not addressed in
 * this pass; flagged for a future analyzer refinement if it proves material.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_satzbau", profileKey:
 * "satzbau.relativ", answer, reference }).
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Der Mann, den ich kenne, wohnt hier.", answerKey: { relativePronoun: "den", subordinateFinal: "kenne" } }.
 */
export const satzbauRelativProfile: EvaluationProfile = {
  exerciseType: "satzbau.relativ",
  objective: "grammar.clause.combine",
  strategy: "structural",
  examSystem: "bac",
  scoring: "deduction",
  skills: [
    { skill: "RelativePronoun", points: 0.25 },
    { skill: "VerbPosition", points: 0.25 },
    { skill: "Comma", points: 0.25 },
  ],
};
