import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/**
 * VerbLemma — judges ONE aspect: is the intended MAIN verb used (the right
 * word), regardless of its exact form? It passes if the learner's answer
 * contains a token with the expected stem, or the exact expected Partizip. It
 * does not judge the participle form (that is the PartizipII skill's job).
 */
export class VerbLemmaSkill implements Skill {
  readonly id = "VerbLemma";

  evaluate(context: SkillContext): SkillResult {
    const german = context.utils.german;
    const key = resolveVerbKey(context.expected, german, this.id);
    const expectedStem = key.verbStem;
    const expectedPartizip = key.partizip?.toLowerCase();
    if (!expectedStem && !expectedPartizip) {
      throw new Error(
        `${this.id}: could not determine the expected verb. Annotate answerKey.verbLemma.`,
      );
    }

    const tokens = german.tokenize(answerText(context.answer));
    const stemMatch = expectedStem !== undefined && tokens.some((t) => german.stem(t) === expectedStem);
    const partizipMatch =
      expectedPartizip !== undefined && tokens.some((t) => t.toLowerCase() === expectedPartizip);

    if (stemMatch || partizipMatch) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.verb.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "grammar.verb.wrong", {
      expected: key.verbLemma ?? expectedStem ?? expectedPartizip ?? "",
    });
  }
}
