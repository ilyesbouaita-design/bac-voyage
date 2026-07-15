import type { AnySkill, SkillResolver } from "../core/skill.ts";
import { Registry } from "./Registry.ts";

/**
 * Holds every available Skill, keyed by `skill.id`. Strategies receive this as
 * a SkillResolver and look up only the skills their profile enabled.
 */
export class SkillRegistry extends Registry<AnySkill> implements SkillResolver {
  constructor() {
    super("SkillRegistry");
  }

  /** Register a skill under its own id. */
  add(skill: AnySkill): this {
    return this.register(skill.id, skill);
  }
}
