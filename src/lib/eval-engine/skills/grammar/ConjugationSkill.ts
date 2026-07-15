import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/**
 * Conjugation — judges ONE aspect: is the finite verb in the exact expected
 * form for the subject (e.g. "habe" for "ich", not "hat")? It checks the form,
 * not which verb/auxiliary/modal LEMMA was chosen (that is AuxiliaryVerb's or
 * VerbLemma's job).
 *
 * It works for ANY finite verb — an auxiliary (Perfekt, Passiv), a modal
 * (Modalverb), or a lexical MAIN verb with no auxiliary at all (Präsens,
 * Präteritum) — because it checks directly whether the expected finite token
 * is present in the answer, rather than first trying to LOCATE "the" finite
 * verb via the (auxiliary/modal-only) linguistics lexicon. This is what makes
 * ONE skill reusable across every tense, not just the periphrastic ones.
 *
 * Known limitation: this is a token-presence check, not a full parse, so a
 * coincidental appearance of the expected word elsewhere in a longer answer
 * would be scored as a pass. Acceptable for the short, single-clause answers
 * these exercises expect; revisit if longer free-form answers are supported.
 */
export class ConjugationSkill implements Skill {
  readonly id = "Conjugation";

  evaluate(context: SkillContext): SkillResult {
    const german = context.utils.german;
    const key = resolveVerbKey(context.expected, german, this.id);
    const expected = key.finiteForm?.toLowerCase();
    if (!expected) {
      throw new Error(
        `${this.id}: could not determine the expected finite verb form. Annotate answerKey.finite.`,
      );
    }

    const tokens = german.tokenize(answerText(context.answer));
    if (tokens.some((token) => token.toLowerCase() === expected)) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.conjugation.correct");
    }

    // Not found — try to surface what finite auxiliary/modal WAS used, if any,
    // as a diagnostic hint. For lexical main-verb tenses (no aux/modal), this
    // stays undefined and the feedback simply omits "got".
    const finite = german.findFiniteVerb(tokens);
    return grammarResult(
      this.id,
      0,
      context.maxPoints,
      "grammar.conjugation.wrong",
      finite ? { expected, got: finite.token } : { expected },
    );
  }
}
