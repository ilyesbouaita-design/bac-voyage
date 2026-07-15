import type { EvaluationProfile } from "../core/profile.ts";
import type { CompoundPartsConfig } from "../skills/wortbildung/CompoundPartsSkill.ts";

/**
 * BAC "kompositum_loesen" exercise: the mirror image of kompositum_bilden —
 * the learner decomposes a given German compound noun into its two
 * constituent words (e.g. "Haustür" -> "Haus" + "Tür"). The real content
 * shape ({ compound, word1, word2 }) and the real WortbildungCard's own
 * response shape ({ word1, word2 }, confirmed directly) both name the two
 * parts explicitly, so CompoundParts reads them by those exact names — no
 * new answer-shape invention.
 *
 * Unlike the real card's own all-or-nothing local check (`isMatch(word1)
 * && isMatch(word2)`), this profile awards PROPORTIONAL credit — a student
 * who gets one of the two parts right earns half marks, which the card's
 * own simplistic check cannot express but this engine's per-aspect scoring
 * philosophy calls for.
 *
 * Case-insensitive: confirmed directly against the real card's own
 * `isMatch` helper.
 */
const kompositumLoesenConfig: CompoundPartsConfig = {
  mode: "proportional",
  caseSensitive: false,
};

export const kompositumLoesenProfile: EvaluationProfile = {
  exerciseType: "kompositum_loesen",
  objective: "vocab.compound.decompose",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    {
      skill: "CompoundParts",
      points: 1,
      config: kompositumLoesenConfig,
    },
  ],
};
