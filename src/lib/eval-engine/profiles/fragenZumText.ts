import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "fragen_zum_text": answer a question about the text. The BAC rule splits
 * the marks — 0.5 for the INFORMATION and 0.5 for the METHOD (a full sentence).
 *
 * The information half is MEANING-based, not keyword-based: InformationExpressed
 * asks the MeaningJudge whether each required-information point is expressed
 * (wording aside), and awards the mark PROPORTIONALLY to the points confidently
 * expressed. The profile sets the scoring model here (mode: "proportional");
 * a future exercise can set "all_or_nothing" if a teacher wants that.
 *
 * FullSentence contributes the 0.5 method mark. Scoring across the two skills is
 * "sum". Because meaning is fuzzy offline, the manual gate defers uncertain
 * answers to human review; a host may inject an AI MeaningJudge to reduce that.
 *
 * The reference is a ComprehensionReference, e.g.
 * { question, passage?, model_answers: [...], required_info: [{ text, keywords? }, ...] }.
 */
export const fragenZumTextProfile: EvaluationProfile = {
  exerciseType: "fragen_zum_text",
  objective: "reading.answer_question",
  strategy: "semantic",
  examSystem: "bac",
  scoring: "sum",
  manualReviewBelowConfidence: 0.6,
  skills: [
    { skill: "InformationExpressed", points: 0.5, config: { mode: "proportional" } },
    { skill: "FullSentence", points: 0.5, config: { minWords: 3 } },
  ],
};
