import type { MeaningJudge, SkillUtilities } from "./core/utilities.ts";
import { Engine } from "./engine/Engine.ts";
import { ProfileRegistry } from "./registry/ProfileRegistry.ts";
import type { ScoringRegistry } from "./registry/ScoringRegistry.ts";
import { SkillRegistry } from "./registry/SkillRegistry.ts";
import { StrategyRegistry } from "./registry/StrategyRegistry.ts";
import { createDefaultScoringRegistry } from "./scoring/policies.ts";
import { ExactStrategy } from "./strategies/ExactStrategy.ts";
import { SemanticStrategy } from "./strategies/SemanticStrategy.ts";
import { StructuralStrategy } from "./strategies/StructuralStrategy.ts";
import { createDefaultUtilities } from "./utilities/index.ts";

/** The wired engine plus its registries, so callers can register skills/profiles. */
export interface EngineParts {
  readonly engine: Engine;
  readonly skills: SkillRegistry;
  readonly strategies: StrategyRegistry;
  readonly profiles: ProfileRegistry;
  readonly scoring: ScoringRegistry;
  readonly utils: SkillUtilities;
}

/** Options for building the engine. */
export interface CreateEngineOptions {
  /**
   * Swap in a host-provided meaning judge (e.g. an AI/embeddings backend) used
   * by comprehension skills. Defaults to the offline DefaultMeaningJudge.
   */
  readonly meaningJudge?: MeaningJudge;
}

/**
 * Composition root. Builds the registries, registers the three built-in
 * strategies and the three built-in scoring policies, and returns a ready
 * Engine.
 *
 * It intentionally registers NO skills or profiles — those grow per exam and
 * exercise type and are added by callers (or by later milestones) through the
 * returned registries. This is the single place wiring happens. A host may
 * inject a custom meaning judge here without any other change.
 */
export function createEngine(options: CreateEngineOptions = {}): EngineParts {
  const utils = createDefaultUtilities(options.meaningJudge ? { meaningJudge: options.meaningJudge } : {});
  const scoring = createDefaultScoringRegistry();
  const skills = new SkillRegistry();
  const profiles = new ProfileRegistry();
  const strategies = new StrategyRegistry();

  strategies
    .add(new ExactStrategy(utils, scoring))
    .add(new StructuralStrategy(utils, scoring))
    .add(new SemanticStrategy(utils, scoring));

  const engine = new Engine(profiles, strategies, skills);
  return { engine, skills, strategies, profiles, scoring, utils };
}
