import type { Answer } from "./answer.ts";
import type { FeedbackItem } from "./feedback.ts";
import type { SkillUtilities } from "./utilities.ts";

/**
 * Everything a skill needs to judge ONE linguistic aspect.
 *
 * - `answer`    the learner's raw typed answer.
 * - `expected`  reference data for the question (shape varies per skill).
 * - `maxPoints` the EXACT points the profile assigned to this skill.
 * - `config`    optional per-profile configuration for this binding.
 * - `utils`     shared, language-independent helpers.
 */
export interface SkillContext<TExpected = unknown, TConfig = unknown> {
  /** The learner's answer as the typed model. Use answerText()/answerString() to read it. */
  readonly answer: Answer;
  readonly expected: TExpected;
  readonly maxPoints: number;
  readonly config?: TConfig;
  readonly utils: SkillUtilities;
}

/** The outcome of one skill judging one aspect. */
export interface SkillResult {
  /** Skill id. Example: "AuxiliaryVerb". */
  readonly skill: string;
  /** Points awarded, between 0 and `maxPoints`. The engine simply sums these. */
  readonly awarded: number;
  /** The skill's max points (echoes the profile binding). */
  readonly maxPoints: number;
  /** Structured feedback produced by this skill. */
  readonly feedback: FeedbackItem[];
  /**
   * Optional 0..1 certainty of this judgment. SemanticStrategy uses it to defer
   * low-confidence results to human review. Absent means fully confident.
   */
  readonly confidence?: number;
  /** Optional non-localized diagnostics. */
  readonly details?: Record<string, unknown>;
}

/**
 * A Skill evaluates EXACTLY ONE linguistic aspect and nothing else.
 *
 * Skills are pure functions of their context: no I/O, no translation, and no
 * knowledge of the engine, the strategy, or other skills. New skills are added
 * by registering them in the SkillRegistry — no existing strategy or the engine
 * ever changes.
 */
export interface Skill<TExpected = unknown, TConfig = unknown> {
  /** Unique registry id. Example: "ExactMatch", "VerbPosition". */
  readonly id: string;
  evaluate(context: SkillContext<TExpected, TConfig>): SkillResult;
}

/**
 * A skill of any shape. Used at heterogeneous boundaries (the registry stores
 * skills with differing `TExpected`/`TConfig`). Type safety is preserved inside
 * each concrete skill, which reads its own `expected`/`config` shape.
 */
export type AnySkill = Skill<any, any>;

/**
 * Build a one-item SkillResult with a single structured feedback entry.
 *
 * Every skill family has its own thin, same-named wrapper around this
 * (grammarResult, semanticResult, readingResult, matchResult,
 * connectorResult, declensionResult) purely for call-site readability
 * (`grammarResult(...)` reads better inside a grammar skill than a generic
 * name would) — but the actual construction logic lives here ONCE, not
 * copy-pasted into each family's reference.ts.
 */
export function buildSkillResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
  confidence?: number,
): SkillResult {
  const item: FeedbackItem = params
    ? { key, points: awarded, skill, params }
    : { key, points: awarded, skill };
  return confidence === undefined
    ? { skill, awarded, maxPoints, feedback: [item] }
    : { skill, awarded, maxPoints, feedback: [item], confidence };
}

/**
 * The read-only view of the skill registry that strategies depend on. Keeping
 * this in the core (instead of importing the concrete SkillRegistry) preserves
 * the strictly-inward layering: strategies never depend on the registry module.
 */
export interface SkillResolver {
  get(id: string): AnySkill;
  tryGet(id: string): AnySkill | undefined;
  has(id: string): boolean;
}
