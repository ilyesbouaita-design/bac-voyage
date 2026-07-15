import { answerField } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { asConnectorReference, connectorResult } from "./reference.ts";

function readConnectorParts(context: SkillContext): string[] {
  const value = answerField(context.answer, "connectors");
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return [];
}

function sequencesMatch(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((part, i) => part.trim().toLowerCase() === (b[i] ?? "").trim().toLowerCase());
}

/**
 * Connector — judges ONE aspect: is the correct connector (a single word,
 * like "trotzdem", or a two-part sequence, like "um" ... "zu") used to fill
 * the question's gap(s)? It compares the learner's filled sequence against
 * the teacher's primary connectors and any alternative_connectors, matching
 * if the ENTIRE ordered sequence equals any one accepted alternative.
 *
 * The exercise's surrounding sentence structure (text_with_gaps) is fixed by
 * the question itself; the learner only supplies the connector word(s), as a
 * compound answer part named "connectors" (an ordered string array — one
 * entry per gap, e.g. compoundAnswer({ connectors: ["um", "zu"] })). This is
 * why no clause-boundary detection is needed here: unlike Satzbau (where the
 * student writes a full sentence and could place the verb or comma
 * anywhere), the gap positions are already fixed by the question, so there
 * is nothing structural left to locate.
 */
export class ConnectorSkill implements Skill {
  readonly id = "Connector";

  evaluate(context: SkillContext): SkillResult {
    const ref = asConnectorReference(context.expected, this.id);
    const studentParts = readConnectorParts(context);

    if (studentParts.length === 0 || studentParts.every((part) => part.trim() === "")) {
      return connectorResult(this.id, 0, context.maxPoints, "grammar.connector.missing");
    }

    const accepted = [ref.connectors, ...(ref.alternative_connectors ?? [])];
    const matched = accepted.some((sequence) => sequencesMatch(studentParts, sequence));

    if (matched) {
      return connectorResult(this.id, context.maxPoints, context.maxPoints, "grammar.connector.correct");
    }
    return connectorResult(this.id, 0, context.maxPoints, "grammar.connector.wrong", {
      expected: ref.connectors.join(" ... "),
      got: studentParts.join(" ... "),
    });
  }
}
