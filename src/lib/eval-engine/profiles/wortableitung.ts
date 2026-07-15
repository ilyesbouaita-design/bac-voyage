import type { EvaluationProfile } from "../core/profile.ts";
import type { DerivationConfig } from "../skills/wortbildung/DerivationSkill.ts";

/**
 * BAC "wortableitung" exercise: the learner derives a word of one part of
 * speech (source_type) from a word of another (target_type) — e.g. Verb
 * "spielen" -> Substantiv "das Spiel". The real content's accepted_answers
 * is an array of { article, word } pairs (article "" for a derived
 * Verb/Adjektiv, which takes none), and the real WortbildungCard's own
 * response shape is the same { article, word } pair — confirmed directly,
 * not assumed from the singular-sounding onAnswerChange name alone (which,
 * checked empirically, turned out NOT to mean "plain string" here the way
 * it does for titel/gegenteil/kompositum_bilden).
 *
 * Case-insensitive: confirmed directly against the real card's own
 * `isMatch` helper, applied to both the word and the article — this
 * controls WORD-CONTENT and ARTICLE equality only. Migration Plan Phase 2
 * confirmed (against grading-engine.ts's real gradeWortbildung, the
 * authoritative legacy grader, not the card's client-side hint) that the
 * STUDENT'S OWN CAPITALIZATION of the word is checked independently, as a
 * separate partial-credit dimension — DerivationSkill's own doc comment
 * has the full formula.
 *
 * Migration Plan Phase 2's "preserve V2 tolerance features" goal, applied
 * here (and NOT to kombinieren/ergaenzen — see those profiles' own doc
 * comments for why it's inapplicable there): wortableitung is the one of
 * these three real BAC types where the student genuinely FREE-TYPES German
 * text (confirmed against the real WortbildungCard's two plain <input>
 * fields) rather than clicking a label or a word-bank entry, so typo/
 * orthographic tolerance has real substance here.
 *   - acceptUmlautAlternative: true — a student who cannot easily type
 *     ä/ö/ü/ß is not making a spelling mistake typing "Spiess" for "Spieß".
 *     Full credit, not typo-tier partial credit (matches how
 *     grading-engine-v2 itself treats this as a normalization rule, not a
 *     scored one).
 *   - fuzzy: {} (engine defaults, 0.75 similarity / 0.5 credit share) — a
 *     genuine one-letter slip while typing. Verified this does not create
 *     a false positive against this profile's own test fixtures (e.g.
 *     "spielen" vs. the unrelated accepted word "spiel" computes to 0.71
 *     similarity, safely below the 0.75 threshold) before enabling.
 * Fuzzy is scoped to the WORD only inside DerivationSkill, never the
 * 2-3 letter article — see that skill's own doc comment for why.
 */
const wortableitungConfig: DerivationConfig = {
  caseSensitive: false,
  acceptUmlautAlternative: true,
  fuzzy: {},
};

export const wortableitungProfile: EvaluationProfile = {
  exerciseType: "wortableitung",
  objective: "vocab.derivation.form",
  strategy: "exact",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    {
      skill: "Derivation",
      points: 1,
      config: wortableitungConfig,
    },
  ],
};
