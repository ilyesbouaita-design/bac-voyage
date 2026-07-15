import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_aktiv_passiv" / Präteritum: transform between Aktiv and
 * Passiv (werden + Partizip II) in the simple past. This completes the
 * Passiv family alongside passiv.präsens, following the exact same
 * profileKey convention.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_aktiv_passiv", profileKey:
 * "passiv.präteritum", answer, reference }).
 *
 * NO NEW SKILL was needed. Before writing any code, the existing
 * AuxiliaryVerb, PartizipII, and Conjugation skills were verified against
 * this tense:
 * - AuxiliaryVerb only compares the aux LEMMA (werden), which is
 *   tense-independent — it already worked for Perfekt's haben/sein and
 *   Futur/Präsens-Passiv's werden with zero changes.
 * - Conjugation (generalized during the Tempus work) checks the exact
 *   expected finite TOKEN directly. The werden lexicon in the linguistics
 *   utility already includes the Präteritum forms (wurde, wurdest, wurden,
 *   wurdet) — present since the lexicon was first built, just never
 *   exercised by a test until now — so no lexicon or skill change was
 *   required either.
 * - PartizipII checks the exact participle string, which does not change
 *   between tenses (the participle is identical in Präsens-Passiv and
 *   Präteritum-Passiv; only the auxiliary's form changes).
 * See test/passivPraeteritum.unit.test.ts for a direct proof that these
 * three UNMODIFIED skills correctly judge Präteritum werden forms.
 *
 * VerbLemma is NOT enabled, for the same reason as every other profile in
 * this family: PartizipII already catches a verb substitution as a side
 * effect.
 *
 * Scoring is "sum" with ITS OWN point distribution (AuxiliaryVerb 0.3,
 * PartizipII 0.4, Conjugation 0.3) — a THIRD distinct distribution in this
 * family (compare tempus.perfekt's 0.25/0.25/0.5 and passiv.präsens's
 * 0.5/0.3/0.2), reinforcing that no shared formula exists anywhere.
 */
export const passivPraeteritumProfile: EvaluationProfile = {
  exerciseType: "passiv.präteritum",
  objective: "grammar.voice.transform",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "AuxiliaryVerb", points: 0.3 },
    { skill: "PartizipII", points: 0.4 },
    { skill: "Conjugation", points: 0.3 },
  ],
};
