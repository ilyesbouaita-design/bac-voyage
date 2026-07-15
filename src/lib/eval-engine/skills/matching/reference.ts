import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";

/** A labelled item in a matching exercise (left or right column). */
export interface KombinationItem {
  label: string;
  text: string;
}

/** Reference for a Kombinieren (matching) exercise. */
export interface KombinationReference {
  /** The correct mapping, e.g. { a: "2", b: "4", c: "3", d: "1" }. */
  answer_key: Record<string, string>;
  left_items?: KombinationItem[];
  right_items?: KombinationItem[];
}

/** Validate a KombinationReference; throw a clear error otherwise. */
export function asKombinationReference(expected: unknown, skill: string): KombinationReference {
  if (expected !== null && typeof expected === "object") {
    const key = (expected as Record<string, unknown>)["answer_key"];
    if (
      key !== null &&
      typeof key === "object" &&
      !Array.isArray(key) &&
      Object.values(key as Record<string, unknown>).every((v) => typeof v === "string")
    ) {
      return expected as KombinationReference;
    }
  }
  throw new Error(`${skill}: the reference must have an "answer_key" object mapping labels to string values.`);
}

/** Build a one-item SkillResult with a single structured feedback entry. */
export function matchResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params);
}
