import { answerString } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { parseChoice, readIsRichtig, readingResult } from "./reference.ts";

/**
 * RichtigFalsch — judges ONE aspect: is the learner's Richtig/Falsch choice
 * correct? It reads the "choice" part of the compound answer and compares it to
 * the reference is_richtig. It knows nothing about the Zitat (that is the Zitat
 * skill's job).
 */
export class RichtigFalschSkill implements Skill {
  readonly id = "RichtigFalsch";

  evaluate(context: SkillContext): SkillResult {
    const isRichtig = readIsRichtig(context.expected, this.id);
    const raw = answerString(context.answer, "choice");
    const chosen = parseChoice(raw);

    if (chosen === undefined) {
      return readingResult(this.id, 0, context.maxPoints, "reading.rf.wrong", {
        reason: raw.trim() === "" ? "no_choice" : "unrecognized",
      });
    }
    if (chosen === isRichtig) {
      return readingResult(this.id, context.maxPoints, context.maxPoints, "reading.rf.correct");
    }
    return readingResult(this.id, 0, context.maxPoints, "reading.rf.wrong", {
      expected: isRichtig ? "richtig" : "falsch",
    });
  }
}
