import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import type { MeaningContext } from "../../core/utilities.ts";
import { round2 } from "../../utilities/round.ts";
import { asComprehensionReference, semanticResult } from "./reference.ts";

/** Per-profile configuration for the InformationExpressed skill. */
export interface InformationExpressedConfig {
  /**
   * How the skill's points are awarded across required-info points. Default
   * "proportional" (each point is a share of the mark); "all_or_nothing" awards
   * the full mark only if every point is expressed. The PROFILE decides.
   */
  mode?: "proportional" | "all_or_nothing";
  /** Confidence at/above which a point counts as confidently expressed. Default 0.6. */
  expressedThreshold?: number;
}

/**
 * InformationExpressed — judges ONE aspect: does the answer EXPRESS the
 * required information (wording aside)? For each required-information point it
 * asks the injected MeaningJudge, using the model answers as context and
 * keywords as supporting evidence. It awards the points CONFIDENTLY expressed —
 * proportionally by default, or all-or-nothing when the profile configures it —
 * and reports the least-certain point's confidence so SemanticStrategy defers
 * uncertain answers to a human. This is NOT a keyword checker.
 */
export class InformationExpressedSkill implements Skill<unknown, InformationExpressedConfig> {
  readonly id = "InformationExpressed";

  evaluate(context: SkillContext<unknown, InformationExpressedConfig>): SkillResult {
    const ref = asComprehensionReference(context.expected, this.id);
    const mode = context.config?.mode ?? "proportional";
    const threshold = context.config?.expressedThreshold ?? 0.6;
    const candidate = answerText(context.answer).trim();
    const points = ref.required_info;

    if (points.length === 0) {
      return semanticResult(this.id, context.maxPoints, context.maxPoints, 1, "reading.info.expressed", {
        expressed: 0,
        total: 0,
      });
    }
    if (candidate === "") {
      return semanticResult(this.id, 0, context.maxPoints, 1, "reading.info.missing", {
        expressed: 0,
        total: points.length,
        reason: "empty",
      });
    }

    const meaningContext: MeaningContext = { modelAnswers: ref.model_answers, passage: ref.passage };
    let confident = 0;
    let minConfidence = 1;
    const missing: string[] = [];
    for (const point of points) {
      const verdict = context.utils.meaningJudge.judge(
        candidate,
        { text: point.text, keywords: point.keywords },
        meaningContext,
      );
      if (verdict.expressed && verdict.confidence >= threshold) confident += 1;
      else missing.push(point.text);
      if (verdict.confidence < minConfidence) minConfidence = verdict.confidence;
    }

    const ratio = confident / points.length;
    const awarded =
      mode === "all_or_nothing"
        ? confident === points.length
          ? context.maxPoints
          : 0
        : round2(context.maxPoints * ratio);

    const key =
      confident === points.length
        ? "reading.info.expressed"
        : confident === 0
          ? "reading.info.missing"
          : "reading.info.partial";

    return semanticResult(this.id, awarded, context.maxPoints, round2(minConfidence), key, {
      expressed: confident,
      total: points.length,
      missing: missing.join(" | "),
    });
  }
}
