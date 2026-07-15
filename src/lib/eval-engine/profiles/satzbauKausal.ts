import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_satzbau" / Kausalsatz: combine two sentences into one using
 * a REASON subordinate clause with "weil" (because) — "da" is an accepted
 * alternative connector for the same relationship. Part of the
 * conjunction-based Satzbau family; see satzbau.final for the full reasoning
 * on why NO new skill was needed (VerbPosition and Comma are
 * conjunction-agnostic) and why the scoring is uniform across this family
 * (a documented BAC rule, not an architectural assumption).
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_satzbau", profileKey:
 * "satzbau.kausal", answer, reference }).
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Weil ich müde war, ging ich früh ins Bett.", answerKey: { subordinateFinal: "war" } }.
 */
export const satzbauKausalProfile: EvaluationProfile = {
  exerciseType: "satzbau.kausal",
  objective: "grammar.clause.combine",
  strategy: "structural",
  examSystem: "bac",
  scoring: "deduction",
  skills: [
    { skill: "VerbPosition", points: 0.25 },
    { skill: "Comma", points: 0.25 },
  ],
};
