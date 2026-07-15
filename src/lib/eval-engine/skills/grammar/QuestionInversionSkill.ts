import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/**
 * QuestionInversion — judges ONE aspect: is the finite verb correctly
 * inverted to the SECOND position, immediately after the question word (the
 * standard German question word order)? It compares the learner's SECOND
 * token against the expected finite verb form — reusing the same
 * answerKey.finite / derivation already used by Conjugation elsewhere, since
 * the verb's form does not change between a statement and its question,
 * only its position does, so there is nothing new to annotate.
 *
 * It does not check WHICH interrogative was chosen (QuestionWord's job) —
 * only that the verb sits in position 2, whatever the first word is.
 */
export class QuestionInversionSkill implements Skill {
  readonly id = "QuestionInversion";

  evaluate(context: SkillContext): SkillResult {
    const german = context.utils.german;
    const key = resolveVerbKey(context.expected, german, this.id);
    const expected = key.finiteForm?.toLowerCase();
    if (!expected) {
      throw new Error(`${this.id}: could not determine the expected finite verb. Annotate answerKey.finite.`);
    }

    const tokens = german.tokenize(answerText(context.answer));
    const second = tokens[1]?.toLowerCase();

    if (second === expected) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.question_inversion.correct");
    }
    const reason = tokens.some((token) => token.toLowerCase() === expected) ? "not_second" : "verb_missing";
    return grammarResult(this.id, 0, context.maxPoints, "grammar.question_inversion.wrong", {
      expected,
      reason,
    });
  }
}
