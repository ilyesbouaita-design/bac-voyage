import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_aktiv_passiv" / Präsens: transform between Aktiv and Passiv
 * (werden + Partizip II) in the present tense. This is the first Passiv
 * profile migrated to the finalized profileKey convention for sub-typed
 * exercises — mirroring exactly how grammatik_tempus became tempus.perfekt:
 * the exam's outer type stays "grammatik_aktiv_passiv" (see BacQuestionType),
 * but each TENSE is its own profile, resolved via EvaluationInput.profileKey.
 *
 * Usage from a caller (e.g. the Lovable adapter):
 *   engine.evaluate({
 *     exerciseType: "grammatik_aktiv_passiv",   // the exam's outer bac_type
 *     profileKey: "passiv.präsens",             // selects THIS profile
 *     answer, reference,
 *   });
 *
 * The profile itself is registered under exerciseType "passiv.präsens" — the
 * ProfileRegistry key is always profile.exerciseType, and calling with
 * exerciseType "grammatik_aktiv_passiv" alone (no profileKey) now fails fast
 * rather than guessing a tense (see test/passivPraesens.test.ts). The sibling
 * profile for simple past (passiv.präteritum) follows the same convention, in
 * its own file.
 *
 * Evaluation logic and scoring are UNCHANGED from the prior
 * grammatik_aktiv_passiv profile — this migration is structural only (profile
 * identity/registration), not a change to skills or points.
 *
 * The objective is the VERB CHANGE, so this profile enables the SAME verb
 * skills as tempus.perfekt (AuxiliaryVerb, PartizipII, Conjugation) — a new
 * exercise type reusing existing skills, with no engine or skill change.
 * VerbLemma is NOT enabled, for the same reason as Tempus: the verb is given
 * by the base sentence, and PartizipII already catches a verb substitution as
 * a side effect.
 *
 * Scoring is "sum" with its OWN point distribution (AuxiliaryVerb 0.5,
 * PartizipII 0.3, Conjugation 0.2) — deliberately DIFFERENT from tempus.
 * perfekt's default (0.25 / 0.25 / 0.5), even though the two profiles share
 * identical skills. This is intentional: there is no standard weighting tied
 * to "verb transformation" as a category. See test/passivPraesens.test.ts for
 * a direct assertion that these two profiles' points genuinely differ.
 */
export const passivPraesensProfile: EvaluationProfile = {
  exerciseType: "passiv.präsens",
  objective: "grammar.voice.transform",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "AuxiliaryVerb", points: 0.5 },
    { skill: "PartizipII", points: 0.3 },
    { skill: "Conjugation", points: 0.2 },
  ],
};
