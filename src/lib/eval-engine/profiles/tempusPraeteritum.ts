import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_tempus" / Präteritum: transform (or produce) a sentence in
 * the simple past. Like Präsens, Präteritum is SYNTHETIC — no auxiliary; the
 * main verb itself carries the finite, subject-agreeing past form (e.g.
 * "spielte" for "ich"). The objective is that ONE finite form, so the profile
 * enables only Conjugation — the same skill, same reasoning as tempus.präsens,
 * just checking a different expected form.
 *
 * VerbLemma is not needed: Conjugation catches a wrong-verb substitution as a
 * side effect (a different verb's Präteritum form will differ from the
 * expected one).
 *
 * The reference's answerKey.finite MUST be annotated explicitly (e.g.
 * "spielte") — there is no auxiliary for resolveVerbKey's derivation fallback
 * to anchor on for this tense.
 *
 * Scoring is "sum"; with a single skill enabled, the points value below (1)
 * is simply the exercise's total mark.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_tempus", profileKey:
 * "tempus.präteritum", answer, reference }).
 */
export const tempusPraeteritumProfile: EvaluationProfile = {
  exerciseType: "tempus.präteritum",
  objective: "grammar.tense.transform",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [{ skill: "Conjugation", points: 1 }],
};
