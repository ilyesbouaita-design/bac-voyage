import type { EvaluationProfile } from "../core/profile.ts";
import type { ExactMatchConfig } from "../skills/ExactMatchSkill.ts";

/**
 * BAC "ergaenzen" exercise: fill each sentence's single blank with the
 * correct word, chosen from a shared word bank across all of a question's
 * sentences (confirmed against the real ErgaenzenCard). Multi-item, exactly
 * like richtig_falsch_zitat and grammatik_konnektoren: the adapter's mapper
 * produces one EvaluationInput PER SENTENCE, each graded independently
 * against this ONE profile (registered once under its own exerciseType, the
 * same convention already used by konnektoren/deklination/fragenStellen —
 * no sub-typing needed, the content model has no sub-type discriminator)
 * and summed by evaluateExercise.
 *
 * The real content shape ({ sentences: [{ text, blank_word }] }) has no
 * per-sentence points field (the same gap grammatik_konnektoren already
 * has) — each sentence's ExactMatch is simply worth 1 point, so an N-
 * sentence question's total mark is N, exactly mirroring how konnektoren
 * already resolves this identical shape gap.
 *
 * Case-insensitive: confirmed directly against the real ErgaenzenCard's own
 * `gaps[i]?.toLowerCase() === s.blank_word.toLowerCase()` check.
 *
 * Fuzzy/typo tolerance (Phase 7 capability) is deliberately NOT enabled
 * here — not because it would be unsafe, but because it would be
 * structurally pointless. Confirmed directly against the real
 * ErgaenzenCard: the student never types an answer at all. They CLICK a
 * word out of a shared, shuffled word bank (the exact blank_word strings
 * from every sentence in the question). A typo cannot occur through this
 * interaction — the submitted value is always character-for-character one
 * of the bank's existing words. Enabling fuzzy tolerance here would add
 * pure downside (a wrong bank-word pick that happens to resemble the
 * correct one earning undeserved partial credit) with no corresponding
 * benefit, since there is no typo risk to protect against in the first
 * place.
 *
 * Migration Plan Phase 2: per-sentence ExactMatch, summed across sentences
 * by evaluateExercise, is numerically equivalent to grading-engine.ts's real
 * gradeErgaenzen (confirmed directly against its source, not reimplemented
 * from memory) — a per-INDEX exact match via a trim+lowercase+whitespace-
 * collapse normalize(), proportional credit — PROVIDED the question's real
 * point total equals the sentence count. It need not: bac-voyage's
 * BacExamQuestion.points is an independently teacher-authored value (V1's
 * gradeErgaenzen receives it as an explicit `points` parameter, entirely
 * separate from `sentences.length`), while this profile still fixes 1 point
 * per sentence (by this engine's foundational "exact points set in the
 * profile" rule — every profile does this, not just this one). The Lovable
 * adapter (correctAnswer.ts) rescales the engine's ratio to the question's
 * real point budget for this bac_type specifically, so the two stay in
 * parity without this profile needing to know about a specific question's
 * point total at all. See correctAnswer.ts's own doc comment.
 */
const ergaenzenExactConfig: ExactMatchConfig = {
  acceptedField: "accepted_answers",
  normalize: { toLowerCase: true },
};

export const ergaenzenProfile: EvaluationProfile = {
  exerciseType: "ergaenzen",
  objective: "vocab.blank.fill",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    {
      skill: "ExactMatch",
      points: 1,
      config: ergaenzenExactConfig,
    },
  ],
};
