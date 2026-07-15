import type { EvaluationInput } from "../core/input.ts";
import type { EvaluationProfile } from "../core/profile.ts";
import type { EvaluationResult } from "../core/result.ts";
import type { ScoringResolver } from "../core/scoring.ts";
import type { SkillResolver } from "../core/skill.ts";
import type { EvaluationStrategy } from "../core/strategy.ts";
import type { SkillUtilities } from "../core/utilities.ts";
import { round2 } from "../utilities/round.ts";
import { runSkillPipeline } from "./pipeline.ts";

const DEFAULT_MANUAL_THRESHOLD = 0.6;

/**
 * SemanticStrategy — for open-text meaning judgments (translation adequacy,
 * required information). It runs the profile's semantic skills through the
 * shared pipeline and applies the profile's ScoringPolicy, then applies a
 * MANUAL-REVIEW GATE: when the aggregate confidence is below the threshold, it
 * flags the result `manual` so the frontend routes it to human side-by-side
 * review. The suggested score is still returned.
 *
 * This is how the engine keeps faith with "never guess" in a fuzzy domain: it
 * scores what it can see clearly and abstains (defers) otherwise. All fuzziness
 * lives in the semantic skills and the similarity utility; the engine and the
 * other strategies are untouched, and a future embeddings/LLM backend could
 * replace the offline heuristic behind this same seam.
 */
export class SemanticStrategy implements EvaluationStrategy {
  readonly name = "semantic";
  private readonly utils: SkillUtilities;
  private readonly scoring: ScoringResolver;
  private readonly defaultThreshold: number;

  constructor(
    utils: SkillUtilities,
    scoring: ScoringResolver,
    defaultThreshold: number = DEFAULT_MANUAL_THRESHOLD,
  ) {
    this.utils = utils;
    this.scoring = scoring;
    this.defaultThreshold = defaultThreshold;
  }

  evaluate(
    input: EvaluationInput,
    profile: EvaluationProfile,
    skills: SkillResolver,
  ): EvaluationResult {
    const base = runSkillPipeline(input, profile, skills, this.utils, this.name, this.scoring);

    const confidences = base.bySkill.map((skill) => skill.confidence ?? 1);
    const confidence = confidences.length > 0 ? Math.min(...confidences) : 1;
    const threshold = profile.manualReviewBelowConfidence ?? this.defaultThreshold;

    const withConfidence: EvaluationResult = {
      ...base,
      details: { ...(base.details ?? {}), confidence: round2(confidence) },
    };

    if (confidence >= threshold) {
      return withConfidence;
    }
    return {
      ...withConfidence,
      manual: true,
      feedback: [
        ...withConfidence.feedback,
        {
          key: "semantic.review.suggested",
          points: 0,
          skill: this.name,
          params: { confidence: round2(confidence) },
        },
      ],
    };
  }
}
