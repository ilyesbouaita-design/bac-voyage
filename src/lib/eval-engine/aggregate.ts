import type { AnswerInput } from "./core/answer.ts";
import type { EvaluationResult } from "./core/result.ts";
import type { Engine } from "./engine/Engine.ts";
import { round2 } from "./utilities/round.ts";

/** One item (e.g. one statement or one sub-question) of a multi-item exercise. */
export interface ExerciseItem {
  readonly answer: AnswerInput;
  readonly reference: unknown;
  /** Optional profile key override (defaults to the exercise type). */
  readonly profileKey?: string;
}

/** The aggregate result of a multi-item exercise. */
export interface ExerciseEvaluation {
  readonly perItem: EvaluationResult[];
  readonly score: number;
  readonly maxScore: number;
  /** Same derivation sumPolicy uses (score >= maxScore), computed once here so callers never recompute it. */
  readonly isCorrect: boolean;
  /** Same derivation sumPolicy uses (0 < score < maxScore), computed once here so callers never recompute it. */
  readonly isPartial: boolean;
  /** How many items were flagged for manual review. */
  readonly manualCount: number;
}

/**
 * Evaluate a multi-item exercise by running the engine once per item and
 * summing the results. This is a thin, engine-agnostic convenience for
 * exercises whose data model holds several statements/sub-questions (e.g.
 * Richtig/Falsch mit Zitat). It does NOT touch the engine — the engine remains
 * a single-answer-in, single-result-out component; aggregation lives here.
 */
export function evaluateExercise(
  engine: Engine,
  exerciseType: string,
  items: readonly ExerciseItem[],
): ExerciseEvaluation {
  const perItem = items.map((item) =>
    engine.evaluate({
      exerciseType,
      answer: item.answer,
      reference: item.reference,
      profileKey: item.profileKey,
    }),
  );

  let score = 0;
  let maxScore = 0;
  let manualCount = 0;
  for (const result of perItem) {
    score += result.score;
    maxScore += result.maxScore;
    if (result.manual) manualCount += 1;
  }
  const roundedScore = round2(score);
  const roundedMaxScore = round2(maxScore);
  return {
    perItem,
    score: roundedScore,
    maxScore: roundedMaxScore,
    isCorrect: roundedMaxScore > 0 && roundedScore >= roundedMaxScore,
    isPartial: roundedScore > 0 && roundedScore < roundedMaxScore,
    manualCount,
  };
}
