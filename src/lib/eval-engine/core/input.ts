import type { AnswerInput } from "./answer.ts";

/**
 * A single evaluation request: one learner answer to one question of a known
 * exercise type. The engine uses `exerciseType` (or `profileKey`) to resolve
 * the profile; `reference` carries the question's correct data.
 */
export interface EvaluationInput<TReference = unknown> {
  /**
   * Exercise type. Resolves the profile when `profileKey` is omitted.
   * Example: "synonym", or the exam's generic outer type for a sub-typed
   * exercise, e.g. "grammatik_tempus" (paired with `profileKey` below).
   */
  readonly exerciseType: string;
  /**
   * The learner's answer, as the typed Answer model — a bare string is also
   * accepted and treated as a text answer. Never a transport/JSON string.
   */
  readonly answer: AnswerInput;
  /** Question reference data (accepted answers, correct sentence, ...). Shape varies. */
  readonly reference: TReference;
  /** Optional exam-system hint (organization only; the engine stays agnostic). */
  readonly examSystem?: string;
  /**
   * Optional explicit profile key, REQUIRED for sub-typed exercises. Example:
   * exerciseType "grammatik_tempus" + profileKey "tempus.perfekt" selects the
   * Perfekt-specific profile (the caller derives it from the question's own
   * data, e.g. its `tense` field — the engine never guesses which sub-type
   * applies). Defaults to `exerciseType` when omitted.
   */
  readonly profileKey?: string;
}
