import type { EvaluationProfile } from "../core/profile.ts";
import type { ExactMatchConfig } from "../skills/ExactMatchSkill.ts";

/**
 * BAC "kompositum_bilden" exercise: the learner forms a German compound
 * noun from two given words (e.g. "Haus" + "Tür" -> "Haustür"). The real
 * content shape ({ word1, word2, result }) has exactly ONE correct
 * compound, not a list — the mapper synthesizes a one-element
 * accepted_answers array so this reuses ExactMatch exactly as synonym does,
 * rather than inventing a single-string-comparison variant.
 *
 * Case-insensitive: confirmed directly against bac-voyage's real
 * WortbildungCard (its own local check is `answer.trim().toLowerCase() ===
 * correct.trim().toLowerCase()`), not a guess.
 *
 * Fuzzy/typo tolerance (Phase 7 capability) is deliberately NOT enabled
 * here, unlike synonym/gegenteil/titel — checked quantitatively, not just
 * assumed safe by analogy. A wrong-but-real compound sharing the SAME first
 * root as the correct one ("Haustor" vs the correct "Haustür" — a
 * different, real word, house GATE vs house DOOR) sits at 0.857 similarity.
 * A genuine single-letter deletion typo of the correct answer ("Haustür"
 * vs "Haustü") ALSO sits at 0.857 — the identical score. No similarity
 * threshold can separate these two cases for this specific pair, and this
 * is not a one-off: short German compounds routinely differ from an
 * unrelated-but-real compound by exactly the same edit distance a genuine
 * typo would produce, because both differ in only the second root's
 * letters. This is a structural limit of length-normalized edit distance
 * on short strings, not a tuning problem solvable by picking a different
 * threshold — titel's longer, multi-word strings do not share this
 * specific failure mode (see titel.ts).
 */
const kompositumBildenExactConfig: ExactMatchConfig = {
  acceptedField: "accepted_answers",
  normalize: { toLowerCase: true },
};

export const kompositumBildenProfile: EvaluationProfile = {
  exerciseType: "kompositum_bilden",
  objective: "vocab.compound.form",
  strategy: "exact",
  examSystem: "bac",
  skills: [
    {
      skill: "ExactMatch",
      points: 1,
      config: kompositumBildenExactConfig,
    },
  ],
};
