import type { ScoreBreakdown, ScoringPolicyFn } from "../core/scoring.ts";
import type { SkillResult } from "../core/skill.ts";
import { ScoringRegistry } from "../registry/ScoringRegistry.ts";
import { round2 } from "../utilities/round.ts";

/** A skill "fully passed" when it earned its whole point value. */
function fullyPassed(result: SkillResult): boolean {
  return result.awarded >= result.maxPoints;
}

/** score = sum of awarded points. Independent partial credit (the default). */
export const sumPolicy: ScoringPolicyFn = (bySkill, maxScore): ScoreBreakdown => {
  const score = round2(bySkill.reduce((total, r) => total + r.awarded, 0));
  return {
    score,
    maxScore,
    isCorrect: maxScore > 0 && score >= maxScore,
    isPartial: score > 0 && score < maxScore,
  };
};

/** Full marks only if EVERY skill fully passes, otherwise 0. Never partial. */
export const allOrNothingPolicy: ScoringPolicyFn = (bySkill, maxScore): ScoreBreakdown => {
  const allPassed = bySkill.length > 0 && bySkill.every(fullyPassed);
  return {
    score: allPassed ? maxScore : 0,
    maxScore,
    isCorrect: allPassed && maxScore > 0,
    isPartial: false,
  };
};

/** Start at maxScore, subtract each skill's shortfall (maxPoints - awarded). */
export const deductionPolicy: ScoringPolicyFn = (bySkill, maxScore): ScoreBreakdown => {
  const shortfall = bySkill.reduce(
    (total, r) => total + Math.max(0, r.maxPoints - r.awarded),
    0,
  );
  const score = Math.max(0, round2(maxScore - shortfall));
  return {
    score,
    maxScore,
    isCorrect: maxScore > 0 && score >= maxScore,
    isPartial: score > 0 && score < maxScore,
  };
};

/** Build a scoring registry pre-loaded with the three built-in policies. */
export function createDefaultScoringRegistry(): ScoringRegistry {
  const registry = new ScoringRegistry();
  registry.add("sum", sumPolicy);
  registry.add("all_or_nothing", allOrNothingPolicy);
  registry.add("deduction", deductionPolicy);
  return registry;
}
