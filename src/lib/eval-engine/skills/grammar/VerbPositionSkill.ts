import { answerText } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import type { Clause, StructuralAnalyzer } from "../../core/utilities.ts";
import { asGrammarReference, grammarResult } from "./reference.ts";

/** Per-profile configuration for the VerbPosition skill. */
export interface VerbPositionConfig {
  /**
   * Trigger kinds this skill treats as verb-final clauses. Defaults to
   * ["conjunction", "relativePronoun"] — both produce a clause with a finite
   * verb that must sit at the end. A future zu-infinitive trigger kind (no
   * finite verb at all) would NOT be included here, so this skill never
   * misapplies verb-final checking to a clause it doesn't structurally fit.
   */
  acceptedTriggerKinds?: string[];
}

const DEFAULT_ACCEPTED_KINDS = ["conjunction", "relativePronoun"];

function findAcceptedClause(
  analyzer: StructuralAnalyzer,
  sentence: string,
  acceptedKinds: readonly string[],
): Clause | undefined {
  const clause = analyzer.analyze(sentence).findSubordinateClause();
  if (!clause?.trigger) return undefined;
  return acceptedKinds.includes(clause.trigger.kind) ? clause : undefined;
}

/**
 * VerbPosition — judges ONE aspect: in a subordinate clause, the finite verb
 * must sit at the END (verb-final). It compares the learner's subordinate
 * clause final word against the expected clause-final verb (from the answer
 * key or derived from the correct answer), so a misplaced verb, a wrong verb,
 * or a missing subordinate clause each fail — with a distinguishing `reason`.
 *
 * It consumes the StructuralAnalyzer for clause-boundary detection instead of
 * scanning for conjunctions itself — this is what lets ONE skill serve every
 * conjunction-based Satzbau clause type (Temporalsatz, Finalsatz, Kausalsatz,
 * Konditionalsatz, Konzessivsatz) AND relative clauses, with no hardcoded
 * word list inside the skill. acceptedTriggerKinds keeps it from misapplying
 * verb-final checking to a future non-finite trigger kind (e.g. a
 * zu-infinitive marker).
 */
export class VerbPositionSkill implements Skill<unknown, VerbPositionConfig> {
  readonly id = "VerbPosition";

  evaluate(context: SkillContext<unknown, VerbPositionConfig>): SkillResult {
    const analyzer = context.utils.structuralAnalyzer;
    const ref = asGrammarReference(context.expected, this.id);
    const acceptedKinds = context.config?.acceptedTriggerKinds ?? DEFAULT_ACCEPTED_KINDS;

    const expectedFinal =
      ref.answerKey?.subordinateFinal?.toLowerCase() ??
      findAcceptedClause(analyzer, ref.correctAnswer, acceptedKinds)?.tokens.at(-1)?.toLowerCase();
    if (!expectedFinal) {
      throw new Error(
        `${this.id}: could not determine the expected clause-final verb. Annotate answerKey.subordinateFinal.`,
      );
    }

    const studentClause = findAcceptedClause(analyzer, answerText(context.answer), acceptedKinds);
    if (!studentClause) {
      return grammarResult(this.id, 0, context.maxPoints, "structure.verb_position.wrong", {
        expected: expectedFinal,
        reason: "no_subordinate_clause",
      });
    }

    const studentFinal = studentClause.tokens.at(-1)?.toLowerCase();
    if (studentFinal === expectedFinal) {
      return grammarResult(this.id, context.maxPoints, context.maxPoints, "structure.verb_position.correct");
    }

    const reason = studentClause.tokens.some((token) => token.toLowerCase() === expectedFinal)
      ? "not_final"
      : "verb_missing";
    return grammarResult(this.id, 0, context.maxPoints, "structure.verb_position.wrong", {
      expected: expectedFinal,
      reason,
    });
  }
}
