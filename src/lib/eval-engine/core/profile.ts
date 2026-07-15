import type { ScoringPolicy } from "./scoring.ts";

/**
 * Binds ONE skill into a profile with its EXACT point value (set by the
 * teacher) and optional configuration. No percentages, no implicit weights.
 */
export interface SkillBinding<TConfig = unknown> {
  /** Skill id, resolved dynamically from the SkillRegistry. */
  readonly skill: string;
  /** Exact points awarded by this skill when fully satisfied. */
  readonly points: number;
  /** Optional per-profile configuration handed to the skill. */
  readonly config?: TConfig;
}

/**
 * One EvaluationProfile per EXERCISE TYPE (never per individual question).
 *
 * The profile is the single source of truth for WHAT is evaluated: the
 * objective, the strategy, the enabled skills, their exact points, and how
 * those points are aggregated. The engine reads it and never guesses.
 */
export interface EvaluationProfile {
  /**
   * Registry key. For sub-typed exercises this is the SPECIFIC sub-type, not
   * the exam's generic outer type — e.g. "tempus.perfekt", not
   * "grammatik_tempus" (a caller pairs exerciseType "grammatik_tempus" with
   * profileKey "tempus.perfekt" to resolve this profile; see EvaluationInput).
   * For non-sub-typed exercises it is simply the exercise type, e.g. "synonym".
   */
  readonly exerciseType: string;
  /** Educational objective id (non-localized). Example: "grammar.tense.transform". */
  readonly objective: string;
  /** Strategy name, resolved from the StrategyRegistry. */
  readonly strategy: string;
  /** Enabled skills with exact points. Order is preserved in the feedback. */
  readonly skills: ReadonlyArray<SkillBinding>;
  /**
   * How per-skill results are aggregated into the final score. Defaults to
   * "sum" (independent, additive partial credit); "all_or_nothing" grants full
   * marks only if every enabled skill fully passes; "deduction" starts at the
   * max and subtracts each skill's shortfall. This is ALWAYS a profile-level
   * choice — never assumed by the engine, a strategy, or tied to a particular
   * exercise type. Profiles with identical skills may legitimately choose
   * different policies (see test/scoringFlexibility.test.ts).
   */
  readonly scoring?: ScoringPolicy;
  /**
   * Optional exam system, for organization only. The engine stays agnostic;
   * BAC / Goethe / TELC / school exams differ only in profiles and skills.
   */
  readonly examSystem?: string;
  /**
   * Optional explicit maximum score. Defaults to the sum of skill points.
   * Set only when a teacher deliberately overrides the derived total.
   */
  readonly maxScore?: number;
  /**
   * If set (0..1), a strategy may flag the result `manual` when the aggregate
   * confidence falls below this threshold. Used by SemanticStrategy to route
   * uncertain open-text answers to human side-by-side review.
   */
  readonly manualReviewBelowConfidence?: number;
}

/** The profile's maximum score: explicit override, else the sum of skill points. */
export function profileMaxScore(profile: EvaluationProfile): number {
  if (typeof profile.maxScore === "number") return profile.maxScore;
  return profile.skills.reduce((sum, binding) => sum + binding.points, 0);
}
