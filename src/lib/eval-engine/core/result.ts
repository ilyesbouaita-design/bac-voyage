import type { FeedbackItem } from "./feedback.ts";
import type { SkillResult } from "./skill.ts";

/**
 * The engine's output. `score` is the plain SUM of awarded skill points; there
 * are no percentages inside the engine. `isCorrect` / `isPartial` are derived
 * purely from points, for convenience — thresholds (e.g. unlock at 70%) are a
 * frontend concern and live outside this library.
 */
export interface EvaluationResult {
  readonly exerciseType: string;
  readonly strategy: string;
  /** Sum of awarded points across all skills. */
  readonly score: number;
  /** Sum of skill points (or the profile's explicit override). */
  readonly maxScore: number;
  /** Point-derived: maxScore > 0 and score >= maxScore. */
  readonly isCorrect: boolean;
  /** Point-derived: 0 < score < maxScore. */
  readonly isPartial: boolean;
  /** Aggregated structured feedback (never localized). */
  readonly feedback: FeedbackItem[];
  /** Per-skill breakdown, in profile order. */
  readonly bySkill: SkillResult[];
  /**
   * True when the result is not an auto-score: open text needing human review,
   * or a strategy that is not implemented yet.
   */
  readonly manual?: boolean;
  /** Optional non-localized diagnostics. */
  readonly details?: Record<string, unknown>;
}
