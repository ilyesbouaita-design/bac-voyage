import { translateFeedback } from "./translations.ts";
import type { LovableCorrectionResult } from "./types.ts";

/**
 * Migration bridge (production compatibility review, Phase 0): the shape of
 * bac-voyage's CURRENT production `CorrectionResult`, confirmed directly
 * against the real `src/lib/bac-types.ts` (read in full during the Phase 1
 * migration-plan investigation): `{ is_correct, is_partial, score,
 * max_score, feedback_fr, feedback_ar?, reference_answer? }` — snake_case,
 * no `feedback_de` field at all. This interface was originally modeled on a
 * DIFFERENT, camelCase source read earlier in this project's history and
 * drifted from the real contract as a result (wrong casing on 3 fields, an
 * invented `feedback_de` field, a missing `reference_answer` field) — fixed
 * here now that the real file has been read directly. `layer`, `confidence`,
 * `manual`, and `details` are NOT part of the real `CorrectionResult`
 * interface either, but are deliberately kept: they're optional (a strict
 * superset is always assignable to a narrower interface), they carry real
 * information with no other home in the real contract, and V2's own actual
 * return type (`GradeResultV2`) already produces a comparable superset in
 * practice (`method`, `confidence`, `needsManualReview`, `details`) — so
 * this isn't inventing a new pattern, it's matching one V2 already uses.
 */
export type LegacyLayerName = "exact" | "rules" | "keywords" | "none";

export interface LegacyCorrectionResult {
  score: number;
  max_score: number;
  is_correct: boolean;
  is_partial: boolean;
  feedback_fr: string;
  /** Optional in the real contract; this converter always populates it (a safe superset), same reasoning as feedback_fr's translation. */
  feedback_ar?: string;
  /**
   * Meant to show the student a correct example when their answer wasn't
   * fully right. Left `undefined` here: `toLegacyResult()` only receives the
   * new engine's own `LovableCorrectionResult` — a FeedbackItem[] of
   * structured, language-independent keys/params — never the original
   * bac_content's accepted_answers/accepted_translations/correct_answer
   * text, since correctAnswer() doesn't thread that through to its return
   * value. Not guessed at from feedback params either (those are shaped
   * per-skill, not standardized around "the one correct example" the way
   * this field implies). A disclosed, real limitation — see recoverConfidence
   * below for the same kind of honest partial-support pattern — not
   * something to paper over without a separate, explicitly-decided change to
   * what correctAnswer() returns.
   */
  reference_answer?: string;
  layer?: LegacyLayerName;
  confidence?: number;
  manual?: boolean;
  details?: Record<string, unknown>;
}

/**
 * The new engine's `strategy` ("exact" | "structural" | "semantic") and the
 * old system's `layer` ("exact" | "rules" | "keywords" | "none") are similar
 * in spirit but not the same taxonomy — deliberately NOT force-mapped
 * one-to-one. "exact" and "structural" have honest counterparts ("exact" and
 * "rules": both deterministic, non-fuzzy grading). "semantic" does NOT map
 * to "keywords" — the semantic strategy judges MEANING via content overlap,
 * not a keyword checklist, and mislabeling it "keywords" would misdescribe
 * how it actually works. Multi-item results (mixed strategies, `strategy`
 * undefined) also have no single honest layer. Both are left undefined
 * (valid, since `layer` is optional) rather than guessed.
 */
const STRATEGY_TO_LEGACY_LAYER: Readonly<Record<string, LegacyLayerName>> = {
  exact: "exact",
  structural: "rules",
};

/**
 * Best-effort confidence recovery: `LovableCorrectionResult` does not expose
 * a general top-level confidence today (only SemanticStrategy computes one
 * internally, and it only surfaces it via the synthesized
 * "semantic.review.suggested" feedback item when a result is deferred to
 * manual review). This recovers that value for deferred semantic results.
 * For a CONFIDENT semantic result, or any exact/structural result, no
 * confidence value exists anywhere in the adapter's current output shape —
 * this is a disclosed, real limitation, not something this converter can
 * paper over without a separate, explicitly-decided change to
 * `correctAnswer()` itself (out of scope for this migration step; flagged
 * for the user, not silently worked around).
 */
function recoverConfidence(result: LovableCorrectionResult): number | undefined {
  const suggestion = result.feedback.find((item) => item.key === "semantic.review.suggested");
  const confidence = suggestion?.params?.confidence;
  return typeof confidence === "number" ? confidence : undefined;
}

/**
 * Convert the new engine's adapter output into the shape bac-voyage's
 * existing production code already expects. This is the entire migration
 * bridge: whatever currently calls the old grading engine and reads
 * `feedback_fr`/`feedback_ar` off its result can instead call
 * `correctAnswer()` then `toLegacyResult()`, with NO other change required
 * on the consuming side. `translateFeedback(..., "de")` is still available
 * directly from translations.ts for any consumer that wants it — it's just
 * not part of THIS shape, since the real CorrectionResult contract has no
 * feedback_de slot to put it in.
 */
export function toLegacyResult(result: LovableCorrectionResult): LegacyCorrectionResult {
  return {
    score: result.score,
    max_score: result.maxScore,
    is_correct: result.isCorrect,
    is_partial: result.isPartial,
    feedback_fr: translateFeedback(result.feedback, "fr"),
    feedback_ar: translateFeedback(result.feedback, "ar"),
    reference_answer: undefined,
    layer: result.strategy ? STRATEGY_TO_LEGACY_LAYER[result.strategy] : undefined,
    confidence: recoverConfidence(result),
    manual: result.manual,
    details: { strategy: result.strategy, feedbackKeys: result.feedback.map((item) => item.key) },
  };
}
