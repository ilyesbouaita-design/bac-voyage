import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "kombinieren" (matching): the learner maps each left item (a, b, c, d) to
 * a right item (1, 2, 3, 4). It reuses ExactStrategy — the labels are matched
 * exactly, so it is deterministic and needs no manual gate.
 *
 * One single-responsibility skill (Kombination) judges the correspondences. The
 * mark is profile-driven: the profile sets the total points (here 2) and the
 * scoring model (proportional across pairs by default); the skill derives the
 * per-pair value from the number of pairs, so the same profile works for any
 * item count. A teacher can set config.mode "all_or_nothing" if desired.
 *
 * The compound answer is the mapping, e.g. { a: "2", b: "4", c: "3", d: "1" };
 * the reference is a KombinationReference with the answer_key.
 *
 * Migration Plan Phase 2: confirmed directly against grading-engine.ts's real
 * gradeKombinieren (not reimplemented from memory) — per-key comparison via a
 * trim+lowercase+whitespace-collapse normalize(), proportional credit
 * (round2(correctCount/totalPairs * points)), and an "empty answer_key ->
 * automatic full marks" edge case. KombinationSkill already matched this
 * formula exactly; no skill change was needed here, only verification and the
 * regression tests proving it (see test/v1Parity.test.ts). The one real gap
 * found was NOT in this skill: V1's `points` is an externally supplied
 * parameter (the real system's per-question BacExamQuestion.points, teacher-
 * authored, not necessarily 2) — this profile still fixes its own point total
 * at 2 (by design: "no percentages, no implicit weights... set in the
 * profile" is a foundational rule for every profile in this engine, not
 * something Kombinieren alone should abandon), so the Lovable adapter
 * (correctAnswer.ts) rescales the engine's ratio to the question's real point
 * budget for this bac_type specifically. See correctAnswer.ts's own doc
 * comment for the full reasoning.
 *
 * Fuzzy/typo tolerance (Phase 7 capability): considered and NOT enabled, for
 * the same structural reason as ergaenzen (see that profile's own doc
 * comment). Kombinieren's answer is a mapping of LABELS ("2", "4", "1", "3"),
 * confirmed against the real KombinierenCard's own handleLeftClick/
 * handleRightClick: the student clicks a left item, then clicks the matching
 * right item ("Klicken Sie auf ein Element links, dann auf das passende
 * Element rechts") — never types anything. A typo on a label cannot occur
 * through this interaction.
 */
export const kombinierenProfile: EvaluationProfile = {
  exerciseType: "kombinieren",
  objective: "match.combine",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "Kombination", points: 2, config: { mode: "proportional" } },
  ],
};
