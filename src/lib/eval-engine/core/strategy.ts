import type { EvaluationInput } from "./input.ts";
import type { EvaluationProfile } from "./profile.ts";
import type { EvaluationResult } from "./result.ts";
import type { SkillResolver } from "./skill.ts";

/**
 * A Strategy decides HOW a profile's skills are executed and how their results
 * are aggregated. It contains NO grammar rules — those live in Skills.
 *
 * The three strategies (exact, structural, semantic) are interchangeable behind
 * this single interface. The Engine selects one by name, from the profile.
 */
export interface EvaluationStrategy {
  /** Registry name. One of: "exact" | "structural" | "semantic" (extensible). */
  readonly name: string;
  evaluate(
    input: EvaluationInput,
    profile: EvaluationProfile,
    skills: SkillResolver,
  ): EvaluationResult;
}
