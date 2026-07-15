import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_satzbau" / Konzessivsatz: combine two sentences into one
 * using a CONCESSION subordinate clause with "obwohl" (although) — "obgleich"
 * is an accepted alternative connector for the same relationship. Part of
 * the conjunction-based Satzbau family; see satzbau.final for the full
 * reasoning on skill reuse and uniform scoring.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_satzbau", profileKey:
 * "satzbau.konzessiv", answer, reference }).
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Er ging joggen, obwohl es regnete.", answerKey: { subordinateFinal: "regnete" } }.
 */
export const satzbauKonzessivProfile: EvaluationProfile = {
  exerciseType: "satzbau.konzessiv",
  objective: "grammar.clause.combine",
  strategy: "structural",
  examSystem: "bac",
  scoring: "deduction",
  skills: [
    { skill: "VerbPosition", points: 0.25 },
    { skill: "Comma", points: 0.25 },
  ],
};
