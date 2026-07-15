import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_tempus" / Perfekt: transform a sentence into the Perfekt
 * tense. This is the first profile migrated to the finalized profileKey
 * convention for sub-typed exercises: the exam's outer type stays
 * "grammatik_tempus" (see BacQuestionType), but each TENSE is its own
 * profile, resolved via EvaluationInput.profileKey rather than crammed into
 * one mega-profile with internal branching.
 *
 * Usage from a caller (e.g. the Lovable adapter):
 *   engine.evaluate({
 *     exerciseType: "grammatik_tempus",   // the exam's outer bac_type
 *     profileKey: "tempus.perfekt",       // selects THIS profile (derived
 *                                         // from the question's `tense` field)
 *     answer, reference,
 *   });
 *
 * The profile itself is registered under exerciseType "tempus.perfekt" — the
 * ProfileRegistry key is always profile.exerciseType, and calling with
 * exerciseType "grammatik_tempus" alone (no profileKey) now fails fast rather
 * than guessing a tense (see test/tempusPerfekt.test.ts). Sibling profiles for
 * the other tenses (tempus.präteritum, tempus.präsens, tempus.futur) follow
 * the same convention, each in its own file.
 *
 * Evaluation logic is UNCHANGED from the prior grammatik_tempus profile — this
 * migration is structural only (profile identity/registration), not a change
 * to skills, scoring, or points.
 *
 * The objective is the VERB CHANGE, so the profile enables only verb skills —
 * spelling, capitalization, and punctuation of the rest of the sentence are
 * ignored by construction. VerbLemma is NOT enabled: the base sentence already
 * supplies the verb, and PartizipII already catches a wrong-verb substitution
 * as a side effect (a different verb almost always produces a different
 * participle string) — contrast modalverb.standard, which keeps VerbLemma
 * for a documented reason.
 *
 * Scoring is "sum" with EXACT, teacher-set points per skill — NOT a standard
 * or recommended distribution. The values below (AuxiliaryVerb 0.25,
 * PartizipII 0.25, Conjugation 0.5) are ONE example; see
 * test/scoringFlexibility.test.ts for a different, equally valid distribution
 * over the same skills.
 *
 * The question reference (EvaluationInput.reference) is a GrammarReference, e.g.
 * { correctAnswer, answerKey: { auxiliary, auxiliaryLemma, finite, partizip } }.
 */
export const tempusPerfektProfile: EvaluationProfile = {
  exerciseType: "tempus.perfekt",
  objective: "grammar.tense.transform",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "AuxiliaryVerb", points: 0.25 },
    { skill: "PartizipII", points: 0.25 },
    { skill: "Conjugation", points: 0.5 },
  ],
};
