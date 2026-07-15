import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_tempus" / Präsens: transform (or produce) a sentence in the
 * present tense. Präsens is a SYNTHETIC tense in German — there is no
 * auxiliary; the main verb itself carries the finite, subject-agreeing form
 * (e.g. "spiele" for "ich"). The objective is therefore just that ONE finite
 * form, so the profile enables only Conjugation.
 *
 * Conjugation catches a wrong-verb substitution as a side effect (a different
 * verb's finite form will differ from the expected one), so VerbLemma is not
 * needed here either — the same reasoning as tempus.perfekt, just via a
 * different skill.
 *
 * The reference's answerKey.finite MUST be annotated explicitly (e.g.
 * "spiele") — unlike Perfekt/Passiv, there is no auxiliary for the derivation
 * fallback in resolveVerbKey to anchor on, so nothing can be derived from the
 * correct-answer text alone for this tense.
 *
 * Scoring is "sum"; with a single skill enabled, the points value below (1)
 * is simply the exercise's total mark — still an explicit, profile-owned
 * choice, not an engine assumption.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_tempus", profileKey:
 * "tempus.präsens", answer, reference }).
 */
export const tempusPraesensProfile: EvaluationProfile = {
  exerciseType: "tempus.präsens",
  objective: "grammar.tense.transform",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [{ skill: "Conjugation", points: 1 }],
};
