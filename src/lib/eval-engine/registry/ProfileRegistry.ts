import type { EvaluationProfile } from "../core/profile.ts";
import { Registry } from "./Registry.ts";

/** Holds every EvaluationProfile, keyed by `profile.exerciseType`. */
export class ProfileRegistry extends Registry<EvaluationProfile> {
  constructor() {
    super("ProfileRegistry");
  }

  /** Register a profile under its own exerciseType. */
  add(profile: EvaluationProfile): this {
    return this.register(profile.exerciseType, profile);
  }
}
