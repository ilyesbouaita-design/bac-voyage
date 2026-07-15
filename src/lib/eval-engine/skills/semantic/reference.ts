import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";

/** Reference for a translation question. Mirrors the Lovable Uebersetzung content. */
export interface TranslationReference {
  german_sentence?: string;
  accepted_translations: string[];
}

/** One required-information point for a comprehension answer. */
export interface RequiredInfoPoint {
  /** The information the answer must express (in the answer's language). */
  text: string;
  /** Optional supporting keywords — evidence that raises confidence, not a gate. */
  keywords?: string[];
}

/** Reference for a text-comprehension question (Fragen zum Text) — meaning-based. */
export interface ComprehensionReference {
  question?: string;
  passage?: string;
  /** One or more model answers (whole-answer context, useful for AI judges). */
  model_answers: string[];
  /** The required-information points; the score is based on how many are expressed. */
  required_info: RequiredInfoPoint[];
}

/** Read a string[] from an untyped reference field; throw a clear error otherwise. */
export function readStringArray(expected: unknown, field: string, skill: string): string[] {
  if (expected !== null && typeof expected === "object") {
    const value = (expected as Record<string, unknown>)[field];
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value as string[];
    }
  }
  throw new Error(`${skill}: the question reference must have a string[] field "${field}".`);
}

function isRequiredInfoPoint(value: unknown): value is RequiredInfoPoint {
  return value !== null && typeof value === "object" && typeof (value as { text?: unknown }).text === "string";
}

/** Validate a ComprehensionReference; throw a clear error otherwise. */
export function asComprehensionReference(expected: unknown, skill: string): ComprehensionReference {
  if (expected !== null && typeof expected === "object") {
    const object = expected as Record<string, unknown>;
    const modelAnswers = object["model_answers"];
    const requiredInfo = object["required_info"];
    const modelsOk = Array.isArray(modelAnswers) && modelAnswers.every((x) => typeof x === "string");
    const infoOk = Array.isArray(requiredInfo) && requiredInfo.every(isRequiredInfoPoint);
    if (modelsOk && infoOk) return expected as ComprehensionReference;
  }
  throw new Error(
    `${skill}: the reference must have string[] "model_answers" and "required_info" as { text, keywords? } objects.`,
  );
}

/** Build a one-item SkillResult carrying a confidence (for semantic skills). */
export function semanticResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  confidence: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params, confidence);
}
