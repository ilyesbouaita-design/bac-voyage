import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "uebersetzung" exercise: translate a German sentence. The objective is
 * MEANING, judged by the Meaning skill against the teacher's accepted
 * translations (already in the data model). Per the BAC rule, the score is full
 * points minus 0.25 per meaning error — the Meaning skill computes that partial
 * award directly, so the scoring policy is plain "sum".
 *
 * Because meaning is fuzzy offline, the profile sets manualReviewBelowConfidence
 * so SemanticStrategy defers low-confidence (possible-paraphrase) answers to
 * human review while still returning a suggested score.
 *
 * The reference is a TranslationReference, e.g.
 * { german_sentence: "Der Hund ist groß.", accepted_translations: ["Le chien est grand"] }.
 */
export const uebersetzungProfile: EvaluationProfile = {
  exerciseType: "uebersetzung",
  objective: "translation.meaning",
  strategy: "semantic",
  examSystem: "bac",
  scoring: "sum",
  manualReviewBelowConfidence: 0.6,
  skills: [
    {
      skill: "Meaning",
      points: 1,
      config: { acceptedField: "accepted_translations", penaltyPerError: 0.25 },
    },
  ],
};
