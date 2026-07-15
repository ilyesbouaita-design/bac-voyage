import type { MeaningJudge, SkillUtilities } from "../core/utilities.ts";
import { DefaultGermanLinguistics } from "./german.ts";
import { DefaultMatcher } from "./Matcher.ts";
import { DefaultMeaningJudge } from "./meaningJudge.ts";
import { DefaultNormalizer } from "./Normalizer.ts";
import { DefaultTextSimilarity } from "./similarity.ts";
import { DefaultStructuralAnalyzer } from "./structuralAnalyzer.ts";

export { DefaultNormalizer } from "./Normalizer.ts";
export { DefaultMatcher } from "./Matcher.ts";
export { DefaultGermanLinguistics } from "./german.ts";
export { DefaultTextSimilarity } from "./similarity.ts";
export { DefaultMeaningJudge } from "./meaningJudge.ts";
export type { DefaultMeaningJudgeOptions } from "./meaningJudge.ts";
export { DefaultStructuralAnalyzer } from "./structuralAnalyzer.ts";

/** Optional overrides when building the default utility bundle. */
export interface DefaultUtilitiesOverrides {
  /** Swap in a host-provided (e.g. AI-backed) meaning judge. */
  readonly meaningJudge?: MeaningJudge;
}

/** Build the default utility bundle injected into skills. */
export function createDefaultUtilities(overrides: DefaultUtilitiesOverrides = {}): SkillUtilities {
  const similarity = new DefaultTextSimilarity();
  return {
    normalizer: new DefaultNormalizer(),
    matcher: new DefaultMatcher(),
    german: new DefaultGermanLinguistics(),
    similarity,
    meaningJudge: overrides.meaningJudge ?? new DefaultMeaningJudge(similarity),
    structuralAnalyzer: new DefaultStructuralAnalyzer(),
  };
}
