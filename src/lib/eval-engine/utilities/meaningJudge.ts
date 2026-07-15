import type {
  MeaningContext,
  MeaningJudge,
  MeaningTarget,
  MeaningVerdict,
  TextSimilarity,
} from "../core/utilities.ts";
import { round2 } from "./round.ts";
import { DefaultTextSimilarity } from "./similarity.ts";

export interface DefaultMeaningJudgeOptions {
  /** Content coverage at/above which expression is CONFIRMED on its own. Default 0.6. */
  confirmCoverage?: number;
  /** Coverage at/above which, WITH a supporting keyword, expression is confirmed. Default 0.3. */
  keywordAssistCoverage?: number;
}

/**
 * The default, offline MeaningJudge. It weighs content overlap between the
 * candidate and the target (the required-information point), using keywords as
 * supporting evidence that raises confidence. It is deliberately asymmetric:
 *
 *  - Strong evidence  -> expressed = true with high confidence (safe to auto-grade).
 *  - Empty answer     -> expressed = false with FULL confidence (a confident zero).
 *  - Weak evidence    -> expressed = false with LOW confidence, i.e. "unsure":
 *                        a differently-worded answer we cannot confirm is left to
 *                        a human, NEVER scored wrong on wording alone.
 *
 * A richer host judge (embeddings/LLM) can replace this to truly understand
 * paraphrase; the skill and engine never change.
 */
export class DefaultMeaningJudge implements MeaningJudge {
  private readonly similarity: TextSimilarity;
  private readonly confirmCoverage: number;
  private readonly keywordAssistCoverage: number;

  constructor(similarity: TextSimilarity = new DefaultTextSimilarity(), options: DefaultMeaningJudgeOptions = {}) {
    this.similarity = similarity;
    this.confirmCoverage = options.confirmCoverage ?? 0.6;
    this.keywordAssistCoverage = options.keywordAssistCoverage ?? 0.3;
  }

  judge(candidate: string, target: MeaningTarget, _context?: MeaningContext): MeaningVerdict {
    if (candidate.trim() === "") {
      return { expressed: false, confidence: 1, evidence: [] };
    }

    const overlap = this.similarity.overlap(target.text, candidate);
    const coverage = overlap.coverage;

    const keywords = target.keywords ?? [];
    const candidateTokens = new Set(this.similarity.contentTokens(candidate));
    const keywordHits = keywords.filter((k) => candidateTokens.has(k.toLowerCase()));
    const hasKeyword = keywordHits.length > 0;

    if (coverage >= this.confirmCoverage) {
      return { expressed: true, confidence: round2(coverage), evidence: overlap.matched };
    }
    if (hasKeyword && coverage >= this.keywordAssistCoverage) {
      return { expressed: true, confidence: round2(Math.max(coverage, 0.6)), evidence: [...overlap.matched, ...keywordHits] };
    }
    if (hasKeyword) {
      // A keyword hints at the point, but overlap is weak: a positive lean, still uncertain.
      return { expressed: true, confidence: round2(Math.max(coverage, 0.4)), evidence: keywordHits };
    }
    // Cannot confirm. Could be an unrelated answer OR an unrecognized paraphrase.
    return { expressed: false, confidence: round2(coverage), evidence: [] };
  }
}
