import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { asGrammarReference, grammarResult } from "./reference.ts";

/**
 * RelativePronoun — judges ONE aspect: is the correct relative pronoun used
 * to introduce the relative clause (e.g. "den" in "Der Mann, den ich kenne,
 * ...")? It compares the learner's chosen pronoun against the teacher's
 * expected form — EXACT match, not case/gender/number inference.
 * Reconstructing the grammatically correct case from a raw sentence pair is a
 * real parsing problem; this skill instead compares two known strings,
 * keeping the "engine never guesses" promise intact for a linguistically
 * harder aspect than anything else in this catalogue.
 *
 * It reads the subordinate clause via StructuralAnalyzer, filtered to the
 * "relativePronoun" trigger kind — the SAME analyzer VerbPosition and Comma
 * already consume, so all three skills agree on where the clause is without
 * any of them re-implementing clause-boundary detection.
 *
 * It does not check clause position (VerbPosition's job) or the
 * clause-boundary comma (Comma's job) — those compose alongside it in the
 * profile, unmodified.
 */
export class RelativePronounSkill implements Skill {
  readonly id = "RelativePronoun";

  evaluate(context: SkillContext): SkillResult {
    const analyzer = context.utils.structuralAnalyzer;
    const ref = asGrammarReference(context.expected, this.id);

    const expected =
      ref.answerKey?.relativePronoun?.toLowerCase() ??
      analyzer.analyze(ref.correctAnswer).findSubordinateClause("relativePronoun")?.trigger?.token?.toLowerCase();
    if (!expected) {
      throw new Error(
        `${this.id}: could not determine the expected relative pronoun. Annotate answerKey.relativePronoun.`,
      );
    }

    const studentClause = analyzer.analyze(answerText(context.answer)).findSubordinateClause("relativePronoun");
    if (!studentClause?.trigger) {
      return grammarResult(this.id, 0, context.maxPoints, "grammar.relative_pronoun.missing", { expected });
    }

    const studentPronoun = studentClause.trigger.token.toLowerCase();
    if (studentPronoun === expected) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.relative_pronoun.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "grammar.relative_pronoun.wrong", {
      expected,
      got: studentPronoun,
    });
  }
}
