import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_konnektoren": fill the gap(s) in a given sentence with the
 * correct connector — a single word (e.g. "trotzdem") or a two-part sequence
 * (e.g. "um" ... "zu"). Unlike Satzbau, the surrounding sentence structure is
 * fixed by the question (text_with_gaps); the student only supplies the
 * connector word(s), so this uses ExactStrategy — a deterministic sequence
 * comparison, not clause-boundary detection. StructuralAnalyzer is not
 * needed: there is no free-form sentence to locate a clause within.
 *
 * ONE new skill (Connector) was needed. ZuPlacement and Infinitive were
 * considered (per the earlier catalogue) and are NOT included: the exercise
 * format gives the student no freedom to misplace "zu" or the infinitive —
 * their positions are already fixed by the question's own gap structure, so
 * there is nothing for either skill to check here.
 *
 * No sub-typing / profileKey indirection: unlike Tempus/Passiv/Satzbau,
 * grammatik_konnektoren has no catalogued sub-types, so it is registered
 * directly under its own exerciseType — the same pattern already used by
 * synonym, kombinieren, and richtig_falsch_zitat.
 *
 * The compound answer carries one part, "connectors": an ordered string[],
 * one entry per gap, e.g. compoundAnswer({ connectors: ["um", "zu"] }).
 *
 * Scoring is "sum"; with a single skill enabled, the point value below (1)
 * is the exercise's total mark — an explicit, profile-owned choice, not an
 * engine assumption.
 */
export const konnektorenProfile: EvaluationProfile = {
  exerciseType: "grammatik_konnektoren",
  objective: "grammar.connector.choose",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [{ skill: "Connector", points: 1 }],
};
