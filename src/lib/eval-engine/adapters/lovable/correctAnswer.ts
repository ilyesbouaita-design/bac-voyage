import type { FeedbackItem } from "../../core/feedback.ts";
import type { Engine } from "../../engine/Engine.ts";
import { evaluateExercise } from "../../aggregate.ts";
import type { ExerciseEvaluation } from "../../aggregate.ts";
import { round2 } from "../../utilities/round.ts";
import { inputMappers } from "./mappers.ts";
import type { BacExamQuestion, LovableCorrectionResult } from "./types.ts";

function manualResult(maxScore: number, feedback: FeedbackItem[]): LovableCorrectionResult {
  return { score: 0, maxScore, isCorrect: false, isPartial: false, manual: true, feedback };
}

/**
 * Migration Plan Phase 2. kombinieren, ergaenzen, and wortableitung all
 * proportionally divide a whole question's points across several pairs/
 * gaps/sentences — exactly like grading-engine.ts's (V1's) own
 * gradeKombinieren/gradeErgaenzen/gradeWortableitung, which all take the
 * question's `points` as an explicit parameter and compute
 * `round2((correctCount / total) * points)`. This engine's profiles, by
 * design, declare a FIXED point total per skill (see EvaluationProfile's
 * own doc comment: "no percentages, no implicit weights... set by the
 * teacher IN THE PROFILE") — correct for exercise types whose point value
 * truly never varies, but for these 3 the real bac-voyage schema's
 * BacExamQuestion.points (confirmed against bac-types.ts) is a genuinely
 * per-QUESTION, teacher-authored value that need not equal the profile's
 * fixed default: kombinierenProfile always awards out of 2, wortableitung
 * out of 1, ergaenzen out of however many sentences the mapper produced —
 * none of which the profile can know is the SAME number the teacher
 * actually configured for a specific question.
 *
 * This rescales the engine's own ratio into the question's real point
 * budget, exactly mirroring V1's formula, without changing the engine or
 * any profile's fixed-points design — this is purely an adapter-boundary
 * concern (translating the engine's point-based judgment into the host's
 * point currency), the same kind of translation legacy.ts already does for
 * feedback shape. When a question's points already equals the profile's
 * default (the common case — confirmed the pre-existing test fixtures for
 * all 3 types implicitly assumed exactly this), the rescale factor is 1 and
 * nothing changes.
 *
 * Deliberately scoped to exactly these 3 bac_types via
 * RESCALE_TO_QUESTION_POINTS. The other multi-item types this adapter
 * already supports (grammatik_konnektoren, grammatik_deklination,
 * richtig_falsch_zitat) may have an analogous gap — NOT verified this
 * phase, out of scope ("do not modify unrelated exercise types"); worth a
 * follow-up audit.
 */
const RESCALE_TO_QUESTION_POINTS = new Set(["kombinieren", "ergaenzen", "wortableitung"]);

function rescaleToQuestionPoints(evaluation: ExerciseEvaluation, questionPoints: number): ExerciseEvaluation {
  if (evaluation.maxScore === 0 || evaluation.maxScore === questionPoints) return evaluation;
  const factor = questionPoints / evaluation.maxScore;
  const score = round2(evaluation.score * factor);
  const maxScore = round2(questionPoints);
  return {
    ...evaluation,
    score,
    maxScore,
    isCorrect: maxScore > 0 && score >= maxScore,
    isPartial: score > 0 && score < maxScore,
    perItem: evaluation.perItem.map((item) => {
      const itemScore = round2(item.score * factor);
      const itemMaxScore = round2(item.maxScore * factor);
      return {
        ...item,
        score: itemScore,
        maxScore: itemMaxScore,
        isCorrect: itemMaxScore > 0 && itemScore >= itemMaxScore,
        isPartial: itemScore > 0 && itemScore < itemMaxScore,
      };
    }),
  };
}

/**
 * Grade one Lovable BAC question end to end.
 *
 * Looks up the registered mapper for the question's bac_type, builds the
 * engine's EvaluationInput(s) — one, or several for multi-item exercises
 * (richtig_falsch_zitat's statements, grammatik_konnektoren's sentences) —
 * and runs them through evaluateExercise, the SAME aggregation helper the
 * engine already ships (not reimplemented here). The result is mapped to
 * Lovable's expected shape. NO grading decision is made in this function —
 * every score, verdict, and feedback item comes directly from the engine.
 *
 * If the bac_type is unsupported, or the mapper throws (missing answerKey
 * data a skill requires, or an unsupported direction/clause_type/tense —
 * see mappers.ts for exactly which cases), this returns a `manual: true`
 * result instead of propagating the exception, so a content gap degrades to
 * "needs human review" rather than crashing the caller.
 */
export function correctAnswer(engine: Engine, question: BacExamQuestion, response: unknown): LovableCorrectionResult {
  const bacType = question.bac_content.bac_type;
  const mapper = inputMappers.get(bacType);

  if (!mapper) {
    return manualResult(question.points, [
      { key: "adapter.grading.unsupported_type", points: 0, skill: "adapter", params: { bac_type: bacType } },
    ]);
  }

  try {
    const inputs = mapper(question, response);
    if (inputs.length === 0) {
      return manualResult(question.points, [
        { key: "adapter.grading.no_items", points: 0, skill: "adapter", params: { bac_type: bacType } },
      ]);
    }

    const exerciseType = inputs[0]!.exerciseType;
    const items = inputs.map((input) => ({
      answer: input.answer,
      reference: input.reference,
      profileKey: input.profileKey,
    }));
    const rawEvaluation = evaluateExercise(engine, exerciseType, items);
    const evaluation = RESCALE_TO_QUESTION_POINTS.has(bacType)
      ? rescaleToQuestionPoints(rawEvaluation, question.points)
      : rawEvaluation;

    return {
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      isCorrect: evaluation.isCorrect,
      isPartial: evaluation.isPartial,
      manual: evaluation.manualCount > 0,
      strategy: evaluation.perItem.length === 1 ? evaluation.perItem[0]?.strategy : undefined,
      feedback: evaluation.perItem.flatMap((result) => result.feedback),
      perItem:
        evaluation.perItem.length > 1
          ? evaluation.perItem.map((result) => ({
              score: result.score,
              maxScore: result.maxScore,
              manual: result.manual,
              feedback: result.feedback,
            }))
          : undefined,
    };
  } catch (error) {
    return manualResult(question.points, [
      {
        key: "adapter.grading.unavailable",
        points: 0,
        skill: "adapter",
        params: { reason: error instanceof Error ? error.message : String(error) },
      },
    ]);
  }
}
