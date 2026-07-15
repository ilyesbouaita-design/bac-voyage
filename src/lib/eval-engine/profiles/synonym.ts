import type { EvaluationProfile } from "../core/profile.ts";
import type { ExactMatchConfig } from "../skills/ExactMatchSkill.ts";

/**
 * BAC "synonym" exercise: the learner replaces a target word with a synonym.
 *
 * The educational objective is vocabulary knowledge ONLY, so it is judged by an
 * exact match against the teacher's accepted answers — spelling/case beyond the
 * accepted forms is not a separate concern here. One skill, one exact point.
 *
 * The question reference (EvaluationInput.reference) is the synonym content,
 * e.g. { sentence, target_word, accepted_answers: string[] }. ExactMatch reads
 * only `accepted_answers`.
 *
 * Fuzzy/typo tolerance (Phase 7 capability) is ENABLED here, at the default
 * threshold (minSimilarity 0.75, creditShare 0.5), after checking this is
 * actually safe for single-word vocabulary answers, not just assumed: every
 * wrong-answer test case already in this suite (e.g. "klein" vs "riesig" —
 * similarity 0.33; "klein" vs "gewaltig" — 0.25) sits far below the
 * threshold, and V2 (the system currently live in production) already
 * applies typo tolerance broadly by default, so leaving this off would be a
 * net LOSS of leniency for students during migration, not a neutral choice.
 *
 * Known, accepted side effect: because this profile is deliberately
 * case-SENSITIVE, a pure capitalization slip ("Riesig" vs "riesig",
 * similarity 0.83) now also clears the fuzzy threshold and earns partial
 * credit through this mechanism, rather than scoring 0 as before. This is
 * treated as a reasonable outcome, not a bug: a student who plainly knows
 * the word but capitalized it differently is exactly the kind of near-miss
 * this feature exists to soften. See test/exactMatch.test.ts for the
 * regression test that intentionally documents this, and titel.ts /
 * kompositumBilden.ts for two cases where fuzzy tolerance was considered and
 * NOT enabled, with the specific reasoning why.
 */
const synonymExactConfig: ExactMatchConfig = {
  acceptedField: "accepted_answers",
  fuzzy: {},
};

export const synonymProfile: EvaluationProfile = {
  exerciseType: "synonym",
  objective: "vocab.synonym.replace",
  strategy: "exact",
  examSystem: "bac",
  skills: [
    {
      skill: "ExactMatch",
      points: 1,
      config: synonymExactConfig,
    },
  ],
};
