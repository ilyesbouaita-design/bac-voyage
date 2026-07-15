import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/**
 * PartizipII — judges ONE aspect: is the Partizip II form exactly correct
 * (e.g. "gespielt")? A right verb in a wrong participle form fails here; the
 * "right verb" question is the VerbLemma skill's job.
 */
export class PartizipIISkill implements Skill {
  readonly id = "PartizipII";

  evaluate(context: SkillContext): SkillResult {
    const german = context.utils.german;
    const key = resolveVerbKey(context.expected, german, this.id);
    const expected = key.partizip?.toLowerCase();
    if (!expected) {
      throw new Error(
        `${this.id}: could not determine the expected Partizip II. Annotate answerKey.partizip.`,
      );
    }

    const found = german.tokenize(answerText(context.answer)).find((token) => german.isPartizipII(token));
    if (!found) {
      return grammarResult(this.id, 0, context.maxPoints, "grammar.partizip.wrong", { expected });
    }
    if (found.toLowerCase() === expected) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.partizip.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "grammar.partizip.wrong", {
      expected,
      got: found,
    });
  }
}
