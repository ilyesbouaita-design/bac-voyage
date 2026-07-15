import { answerText } from "../../core/answer.ts";
import type { FeedbackItem } from "../../core/feedback.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import type { SimilarityOptions } from "../../core/utilities.ts";
import { round2 } from "../../utilities/round.ts";
import { readStringArray } from "./reference.ts";

/** Per-profile configuration for the Meaning skill. */
export interface MeaningConfig {
  /** Reference field holding accepted translations. Default: "accepted_translations". */
  acceptedField?: string;
  /** Points deducted per meaning error (missing content concept). Default: 0.25. */
  penaltyPerError?: number;
  /** Override the stopword list used for content comparison (e.g. per target language). */
  stopwords?: readonly string[];
}

const DEFAULT_FIELD = "accepted_translations";
const DEFAULT_PENALTY = 0.25;

/**
 * Meaning — judges ONE aspect: does the translation convey the reference
 * meaning? It compares content-word overlap against the best-matching accepted
 * translation, counts missing content concepts as meaning errors, and awards
 * full points minus a penalty per error (matching the BAC rule). It reports a
 * confidence equal to content coverage, so SemanticStrategy can defer
 * low-confidence (possible-paraphrase) cases to human review.
 *
 * This is deterministic content overlap, NOT semantic AI: an empty answer is a
 * confident zero, a high-overlap answer is confidently scored, and a
 * low-overlap non-empty answer is scored but flagged uncertain for review.
 */
export class MeaningSkill implements Skill<unknown, MeaningConfig> {
  readonly id = "Meaning";

  evaluate(context: SkillContext<unknown, MeaningConfig>): SkillResult {
    const field = context.config?.acceptedField ?? DEFAULT_FIELD;
    const penalty = context.config?.penaltyPerError ?? DEFAULT_PENALTY;
    const options: SimilarityOptions = context.config?.stopwords
      ? { stopwords: context.config.stopwords }
      : {};

    const accepted = readStringArray(context.expected, field, this.id);
    const answer = answerText(context.answer).trim();

    if (answer.length === 0) {
      // Empty is a CONFIDENT zero — nothing to review.
      return this.result(context.maxPoints, 0, 1, "semantic.meaning.error", { errors: 0, reason: "empty" });
    }

    // Best-matching accepted translation = highest content coverage.
    let bestCoverage = 0;
    let bestMissing: string[] = [];
    for (const translation of accepted) {
      const overlap = context.utils.similarity.overlap(translation, answer, options);
      if (overlap.coverage >= bestCoverage) {
        bestCoverage = overlap.coverage;
        bestMissing = overlap.missing;
      }
    }

    const errors = bestMissing.length;
    const confidence = round2(bestCoverage);

    if (errors === 0) {
      return this.result(context.maxPoints, context.maxPoints, confidence, "semantic.meaning.correct");
    }
    const awarded = Math.max(0, round2(context.maxPoints - penalty * errors));
    return this.result(context.maxPoints, awarded, confidence, "semantic.meaning.error", {
      errors,
      missing: bestMissing.join(", "),
    });
  }

  private result(
    maxPoints: number,
    awarded: number,
    confidence: number,
    key: string,
    params?: Record<string, string | number | boolean>,
  ): SkillResult {
    const feedback: FeedbackItem = params
      ? { key, points: awarded, skill: this.id, params }
      : { key, points: awarded, skill: this.id };
    return { skill: this.id, awarded, maxPoints, feedback: [feedback], confidence };
  }
}
