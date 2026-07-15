import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";

/** Reference for a Konnektoren (connector fill-gap) question. */
export interface ConnectorReference {
  /** The primary accepted connector sequence, e.g. ["um", "zu"] or ["trotzdem"]. */
  connectors: string[];
  /** Other fully-accepted sequences, e.g. [["dennoch"]] as an alternative to ["trotzdem"]. */
  alternative_connectors?: string[][];
}

/** Validate the reference; fail fast otherwise. */
export function asConnectorReference(expected: unknown, skill: string): ConnectorReference {
  if (expected !== null && typeof expected === "object") {
    const connectors = (expected as Record<string, unknown>)["connectors"];
    if (Array.isArray(connectors) && connectors.every((c) => typeof c === "string")) {
      return expected as ConnectorReference;
    }
  }
  throw new Error(`${skill}: the reference must have a string[] "connectors" field.`);
}

/** Build a one-item SkillResult with a single structured feedback entry. */
export function connectorResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params);
}
