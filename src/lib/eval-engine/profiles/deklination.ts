import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_deklination": fill each bracketed gap in a template with
 * the correct article/adjective ending (e.g. "D[er] groß[e] Hund" expects
 * "er" then "e"). Uses ExactStrategy: the gaps and their correct values are
 * both fully determined by the teacher's template — deterministic
 * comparison, no clause structure to locate, no StructuralAnalyzer needed.
 *
 * The template's own bracket contents ARE the expected per-gap answers, so
 * the SAME content a teacher already authors for the exercise's rendering
 * (parseDeklinationTemplate) is reused directly as this profile's ground
 * truth — no separate answer key.
 *
 * No sub-typing / profileKey indirection: the content model has no sub-type
 * discriminator, so this is registered directly under its own exerciseType
 * — the same pattern already used by synonym, kombinieren,
 * grammatik_konnektoren, and grammatik_fragen_stellen.
 *
 * The compound answer carries one part, "endings": an ordered string[], one
 * entry per gap, e.g. compoundAnswer({ endings: ["er", "e"] }).
 *
 * Scoring is "sum"; DeclensionEnding awards its own points PROPORTIONALLY
 * across gaps, so the profile's single point value (1) is simply the
 * exercise's total mark.
 */
export const deklinationProfile: EvaluationProfile = {
  exerciseType: "grammatik_deklination",
  objective: "grammar.declension.endings",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [{ skill: "DeclensionEnding", points: 1, config: { mode: "proportional" } }],
};
