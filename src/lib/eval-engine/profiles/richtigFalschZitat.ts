import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "richtig_falsch_zitat" (Richtig/Falsch mit Zitat) — the first exercise of
 * the Textverständnis section. For each statement the learner decides
 * richtig/falsch AND quotes the justifying sentence from the passage.
 *
 * Per the BAC rule, each statement is 0.5 for the choice plus 0.5 for the Zitat,
 * so this profile composes two single-responsibility skills under ExactStrategy
 * with sum scoring. Both aspects are deterministic, so no manual gate is needed.
 *
 * A profile belongs to an exercise TYPE and is evaluated PER STATEMENT: the
 * engine returns one result per statement and the caller sums them (see
 * evaluateExercise). The compound per-statement answer is the typed
 * { choice, zitat }, and the reference is a RichtigFalschReference
 * { is_richtig, zitat, accepted_zitate? }.
 */
export const richtigFalschZitatProfile: EvaluationProfile = {
  exerciseType: "richtig_falsch_zitat",
  objective: "reading.richtig_falsch_zitat",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "RichtigFalsch", points: 0.5 },
    { skill: "Zitat", points: 0.5 },
  ],
};
