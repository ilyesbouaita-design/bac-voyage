import type { Engine } from "../../engine/Engine.ts";
import { correctAnswer } from "./correctAnswer.ts";
import type { BacExamQuestion, BacQuestionType, LovableCorrectionResult } from "./types.ts";

// ============================================================================
// Migration bridge — shadow mode (Migration Plan, Phase 1)
//
// Lets the new engine grade a real submission ALONGSIDE v2 without ever
// affecting what a student sees or what gets persisted: v2's result remains
// authoritative (see routing.ts's "shadow" mode), and this module's only job
// is to produce a structured diff between the two engines' outcomes plus an
// optional side-channel to log it — the mechanism the migration plan's
// Section 6 calls "shadow-mode dual-run comparison", the strongest available
// guarantee against a regression before any flag flips to "new".
//
// GradingOutcome is a deliberately reduced, neutral shape both engines can
// be mapped to — NOT a re-export of either engine's native type, because
// this project has no access to bac-voyage's real GradeResultV2 (it exists
// only in the real repo; ONLY this project's own LovableCorrectionResult can
// actually be constructed here). The mapping from GradeResultV2 to
// GradingOutcome that the real orchestrator would perform is:
//
//   GradeResultV2 field    ->  GradingOutcome field
//   score                  ->  score
//   maxScore               ->  maxScore
//   isCorrect              ->  isCorrect
//   isPartial              ->  isPartial
//   needsManualReview      ->  manual
// ============================================================================

/** A grading engine's outcome, reduced to exactly the fields that get shown to a student or persisted to exam_answers. Deliberately neutral — see the file header for the GradeResultV2 mapping. */
export interface GradingOutcome {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
  manual: boolean;
}

/** Reduce the new engine's native output to the comparison shape. */
export function fromLovableResult(result: LovableCorrectionResult): GradingOutcome {
  return {
    score: result.score,
    maxScore: result.maxScore,
    isCorrect: result.isCorrect,
    isPartial: result.isPartial,
    manual: result.manual,
  };
}

/**
 * A full agreement requires every field to match, not just the score.
 * maxScoreMatches is checked and folded into `agrees` deliberately: two
 * engines reporting an equal raw score against DIFFERENT max scores (e.g.
 * 0.5/1 vs 0.5/2) are not actually in agreement, even though a naive
 * score-only diff would miss that.
 */
export interface ShadowModeDiff {
  agrees: boolean;
  /** newEngine.score - v2.score. Signed, so the caller can see direction, not just magnitude. */
  scoreDelta: number;
  maxScoreMatches: boolean;
  correctnessMatches: boolean;
  partialMatches: boolean;
  manualMatches: boolean;
  v2: GradingOutcome;
  newEngine: GradingOutcome;
}

/** Points of score difference below which two outcomes are still considered in agreement (guards against float rounding noise; both engines report points rounded to 2 decimals). */
const SCORE_EPSILON = 0.005;

/** Pure comparison — no engine is run here. Exposed separately from runShadowComparison so it can be tested (and used) without needing a live Engine or question. */
export function compareGradingOutcomes(v2: GradingOutcome, newEngine: GradingOutcome): ShadowModeDiff {
  const scoreDelta = newEngine.score - v2.score;
  const maxScoreMatches = v2.maxScore === newEngine.maxScore;
  const correctnessMatches = v2.isCorrect === newEngine.isCorrect;
  const partialMatches = v2.isPartial === newEngine.isPartial;
  const manualMatches = v2.manual === newEngine.manual;
  const agrees =
    maxScoreMatches && correctnessMatches && partialMatches && manualMatches && Math.abs(scoreDelta) < SCORE_EPSILON;

  return { agrees, scoreDelta, maxScoreMatches, correctnessMatches, partialMatches, manualMatches, v2, newEngine };
}

export interface ShadowModeContext {
  questionId: string;
  bacType: BacQuestionType;
}

export interface ShadowModeResult {
  diff: ShadowModeDiff;
  /** The new engine's full, un-reduced result — kept alongside the diff since a human reviewing a disagreement needs the actual feedback items, not just the score/correctness summary. */
  newEngineResult: LovableCorrectionResult;
}

/**
 * Run the new engine on the same input v2 already graded, and diff the two.
 * v2 is never invoked by this function — the caller (the real orchestrator,
 * in "shadow" mode) supplies v2's outcome, already reduced to GradingOutcome
 * per the mapping table in this file's header, since only the caller has
 * access to bac-voyage's real gradeAnswerV2().
 *
 * `onResult`, if supplied, is called exactly once with the diff and question
 * context — this is the injection point for whatever bac-voyage chooses as
 * its actual logging/storage mechanism (a new DB table, an application log,
 * a metrics counter). This module assumes nothing about that mechanism, the
 * same way the engine's MeaningJudge is injectable rather than hardcoded to
 * one implementation. onResult is never awaited and its errors are not this
 * function's concern — a logging failure must never affect grading.
 */
export function runShadowComparison(
  engine: Engine,
  question: BacExamQuestion,
  response: unknown,
  v2Outcome: GradingOutcome,
  onResult?: (diff: ShadowModeDiff, context: ShadowModeContext) => void,
): ShadowModeResult {
  const newEngineResult = correctAnswer(engine, question, response);
  const diff = compareGradingOutcomes(v2Outcome, fromLovableResult(newEngineResult));

  if (onResult) {
    onResult(diff, { questionId: question.id, bacType: question.bac_content.bac_type });
  }

  return { diff, newEngineResult };
}
