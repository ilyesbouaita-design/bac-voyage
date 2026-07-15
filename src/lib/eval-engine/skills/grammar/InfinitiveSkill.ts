import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/**
 * Infinitive — judges ONE aspect: is the correct main-verb INFINITIVE present
 * (e.g. "spielen" in "Ich werde Fußball spielen")? This is the genuinely new
 * linguistic objective Futur introduces: unlike Perfekt/Passiv's participle,
 * the main verb here keeps its bare dictionary form.
 *
 * The infinitive of a German verb IS its lemma, so this reads the same
 * answerKey.verbLemma field VerbLemma uses — but checks it via an EXACT token
 * match (the correct FORM), not VerbLemma's stem-fuzzy match (any form of the
 * right verb). That distinction is exactly why PartizipII and VerbLemma stay
 * separate for Perfekt/Passiv, and it applies identically here: Infinitive
 * confirms both the right verb AND the right (infinitive) form in one check,
 * which is why a dedicated VerbLemma check is unnecessary for Futur.
 */
export class InfinitiveSkill implements Skill {
  readonly id = "Infinitive";

  evaluate(context: SkillContext): SkillResult {
    const german = context.utils.german;
    const key = resolveVerbKey(context.expected, german, this.id);
    const expected = key.verbLemma?.toLowerCase();
    if (!expected) {
      throw new Error(
        `${this.id}: could not determine the expected infinitive. Annotate answerKey.verbLemma.`,
      );
    }

    const found = german.tokenize(answerText(context.answer)).some((token) => token.toLowerCase() === expected);
    if (found) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.infinitive.correct");
    }
    return grammarResult(this.id, 0, context.maxPoints, "grammar.infinitive.wrong", { expected });
  }
}
