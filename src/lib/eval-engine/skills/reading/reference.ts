import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";

/** Reference for one Richtig/Falsch-mit-Zitat statement. */
export interface RichtigFalschReference {
  /** The correct truth value of the statement. */
  is_richtig: boolean;
  /** The correct justification quote (verbatim from the passage). */
  zitat: string;
  /** Optional accepted alternate quotes. */
  accepted_zitate?: string[];
  /** Optional full passage (reserved for verifying the quote's origin). */
  passage?: string;
}

function asObject(expected: unknown): Record<string, unknown> | undefined {
  return expected !== null && typeof expected === "object" ? (expected as Record<string, unknown>) : undefined;
}

/** Read the correct truth value; throw a clear error if absent. */
export function readIsRichtig(expected: unknown, skill: string): boolean {
  const object = asObject(expected);
  if (object && typeof object["is_richtig"] === "boolean") return object["is_richtig"];
  throw new Error(`${skill}: the reference must have a boolean "is_richtig".`);
}

/** Read the accepted quotes (the correct one plus any alternates); throw if absent. */
export function readAcceptedZitate(expected: unknown, skill: string): string[] {
  const object = asObject(expected);
  if (object && typeof object["zitat"] === "string") {
    const extra = object["accepted_zitate"];
    const alternates = Array.isArray(extra) && extra.every((x) => typeof x === "string") ? (extra as string[]) : [];
    return [object["zitat"], ...alternates];
  }
  throw new Error(`${skill}: the reference must have a string "zitat".`);
}

/** Interpret a learner's Richtig/Falsch choice; undefined if unrecognized. */
export function parseChoice(raw: string): boolean | undefined {
  const choice = raw.trim().toLowerCase();
  if (["richtig", "r", "wahr", "true", "w"].includes(choice)) return true;
  if (["falsch", "f", "false"].includes(choice)) return false;
  return undefined;
}

/** Build a one-item SkillResult with a single structured feedback entry. */
export function readingResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params);
}
