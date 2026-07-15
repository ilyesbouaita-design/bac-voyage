import type { EvaluationProfile } from "../core/profile.ts";
import type { ExactMatchConfig } from "../skills/ExactMatchSkill.ts";

/**
 * BAC "titel" exercise: the learner proposes a title for the reading
 * passage, judged against the teacher's list of accepted titles. The
 * educational objective is picking/composing an APPROPRIATE title, not
 * spelling precision, so case is ignored — unlike synonym/gegenteil, which
 * are deliberately case-sensitive by the profile owner's choice.
 *
 * Note on that choice: bac-voyage's real TitelCard has no local
 * correctness check of its own to confirm this against directly (unlike
 * kompositum_bilden/kompositum_loesen/wortableitung/ergaenzen, whose real
 * cards do their own case-insensitive comparison and were read directly to
 * confirm it) — it just displays a server-computed result. Case-
 * insensitivity here is a reasoned default (matching the pattern of every
 * other newly-added type this pass, and the pedagogical rationale above),
 * not something confirmed from that specific card's own code.
 *
 * Fuzzy/typo tolerance (Phase 7 capability) is ENABLED here, unlike
 * kompositum_bilden — but at a TIGHTENED minSimilarity (0.9, not the 0.75
 * default), for a reason specific to multi-word phrases, verified
 * quantitatively rather than assumed: at the default threshold, a title
 * that swaps ONE key word for a different one of the same length ("Ein Tag
 * im Park" vs "Ein Tag im Wald" — a different place, a different meaning)
 * scores 0.8 similarity, ABOVE the 0.75 default — meaning the default
 * threshold would incorrectly award "typo" credit for what is actually a
 * substantively wrong title, not a spelling slip. At 0.9, that same
 * false-positive case (0.8) is correctly rejected, while a genuine
 * same-length transposition typo ("Ein Tag im Prak") still clears it at
 * 0.933. This is why titel's threshold differs from synonym/gegenteil's:
 * longer, multi-word strings need a stricter bar precisely BECAUSE a fixed
 * percentage threshold tolerates more absolute characters of difference as
 * the string gets longer.
 */
const titelExactConfig: ExactMatchConfig = {
  acceptedField: "accepted_titles",
  normalize: { toLowerCase: true },
  fuzzy: { minSimilarity: 0.9 },
};

export const titelProfile: EvaluationProfile = {
  exerciseType: "titel",
  objective: "reading.title.choose",
  strategy: "exact",
  examSystem: "bac",
  skills: [
    {
      skill: "ExactMatch",
      points: 1,
      config: titelExactConfig,
    },
  ],
};
