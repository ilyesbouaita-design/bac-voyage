import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_satzbau" / Konditionalsatz: combine two sentences into one
 * using a CONDITION subordinate clause with "falls" (if/in case). "falls" is
 * used here rather than "wenn" specifically to avoid ambiguity with
 * Temporalsatz — "wenn" can mean either "when" (temporal) or "if"
 * (conditional) in German, while "falls" is unambiguously conditional. Part
 * of the conjunction-based Satzbau family; see satzbau.final for the full
 * reasoning on skill reuse and uniform scoring.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_satzbau", profileKey:
 * "satzbau.konditional", answer, reference }).
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Ich rufe dich an, falls ich Zeit habe.", answerKey: { subordinateFinal: "habe" } }.
 */
export const satzbauKonditionalProfile: EvaluationProfile = {
  exerciseType: "satzbau.konditional",
  objective: "grammar.clause.combine",
  strategy: "structural",
  examSystem: "bac",
  scoring: "deduction",
  skills: [
    { skill: "VerbPosition", points: 0.25 },
    { skill: "Comma", points: 0.25 },
  ],
};
