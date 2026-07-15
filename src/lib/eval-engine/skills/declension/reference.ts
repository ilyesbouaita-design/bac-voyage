import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";

/** One parsed segment of a Deklination template: plain text or a gap. */
export interface TemplateSegment {
  type: "text" | "gap";
  value: string;
}

/**
 * Parses a Deklination template into its text/gap segments. Ported directly
 * from the Lovable content model's own parseDeklinationTemplate (bracket
 * markers denote gaps, e.g. "D[er] groß[e] Hund"), so the SAME template a
 * teacher already authors works unmodified as this skill's ground truth —
 * the bracket contents ARE the expected gap answers, no separate answer key
 * needed.
 */
export function parseDeklinationTemplate(template: string): TemplateSegment[] {
  const parts: TemplateSegment[] = [];
  let current = "";
  for (const char of template) {
    if (char === "[") {
      if (current) parts.push({ type: "text", value: current });
      current = "";
    } else if (char === "]") {
      parts.push({ type: "gap", value: current });
      current = "";
    } else {
      current += char;
    }
  }
  if (current) parts.push({ type: "text", value: current });
  return parts;
}

/** The expected gap values, in order, from a template. */
export function expectedGapValues(template: string): string[] {
  return parseDeklinationTemplate(template)
    .filter((segment) => segment.type === "gap")
    .map((segment) => segment.value);
}

/** Reference for a Deklination question. */
export interface DeclensionReference {
  template: string;
}

/** Validate the reference; fail fast otherwise. */
export function asDeclensionReference(expected: unknown, skill: string): DeclensionReference {
  if (
    expected !== null &&
    typeof expected === "object" &&
    typeof (expected as { template?: unknown }).template === "string"
  ) {
    return expected as DeclensionReference;
  }
  throw new Error(`${skill}: the reference must have a string "template" (e.g. "D[er] groß[e] Hund").`);
}

/** Build a one-item SkillResult with a single structured feedback entry. */
export function declensionResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params);
}
