import type { EvaluationStrategy } from "../core/strategy.ts";
import { Registry } from "./Registry.ts";

/** Holds every available Strategy, keyed by `strategy.name`. */
export class StrategyRegistry extends Registry<EvaluationStrategy> {
  constructor() {
    super("StrategyRegistry");
  }

  /** Register a strategy under its own name. */
  add(strategy: EvaluationStrategy): this {
    return this.register(strategy.name, strategy);
  }
}
