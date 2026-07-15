/**
 * Structured, language-independent feedback.
 *
 * The engine NEVER returns translated text. Each item is a stable key, the
 * points it accounts for, and the skill that produced it. The Lovable frontend
 * maps `key` -> localized text (FR / AR-RTL) and may interpolate `params`.
 */
export interface FeedbackItem {
  /** Stable, dotted key. Example: "grammar.auxiliary.correct". */
  key: string;
  /** Points this item accounts for. May be 0. Never a percentage. */
  points: number;
  /** Id of the skill that produced this item. Example: "AuxiliaryVerb". */
  skill: string;
  /**
   * Optional machine values for frontend interpolation (expected word, index,
   * count, ...). NEVER localized text.
   */
  params?: Record<string, string | number | boolean>;
}
