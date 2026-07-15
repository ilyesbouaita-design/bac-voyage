import { answerText } from "../core/answer.ts";
import type { FeedbackItem } from "../core/feedback.ts";
import type { Skill, SkillContext, SkillResult } from "../core/skill.ts";
import type { NormalizeOptions } from "../core/utilities.ts";
import { round2 } from "../utilities/round.ts";

/**
 * Opt-in typo tolerance (Migration Plan Phase 7 — the native equivalent of
 * grading-engine-v2's Damerau-Levenshtein fuzzy layer). When the answer
 * doesn't exactly match any accepted value, but the CLOSEST accepted value
 * (via Matcher.closestMatch) clears `minSimilarity`, PARTIAL credit is
 * awarded instead of zero — a typo is still technically wrong, so this
 * never grants full marks the way an exact match does.
 */
export interface FuzzyToleranceConfig {
  /** Minimum normalized similarity (0..1) to qualify as a near-miss. Default 0.75 — roughly "at most one edit in every four characters." */
  minSimilarity?: number;
  /** Share of maxPoints awarded for a qualifying near-miss. Default 0.5. */
  creditShare?: number;
}

/** Per-profile configuration for the ExactMatch skill. */
export interface ExactMatchConfig {
  /**
   * Field on the question reference (`expected`) that holds the accepted
   * answers as a string[]. This is what makes ONE skill reusable across every
   * accepted-list exercise — synonym (accepted_answers), titel
   * (accepted_titles), uebersetzung (accepted_translations), ... — by
   * configuration alone. Default: "accepted".
   */
  acceptedField?: string;
  /**
   * Normalization applied to BOTH the learner answer and each accepted value
   * before comparing. Defaults to trim + collapse whitespace, CASE-SENSITIVE
   * (German capitalization matters). Set { toLowerCase: true } to ignore case.
   */
  normalize?: NormalizeOptions;
  /**
   * Off by default: every existing profile keeps its current exact-only
   * behavior unless a profile owner deliberately opts a specific exercise
   * type in. Whether spelling precision or typo tolerance is the right call
   * for a given exercise is a pedagogical decision for THAT exercise, not a
   * blanket engine default — see FuzzyToleranceConfig.
   */
  fuzzy?: FuzzyToleranceConfig;
}

const DEFAULT_FIELD = "accepted";
const DEFAULT_MIN_SIMILARITY = 0.75;
const DEFAULT_CREDIT_SHARE = 0.5;

/** Safely pull a string[] out of the (untyped) question reference. */
function readAcceptedList(expected: unknown, field: string): string[] {
  if (expected !== null && typeof expected === "object") {
    const value = (expected as Record<string, unknown>)[field];
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value as string[];
    }
  }
  throw new Error(
    `ExactMatch: the question reference must have a string[] field "${field}". ` +
      `Fix the profile's ExactMatch config.acceptedField or the question data.`,
  );
}

/**
 * ExactMatch — judges EXACTLY ONE aspect: does the learner's answer match one
 * of the accepted answers (after the configured normalization)? Nothing else.
 *
 * It owns no exercise-specific knowledge: the accepted list is located via
 * `config.acceptedField`, so the same instance serves synonym, titel,
 * uebersetzung, typed fill-in, and any future accepted-list exercise.
 */
export class ExactMatchSkill implements Skill<unknown, ExactMatchConfig> {
  readonly id = "ExactMatch";

  evaluate(context: SkillContext<unknown, ExactMatchConfig>): SkillResult {
    const field = context.config?.acceptedField ?? DEFAULT_FIELD;
    const options = context.config?.normalize ?? {};

    const answer = context.utils.normalizer.normalize(answerText(context.answer), options);
    if (answer === "") {
      return this.build(context, 0, "exact.match.empty");
    }

    const accepted = readAcceptedList(context.expected, field).map((value) =>
      context.utils.normalizer.normalize(value, options),
    );

    if (context.utils.matcher.equalsAny(answer, accepted)) {
      return this.build(context, context.maxPoints, "exact.match.correct");
    }

    const fuzzy = context.config?.fuzzy;
    if (fuzzy) {
      const closest = context.utils.matcher.closestMatch(answer, accepted);
      const minSimilarity = fuzzy.minSimilarity ?? DEFAULT_MIN_SIMILARITY;
      if (closest && closest.similarity >= minSimilarity) {
        const creditShare = fuzzy.creditShare ?? DEFAULT_CREDIT_SHARE;
        return this.build(context, round2(context.maxPoints * creditShare), "exact.match.typo", {
          closest: closest.candidate,
          distance: closest.distance,
        });
      }
    }

    return this.build(context, 0, "exact.match.wrong", {
      accepted: accepted.join(", "),
      count: accepted.length,
    });
  }

  private build(
    context: SkillContext<unknown, ExactMatchConfig>,
    awarded: number,
    key: string,
    params?: Record<string, string | number | boolean>,
  ): SkillResult {
    const feedback: FeedbackItem = params
      ? { key, points: awarded, skill: this.id, params }
      : { key, points: awarded, skill: this.id };
    return {
      skill: this.id,
      awarded,
      maxPoints: context.maxPoints,
      feedback: [feedback],
    };
  }
}
