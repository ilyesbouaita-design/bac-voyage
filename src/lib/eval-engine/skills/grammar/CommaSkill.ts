import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult } from "./reference.ts";

/** Configuration for the Comma skill. */
export interface CommaConfig {
  /**
   * Is a clause comma required? Default true — the skill is only enabled in
   * profiles where a comma is part of the objective, so it defaults to required.
   */
  required?: boolean;
}

/**
 * Comma — judges ONE aspect: is the required clause-BOUNDARY comma present?
 *
 * It consumes StructuralAnalyzer to check for a comma specifically AT the
 * boundary between clauses, not merely "a comma somewhere in the sentence".
 * This fixes a latent bug in the previous segment-count implementation: a
 * comma unrelated to the clause boundary (e.g. inside a list — "Ich kaufe
 * Äpfel, Birnen und Orangen weil ich Obst liebe.") would have been
 * miscounted as satisfying the requirement even though the actual required
 * comma (before "weil") is missing. With multiple boundaries (e.g. a
 * relative clause embedded mid-sentence), every boundary must have a comma.
 */
export class CommaSkill implements Skill<unknown, CommaConfig> {
  readonly id = "Comma";

  evaluate(context: SkillContext<unknown, CommaConfig>): SkillResult {
    const required = context.config?.required ?? true;
    const structure = context.utils.structuralAnalyzer.analyze(answerText(context.answer));
    const hasClauseComma = structure.boundaries.length > 0 && structure.boundaries.every((b) => b.hasComma);

    if (!required || hasClauseComma) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "structure.comma.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "structure.comma.missing");
  }
}
