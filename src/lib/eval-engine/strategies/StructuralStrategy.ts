import type { EvaluationInput } from "../core/input.ts";
import type { EvaluationProfile } from "../core/profile.ts";
import type { EvaluationResult } from "../core/result.ts";
import type { ScoringResolver } from "../core/scoring.ts";
import type { SkillResolver } from "../core/skill.ts";
import type { EvaluationStrategy } from "../core/strategy.ts";
import type { SkillUtilities } from "../core/utilities.ts";
import { runSkillPipeline } from "./pipeline.ts";

/**
 * StructuralStrategy — runs rule-based grammatical skills (verb position,
 * comma, and morphological verb checks) through the shared pipeline, then lets
 * the profile's ScoringPolicy aggregate (e.g. all_or_nothing for Tempus,
 * deduction for Satzbau).
 *
 * Mechanically it currently mirrors ExactStrategy (resolve skills, run, apply
 * policy). It stays a distinct class because it is where sentence-level
 * preprocessing and short-circuits will live as the grammar coverage grows.
 * It contains NO grammar rules itself — those are in the skills and utilities.
 */
export class StructuralStrategy implements EvaluationStrategy {
  readonly name = "structural";
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
