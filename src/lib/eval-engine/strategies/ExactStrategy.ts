import type { EvaluationInput } from "../core/input.ts";
import type { EvaluationProfile } from "../core/profile.ts";
import type { EvaluationResult } from "../core/result.ts";
import type { ScoringResolver } from "../core/scoring.ts";
import type { SkillResolver } from "../core/skill.ts";
import type { EvaluationStrategy } from "../core/strategy.ts";
import type { SkillUtilities } from "../core/utilities.ts";
import { runSkillPipeline } from "./pipeline.ts";

/**
 * ExactStrategy — for exercises judged by direct comparison against accepted
 * answers (Titel, Synonym, Uebersetzung, typed fill-in, ...).
 *
 * It owns no grammar rules: it runs the profile's enabled skills through the
 * shared pipeline and lets the profile's ScoringPolicy aggregate the points.
 */
export class ExactStrategy implements EvaluationStrategy {
  readonly name = "exact";
  private readonly utils: SkillUtilities;
  private readonly scoring: ScoringResolver;

  constructor(utils: SkillUtilities, scoring: ScoringResolver) {
    this.utils = utils;
    this.scoring = scoring;
  }

  evaluate(
    input: EvaluationInput,
    profile: EvaluationProfile,
    skills: SkillResolver,
  ): EvaluationResult {
    return runSkillPipeline(input, profile, skills, this.utils, this.name, this.scoring);
  }
}
