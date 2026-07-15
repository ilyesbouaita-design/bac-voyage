import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { round2 } from "../../utilities/round.ts";
import { grammarResult, resolveVerbKey } from "./reference.ts";

/** Per-profile configuration for the ExtraneousElement skill. */
export interface ExtraneousElementConfig {
  /** Same configurable-scoring convention already used by CompoundParts/DeclensionEnding. Default "proportional" (each checkable aspect is an equal share of the mark). */
  mode?: "proportional" | "all_or_nothing";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * ExtraneousElement — judges ONE aspect: did the learner insert grammatically
 * unnecessary elements into an otherwise simple modal+infinitive
 * construction? Specifically:
 *
 * 1. An internal comma — a modal+infinitive sentence has no clause boundary
 *    (unlike Satzbau's subordinate-clause constructions), so a correct
 *    answer should never contain one.
 * 2. An extraneous "zu" immediately before the expected main-verb
 *    infinitive — German modal verbs (können/müssen/dürfen/sollen/wollen/
 *    mögen) take a BARE infinitive complement, never "zu + infinitive"
 *    (unlike some other German constructions that do require "zu").
 *
 * Ported from grading-engine-v2's Modalverb grader (Migration Plan Phase
 * 7) — a real, narrow V2 strength with no equivalent in this engine before
 * now (see the migration comparison's Modalverb row: "V2 also usefully
 * flags an extraneous comma/zu after the modal, which the new engine does
 * not check"). Deliberately NOT folded into the existing CommaSkill (which
 * checks a comma IS present at a StructuralAnalyzer clause boundary — a
 * different concept, for structural-strategy profiles with real subordinate
 * clauses) and not generalized into a standalone "zu-placement" utility
 * beyond this one exercise's need: forbidding "zu" near the verb is a rule
 * of THIS construction, not a general German-grammar fact.
 *
 * The "zu" check needs to know which word is the expected main verb, so it
 * reuses the SAME resolveVerbKey/verbLemma resolution VerbLemmaSkill already
 * depends on — no separate reference shape invented. If no verbLemma can be
 * resolved (e.g. a profile that doesn't annotate answer_key.verbLemma), the
 * "zu" aspect is simply not checkable and this skill degrades gracefully to
 * judging the comma alone, rather than throwing the way VerbLemmaSkill
 * itself does — the comma check needs no verb information at all, so there
 * is no reason to fail the whole skill over the OTHER aspect's missing data.
 */
export class ExtraneousElementSkill implements Skill<unknown, ExtraneousElementConfig> {
  readonly id = "ExtraneousElement";

  evaluate(context: SkillContext<unknown, ExtraneousElementConfig>): SkillResult {
    const german = context.utils.german;
    const resolved = resolveVerbKey(context.expected, german, this.id);
    const mode = context.config?.mode ?? "proportional";
    const answer = answerText(context.answer);

    const hasComma = answer.includes(",");

    const verbLemma = resolved.verbLemma;
    const zuCheckable = verbLemma !== undefined && verbLemma !== "";
    const hasExtraneousZu =
      zuCheckable && new RegExp(`\\bzu\\s+${escapeRegExp(verbLemma)}\\b`, "iu").test(answer);

    if (!hasComma && !hasExtraneousZu) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "grammar.extraneous.none");
    }

    const checkedAspects = zuCheckable ? 2 : 1;
    const problems = (hasComma ? 1 : 0) + (hasExtraneousZu ? 1 : 0);
    const awarded =
      mode === "all_or_nothing" ? 0 : round2(context.maxPoints * ((checkedAspects - problems) / checkedAspects));

    const key =
      hasComma && hasExtraneousZu ? "grammar.extraneous.both" : hasComma ? "grammar.extraneous.comma" : "grammar.extraneous.zu";

    return grammarResult(this.id, awarded, context.maxPoints, key);
  }
}
