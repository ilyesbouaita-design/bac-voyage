import { answerField } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { asDeclensionReference, declensionResult, expectedGapValues } from "./reference.ts";
import { round2 } from "../../utilities/round.ts";

/** Per-profile configuration for the DeclensionEnding skill. */
export interface DeclensionEndingConfig {
  /**
   * How points are awarded across gaps. Default "proportional" (each gap is
   * a share of the mark); "all_or_nothing" awards the full mark only if
   * every gap is correct. Same configurable-scoring convention already used
   * by Kombination and InformationExpressed — not a new decision.
   */
  mode?: "proportional" | "all_or_nothing";
  /** Case-sensitive comparison. Default true (German endings/case matter). */
  caseSensitive?: boolean;
}

function readEndings(context: SkillContext<unknown, DeclensionEndingConfig>): string[] {
  const value = answerField(context.answer, "endings");
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return [];
}

/**
 * DeclensionEnding — judges ONE aspect: are the article/adjective endings in
 * each gap of a Deklination template correct? The template's own bracket
 * contents ARE the expected values (e.g. "D[er] groß[e] Hund" expects "er"
 * then "e") — reusing the teacher's existing authored content directly, no
 * separate answer key needed.
 *
 * Each gap is judged independently; points are awarded PROPORTIONALLY by
 * default across however many gaps the template has (the profile may set
 * mode: "all_or_nothing" instead).
 */
export class DeclensionEndingSkill implements Skill<unknown, DeclensionEndingConfig> {
  readonly id = "DeclensionEnding";

  evaluate(context: SkillContext<unknown, DeclensionEndingConfig>): SkillResult {
    const ref = asDeclensionReference(context.expected, this.id);
    const mode = context.config?.mode ?? "proportional";
    const caseSensitive = context.config?.caseSensitive ?? true;
    const expected = expectedGapValues(ref.template);

    if (expected.length === 0) {
      return declensionResult(this.id, context.maxPoints, context.maxPoints, "grammar.declension.correct", {
        correct: 0,
        total: 0,
      });
    }

    const studentEndings = readEndings(context);
    if (studentEndings.length === 0 || studentEndings.every((ending) => ending.trim() === "")) {
      return declensionResult(this.id, 0, context.maxPoints, "grammar.declension.missing", {
        correct: 0,
        total: expected.length,
      });
    }

    const normalize = (value: string) => (caseSensitive ? value.trim() : value.trim().toLowerCase());
    let correct = 0;
    const wrongGaps: number[] = [];
    for (let i = 0; i < expected.length; i++) {
      const studentValue = studentEndings[i] ?? "";
      if (normalize(studentValue) === normalize(expected[i] ?? "")) {
        correct += 1;
      } else {
        wrongGaps.push(i);
      }
    }

    const ratio = correct / expected.length;
    const awarded =
      mode === "all_or_nothing"
        ? correct === expected.length
          ? context.maxPoints
          : 0
        : round2(context.maxPoints * ratio);

    const key =
      correct === expected.length
        ? "grammar.declension.correct"
        : correct === 0
          ? "grammar.declension.wrong"
          : "grammar.declension.partial";

    return declensionResult(this.id, awarded, context.maxPoints, key, {
      correct,
      total: expected.length,
      wrongGaps: wrongGaps.join(","),
    });
  }
}
