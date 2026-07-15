import type { SkillResult } from "./skill.ts";

/**
 * How a strategy turns per-skill results into a final grade. It is declared per
 * profile (data) and applied by the strategy — never by the engine. Adding a
 * policy is a registry entry, never a switch. Default is "sum".
 *
 * - "sum"            score = the sum of awarded points (independent partial credit).
 * - "all_or_nothing" full marks only if EVERY skill fully passes, otherwise 0.
 * - "deduction"      start at maxScore and subtract each skill's shortfall.
 *
 * This choice is ALWAYS a profile-level decision, never tied to a particular
 * exercise type. Two profiles for the same exercise type — or with identical
 * skills — may legitimately choose different policies; the engine and the
 * strategies apply whatever the profile declares.
 */
export type ScoringPolicy = "sum" | "all_or_nothing" | "deduction";

/** The score portion of an EvaluationResult, produced by a ScoringPolicyFn. */
export interface ScoreBreakdown {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
}

/** A pure aggregation function for one scoring policy. */
export type ScoringPolicyFn = (
  bySkill: readonly SkillResult[],
  maxScore: number,
) => ScoreBreakdown;

/** The read-only view of the scoring registry that strategies depend on. */
export interface ScoringResolver {
  get(policy: string): ScoringPolicyFn;
}
