import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_tempus" / Futur (Futur I): transform a sentence into
 * "werden (conjugated) + infinitive". Unlike Perfekt/Passiv, the main verb
 * appears as an INFINITIVE, not a participle — so this profile pairs the
 * reusable AuxiliaryVerb and Conjugation skills (already used by
 * tempus.perfekt, passiv.präsens, and modalverb.standard) with a NEW
 * skill, Infinitive, which is the genuinely new linguistic objective this
 * tense introduces: is the correct main-verb INFINITIVE present?
 *
 * VerbLemma is NOT enabled: Infinitive already catches a wrong-verb
 * substitution as a side effect (a different verb's infinitive is a
 * different string) — the same reasoning PartizipII provides for Perfekt/
 * Passiv, just via a different form.
 *
 * Scoring is "sum" with its own exact points (AuxiliaryVerb 0.3, Conjugation
 * 0.3, Infinitive 0.4) — one example distribution, not a standard. Compare
 * with tempus.perfekt's (0.25 / 0.25 / 0.5, a different skill triplet) and
 * passiv.präsens's (0.5 / 0.3 / 0.2): no shared formula is assumed anywhere in
 * this family.
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_tempus", profileKey:
 * "tempus.futur", answer, reference }).
 */
export const tempusFuturProfile: EvaluationProfile = {
  exerciseType: "tempus.futur",
  objective: "grammar.tense.transform",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "AuxiliaryVerb", points: 0.3 },
    { skill: "Conjugation", points: 0.3 },
    { skill: "Infinitive", points: 0.4 },
  ],
};
