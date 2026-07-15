import { toAnswer } from "../core/answer.ts";
import type { EvaluationInput } from "../core/input.ts";
import type { EvaluationProfile } from "../core/profile.ts";
import { profileMaxScore } from "../core/profile.ts";
import type { EvaluationResult } from "../core/result.ts";
import type { ScoringResolver } from "../core/scoring.ts";
import type { SkillResolver, SkillResult } from "../core/skill.ts";
import type { SkillUtilities } from "../core/utilities.ts";

/**
 * The shared skill-execution pipeline used by skill-driven strategies.
 *
 * It resolves each enabled skill from the registry, runs it, then applies the
 * profile's ScoringPolicy to turn the per-skill results into a final score. It
 * contains NO grammar rules and no per-exercise-type branching — the profile
 * alone decides which skills run, how many points each is worth, and how those
 * points aggregate.
 */
export function runSkillPipeline(
  input: EvaluationInput,
  profile: EvaluationProfile,
  skills: SkillResolver,
  utils: SkillUtilities,
  strategyName: string,
  scoring: ScoringResolver,
): EvaluationResult {
  const bySkill: SkillResult[] = [];
  const answer = toAnswer(input.answer); // normalize once: string or Answer -> Answer

  for (const binding of profile.skills) {
    const skill = skills.get(binding.skill); // dynamic resolution — never a switch
    const result = skill.evaluate({
      answer,
      expected: input.reference,
      maxPoints: binding.points,
      config: binding.config,
      utils,
    });
    bySkill.push(result);
  }

  const maxScore = profileMaxScore(profile);
  const policy = scoring.get(profile.scoring ?? "sum"); // resolve policy — never a switch
  const breakdown = policy(bySkill, maxScore);
  const feedback = bySkill.flatMap((r) => r.feedback);

  return {
    exerciseType: profile.exerciseType,
    strategy: strategyName,
    score: breakdown.score,
    maxScore: breakdown.maxScore,
    isCorrect: breakdown.isCorrect,
    isPartial: breakdown.isPartial,
    feedback,
    bySkill,
  };
}
