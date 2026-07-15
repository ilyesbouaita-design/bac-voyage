import type { EvaluationProfile } from "../core/profile.ts";
import type { ExactMatchConfig } from "../skills/ExactMatchSkill.ts";

/**
 * BAC "gegenteil" exercise: the learner replaces a target word with its
 * OPPOSITE (antonym), the mirror image of "synonym". Structurally identical
 * to synonymProfile in every way that matters to grading — same shape
 * ({ sentence, target_word, accepted_answers: string[] }, plus a
 * gap_sentence field used only for rendering, not grading), same educational
 * objective (vocabulary knowledge, judged by exact match against the
 * teacher's accepted answers), even the same real-app rendering component
 * (SynonymGegenteilCard serves both types with one onAnswerChange(answer:
 * string) callback, confirmed from bac-voyage's exam.$examId.tsx).
 *
 * Deliberately case-SENSITIVE (ExactMatch's default, no normalize override)
 * to match synonymProfile's own established choice for this exact reason —
 * two profiles sharing a shape and a rendering component should not
 * silently diverge in strictness.
 *
 * Fuzzy/typo tolerance (Phase 7 capability) is ENABLED here too, at the
 * default threshold, mirroring synonymProfile's own decision and reasoning
 * exactly (see synonym.ts's doc comment for the full justification,
 * including the accepted case-sensitivity interaction and the verified-safe
 * distances for real wrong-answer cases, e.g. "riesig" vs "klein" —
 * similarity 0.33). Two profiles sharing a shape should not silently
 * diverge in leniency any more than in strictness.
 */
const gegenteilExactConfig: ExactMatchConfig = {
  acceptedField: "accepted_answers",
  fuzzy: {},
};

export const gegenteilProfile: EvaluationProfile = {
  exerciseType: "gegenteil",
  objective: "vocab.antonym.replace",
  strategy: "exact",
  examSystem: "bac",
  skills: [
    {
      skill: "ExactMatch",
      points: 1,
      config: gegenteilExactConfig,
    },
  ],
};
