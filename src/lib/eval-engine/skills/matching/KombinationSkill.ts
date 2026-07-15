import { answerString } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { asKombinationReference, matchResult } from "./reference.ts";
import { round2 } from "../../utilities/round.ts";

/** Per-profile configuration for the Kombination skill. */
export interface KombinationConfig {
  /**
   * How points are awarded across the pairs. Default "proportional" (each pair
   * is an equal share of the mark); "all_or_nothing" awards the full mark only
   * if every pair is correct. The PROFILE decides.
   */
  mode?: "proportional" | "all_or_nothing";
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Kombination — judges ONE aspect: are the items matched correctly? It reads
 * the learner's mapping (the compound answer's parts, one per left label) and
 * compares each to the answer key. It awards points for the correct pairs —
 * proportionally by default, or all-or-nothing when the profile configures it.
 * The number of pairs can vary per question, so proportional scoring keeps the
 * profile (per exercise TYPE) correct regardless of item count.
 */
export class KombinationSkill implements Skill<unknown, KombinationConfig> {
  readonly id = "Kombination";

  evaluate(context: SkillContext<unknown, KombinationConfig>): SkillResult {
    const ref = asKombinationReference(context.expected, this.id);
    const mode = context.config?.mode ?? "proportional";
    const labels = Object.keys(ref.answer_key);

    if (labels.length === 0) {
      return matchResult(this.id, context.maxPoints, context.maxPoints, "match.combine.correct", { correct: 0, total: 0 });
    }

    let correct = 0;
    let answered = 0;
    const wrong: string[] = [];
    for (const label of labels) {
      const student = normalizeLabel(answerString(context.answer, label));
      const expected = normalizeLabel(ref.answer_key[label] ?? "");
      if (student !== "") answered += 1;
      if (student !== "" && student === expected) correct += 1;
      else wrong.push(label);
    }

    if (answered === 0) {
      return matchResult(this.id, 0, context.maxPoints, "match.combine.empty", { correct: 0, total: labels.length });
    }

    const ratio = correct / labels.length;
    const awarded =
      mode === "all_or_nothing"
        ? correct === labels.length
          ? context.maxPoints
          : 0
        : round2(context.maxPoints * ratio);

    const key =
      correct === labels.length
        ? "match.combine.correct"
        : correct === 0
          ? "match.combine.none"
          : "match.combine.partial";

    return matchResult(this.id, awarded, context.maxPoints, key, {
      correct,
      total: labels.length,
      wrong: wrong.join(","),
    });
  }
}
