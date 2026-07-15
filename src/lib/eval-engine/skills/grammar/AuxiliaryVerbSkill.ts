import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/**
 * AuxiliaryVerb — judges ONE aspect: is the correct auxiliary or modal LEMMA
 * chosen (haben vs sein vs werden, or the right modal)? It ignores the exact
 * conjugated form (that is the Conjugation skill's job).
 */
export class AuxiliaryVerbSkill implements Skill {
  readonly id = "AuxiliaryVerb";

  evaluate(context: SkillContext): SkillResult {
    const german = context.utils.german;
    const key = resolveVerbKey(context.expected, german, this.id);
    const expectedLemma = key.auxiliaryLemma?.toLowerCase();
    if (!expectedLemma) {
      throw new Error(
        `${this.id}: could not determine the expected auxiliary. Annotate answerKey.auxiliaryLemma.`,
      );
    }

    const finite = german.findFiniteVerb(german.tokenize(answerText(context.answer)));
    if (!finite) {
      return grammarResult(this.id, 0, context.maxPoints, "grammar.auxiliary.wrong", {
        expected: expectedLemma,
      });
    }
    if (finite.lemma.toLowerCase() === expectedLemma) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.auxiliary.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "grammar.auxiliary.wrong", {
      expected: expectedLemma,
      got: finite.lemma,
    });
  }
}
