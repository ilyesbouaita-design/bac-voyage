import { answerString } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import type { NormalizeOptions } from "../../core/utilities.ts";
import { round2 } from "../../utilities/round.ts";
import { readAcceptedZitate, readingResult } from "./reference.ts";

/** Per-profile configuration for the Zitat skill. */
export interface ZitatConfig {
  /**
   * Fraction of the skill's points awarded when the correct sentence is present
   * but the learner over-quoted (too_long). Default 0.5 (so a 0.5 skill -> 0.25).
   */
  tooLongFactor?: number;
  /**
   * Content-overlap coverage at or above which a non-verbatim quote is judged a
   * paraphrase (which a Zitat may not be) rather than simply a wrong quote.
   * Default 0.6.
   */
  paraphraseThreshold?: number;
}

const NORM: NormalizeOptions = {
  trim: true,
  collapseWhitespace: true,
  toLowerCase: true,
  stripTrailingPunctuation: true,
};

/**
 * Zitat — judges ONE aspect: did the learner quote the correct sentence
 * (verbatim) as justification? Verdicts, in priority order:
 *  - missing    (nothing quoted)
 *  - correct    (verbatim match of an accepted quote)
 *  - too_long   (an accepted quote is present but the learner over-quoted)
 *  - paraphrase (high content overlap but not verbatim — not a valid Zitat)
 *  - wrong      (a different sentence)
 * It uses the normalizer for verbatim comparison and the content-overlap
 * utility to distinguish a paraphrase from an unrelated quote.
 */
export class ZitatMatchSkill implements Skill<unknown, ZitatConfig> {
  readonly id = "Zitat";

  evaluate(context: SkillContext<unknown, ZitatConfig>): SkillResult {
    const tooLongFactor = context.config?.tooLongFactor ?? 0.5;
    const paraphraseThreshold = context.config?.paraphraseThreshold ?? 0.6;
    const normalizer = context.utils.normalizer;

    const student = normalizer.normalize(answerString(context.answer, "zitat"), NORM);
    if (student === "") {
      return readingResult(this.id, 0, context.maxPoints, "reading.zitat.missing");
    }

    const accepted = readAcceptedZitate(context.expected, this.id).map((z) => normalizer.normalize(z, NORM));

    if (accepted.some((a) => a === student)) {
      return readingResult(this.id, context.maxPoints, context.maxPoints, "reading.zitat.correct");
    }
    if (accepted.some((a) => a.length > 0 && student.includes(a))) {
      return readingResult(this.id, round2(context.maxPoints * tooLongFactor), context.maxPoints, "reading.zitat.too_long");
    }

    let bestCoverage = 0;
    for (const a of accepted) {
      const coverage = context.utils.similarity.overlap(a, student).coverage;
      if (coverage > bestCoverage) bestCoverage = coverage;
    }
    if (bestCoverage >= paraphraseThreshold) {
      return readingResult(this.id, 0, context.maxPoints, "reading.zitat.paraphrase", {
        coverage: round2(bestCoverage),
      });
    }
    return readingResult(this.id, 0, context.maxPoints, "reading.zitat.wrong");
  }
}
