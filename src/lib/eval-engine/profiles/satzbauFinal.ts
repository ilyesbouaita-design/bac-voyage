import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_satzbau" / Finalsatz: combine two sentences into one using a
 * PURPOSE subordinate clause with "damit" (in order that). This profile is
 * part of the conjunction-based Satzbau family (Temporalsatz, Finalsatz,
 * Kausalsatz, Konditionalsatz, Konzessivsatz), all sharing the SAME two
 * skills — VerbPosition and Comma — with NO skill or utility changes.
 *
 * NO NEW SKILL was needed, verified before writing this profile:
 * VerbPositionSkill and CommaSkill are conjunction-agnostic by construction
 * (StructuralAnalyzer's "conjunction" trigger recognizes ANY registered
 * subordinating conjunction — "damit" was already in the CONJUNCTIONS set
 * built alongside "als", "weil", "falls", "obwohl", and others — never
 * exercised by a test until now). See test/satzbauConjunctions.unit.test.ts
 * for a direct proof, and VerbPositionSkill's own doc comment for why this
 * generalizes across the whole family.
 *
 * Note on scope: "Finalsatz" can also be expressed with a "um...zu" infinitive
 * construction (no separate subject/finite verb in the purpose clause at
 * all — structurally closer to Konnektoren's zu-infinitives). This profile
 * covers ONLY the "damit" full-clause form, which is structurally identical
 * to Temporalsatz/Kausalsatz/etc. (subordinating conjunction + verb-final
 * clause). The "um...zu" form is a genuinely different structural pattern,
 * deliberately out of scope here — the same reasoning that excludes
 * Relativsatz from this pass.
 *
 * Scoring is "deduction", and the points (VerbPosition 0.25, Comma 0.25) are
 * IDENTICAL to Temporalsatz's — not because the architecture assumes a
 * standard, but because this specific split (−0.25 per aspect) is the
 * actual, documented BAC grading rule for Satzbau sentence-combination
 * exercises, uniformly across clause types. (Contrast the Tempus/Passiv verb
 * skills, where the illustrative weights deliberately vary per profile to
 * demonstrate that no standard exists there — here, uniformity IS the
 * teacher-verified fact, still expressed as explicit profile data rather
 * than an engine default.)
 *
 * Usage: engine.evaluate({ exerciseType: "grammatik_satzbau", profileKey:
 * "satzbau.final", answer, reference }).
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Ich lerne Deutsch, damit ich gute Noten bekomme.", answerKey: { subordinateFinal: "bekomme" } }.
 */
export const satzbauFinalProfile: EvaluationProfile = {
  exerciseType: "satzbau.final",
  objective: "grammar.clause.combine",
  strategy: "structural",
  examSystem: "bac",
  scoring: "deduction",
  skills: [
    { skill: "VerbPosition", points: 0.25 },
    { skill: "Comma", points: 0.25 },
  ],
};
