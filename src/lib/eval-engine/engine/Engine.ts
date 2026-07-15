import type { EvaluationInput } from "../core/input.ts";
import type { EvaluationResult } from "../core/result.ts";
import type { ProfileRegistry } from "../registry/ProfileRegistry.ts";
import type { SkillRegistry } from "../registry/SkillRegistry.ts";
import type { StrategyRegistry } from "../registry/StrategyRegistry.ts";

/**
 * The Engine is a THIN orchestrator and the only object a caller needs to touch.
 * For each request it:
 *   1. reads the EvaluationProfile for the exercise type,
 *   2. selects the Strategy the profile declares,
 *   3. executes that strategy,
 *   4. returns the EvaluationResult.
 *
 * It holds NO grammar rules, performs NO branching on exercise type, and never
 * guesses. It is exam-agnostic: supporting BAC / Goethe / TELC / school exams
 * means registering more Profiles and Skills — the Engine itself never changes.
 */
export class Engine {
  private readonly profiles: ProfileRegistry;
  private readonly strategies: StrategyRegistry;
  private readonly skills: SkillRegistry;

  constructor(
    profiles: ProfileRegistry,
    strategies: StrategyRegistry,
    skills: SkillRegistry,
  ) {
    this.profiles = profiles;
    this.strategies = strategies;
    this.skills = skills;
  }

  evaluate(input: EvaluationInput): EvaluationResult {
    const profile = this.profiles.get(input.profileKey ?? input.exerciseType);
    const strategy = this.strategies.get(profile.strategy);
    return strategy.evaluate(input, profile, this.skills);
  }
}
