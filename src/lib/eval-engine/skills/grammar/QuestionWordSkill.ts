import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { asGrammarReference, grammarResult } from "./reference.ts";

/**
 * QuestionWord — judges ONE aspect: is the correct interrogative (wer, was,
 * wann, wo, warum, wie, woher, wohin, ...) used to form the question? It
 * compares the learner's FIRST word against the teacher's expected question
 * word — deterministic, teacher-specified via answerKey.questionWord.
 *
 * Which interrogative correctly targets a given underlined constituent is a
 * semantic/world-knowledge judgment (is "in München" a place, prompting
 * "Wo"? a time, prompting "Wann"?) that this engine does not attempt to
 * infer — the teacher states it, the skill only verifies it.
 */
export class QuestionWordSkill implements Skill {
  readonly id = "QuestionWord";

  evaluate(context: SkillContext): SkillResult {
    const ref = asGrammarReference(context.expected, this.id);
    const expected = ref.answerKey?.questionWord?.toLowerCase();
    if (!expected) {
      throw new Error(
        `${this.id}: could not determine the expected question word. Annotate answerKey.questionWord.`,
      );
    }

    const tokens = context.utils.german.tokenize(answerText(context.answer));
    const first = tokens[0]?.toLowerCase();

    if (first === expected) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.question_word.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "grammar.question_word.wrong", {
      expected,
      got: first ?? "",
    });
  }
}
