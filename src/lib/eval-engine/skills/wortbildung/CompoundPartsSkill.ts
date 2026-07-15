import { answerString } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { round2 } from "../../utilities/round.ts";
import { asCompoundPartsReference, wortbildungResult } from "./reference.ts";

/** Per-profile configuration for the CompoundParts skill. */
export interface CompoundPartsConfig {
  /** Same configurable-scoring convention already used by DeclensionEnding/Kombination. Default "proportional" (each of the 2 parts is half the mark). */
  mode?: "proportional" | "all_or_nothing";
  /** Case-sensitive comparison. Default true. Set false to match bac-voyage's own WortbildungCard, which compares case-insensitively. */
  caseSensitive?: boolean;
}

/**
 * CompoundParts — judges ONE aspect: decomposing a German compound noun
 * (Kompositum) into its two constituent words. Structurally the same shape
 * as DeclensionEnding's "several small gaps, judged independently, credit
 * proportional to how many are right" pattern — just 2 NAMED gaps
 * ("word1"/"word2", matching the real content's own field names, mirrored
 * throughout this adapter) instead of N positional ones from a template.
 *
 * Kept separate from DeclensionEndingSkill rather than generalizing that one
 * to "named OR positional gaps": the two are shaped for different content
 * (a free-form array vs. two fixed, always-present fields) and forcing one
 * skill to serve both would trade a clear per-family reference.ts for a
 * config surface no profile actually needs to flex.
 */
export class CompoundPartsSkill implements Skill<unknown, CompoundPartsConfig> {
  readonly id = "CompoundParts";

  evaluate(context: SkillContext<unknown, CompoundPartsConfig>): SkillResult {
    const ref = asCompoundPartsReference(context.expected, this.id);
    const mode = context.config?.mode ?? "proportional";
    const caseSensitive = context.config?.caseSensitive ?? true;
    const normalize = (value: string) => (caseSensitive ? value.trim() : value.trim().toLowerCase());

    const studentWord1 = answerString(context.answer, "word1");
    const studentWord2 = answerString(context.answer, "word2");

    if (studentWord1 === "" && studentWord2 === "") {
      return wortbildungResult(this.id, 0, context.maxPoints, "vocab.compound.missing");
    }

    let correct = 0;
    const wrongParts: string[] = [];
    if (normalize(studentWord1) === normalize(ref.word1)) {
      correct += 1;
    } else {
      wrongParts.push("word1");
    }
    if (normalize(studentWord2) === normalize(ref.word2)) {
      correct += 1;
    } else {
      wrongParts.push("word2");
    }

    const awarded =
      mode === "all_or_nothing" ? (correct === 2 ? context.maxPoints : 0) : round2(context.maxPoints * (correct / 2));

    const key = correct === 2 ? "vocab.compound.correct" : correct === 0 ? "vocab.compound.wrong" : "vocab.compound.partial";

    return wortbildungResult(this.id, awarded, context.maxPoints, key, {
      correct,
      total: 2,
      wrongParts: wrongParts.join(","),
    });
  }
}
