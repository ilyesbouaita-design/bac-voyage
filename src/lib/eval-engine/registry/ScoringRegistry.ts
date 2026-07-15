import type { ScoringPolicyFn, ScoringResolver } from "../core/scoring.ts";
import { Registry } from "./Registry.ts";

/** Holds scoring-policy functions, keyed by policy name. No switch anywhere. */
export class ScoringRegistry extends Registry<ScoringPolicyFn> implements ScoringResolver {
  constructor() {
    super("ScoringRegistry");
  }

  /** Register a scoring policy under its name. */
  add(policy: string, fn: ScoringPolicyFn): this {
    return this.register(policy, fn);
  }
}
