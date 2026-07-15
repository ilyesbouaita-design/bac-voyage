import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_modalverb": add a modal verb to a sentence, pushing the main
 * verb to an infinitive at the end. This is the first Modalverb profile
 * migrated to the finalized profileKey convention — mirroring exactly how
 * grammatik_tempus became tempus.perfekt and grammatik_aktiv_passiv became
 * passiv.präsens: the exam's outer type stays "grammatik_modalverb" (see
 * BacQuestionType), and this single, currently un-sub-typed profile is
 * registered under its own finalized key, "modalverb.standard".
 *
 * Usage from a caller (e.g. the Lovable adapter):
 *   engine.evaluate({
 *     exerciseType: "grammatik_modalverb",   // the exam's outer bac_type
 *     profileKey: "modalverb.standard",      // selects THIS profile
 *     answer, reference,
 *   });
 *
 * The profile itself is registered under exerciseType "modalverb.standard" —
 * the ProfileRegistry key is always profile.exerciseType, and calling with
 * exerciseType "grammatik_modalverb" alone (no profileKey) now fails fast
 * rather than guessing (see test/modalverbStandard.test.ts). If Modalverb
 * ever needs genuine sub-types (e.g. a modal used with Perfekt), a sibling
 * profile would follow the same convention in its own file.
 *
 * Evaluation logic, skills, and scoring are UNCHANGED from the prior
 * grammatik_modalverb profile — this migration is structural only (profile
 * identity/registration).
 *
 * It reuses AuxiliaryVerb (the modal lemma) and Conjugation (the modal's
 * finite form). UNLIKE Tempus/Aktiv-Passiv, VerbLemma IS kept enabled here —
 * a deliberate, pedagogically-justified exception, not an oversight. For
 * Tempus/Aktiv-Passiv, PartizipII independently catches a wrong main-verb
 * substitution as a side effect (a different verb almost always produces a
 * different participle string). For Modalverb there is no participle at all
 * — the main verb is an infinitive — and no Infinitive skill is wired into
 * this profile, so NOTHING would catch a wrong main verb without VerbLemma:
 * AuxiliaryVerb and Conjugation only ever examine the modal, never the
 * infinitive. Dropping VerbLemma here would silently let a wrong-verb answer
 * score full marks (see the "wrong main verb" test in
 * test/modalverbStandard.test.ts for a worked example). Revisit once a
 * dedicated Infinitive skill (already built for tempus.futur) is wired in
 * here too — at that point VerbLemma may become redundant here as well, the
 * same way it already is for Tempus/Aktiv-Passiv.
 *
 * Migration Plan Phase 7 added ExtraneousElement (a real V2 strength this
 * profile had no equivalent for — see the migration comparison's Modalverb
 * row): does the answer contain a comma or a "zu" that has no place in a
 * simple modal+infinitive construction. Adding a 4th skill meant rebalancing
 * points rather than simply appending one at the old total's expense of
 * nothing — the distribution below (AuxiliaryVerb 0.3, Conjugation 0.3,
 * VerbLemma 0.25, ExtraneousElement 0.15) keeps the two aspects of the CORE
 * transformation (choosing and conjugating the modal) weighted highest,
 * VerbLemma next (a wrong main verb is a more serious error than an
 * extraneous word), and ExtraneousElement smallest (a secondary
 * "don't-add-unnecessary-elements" check). One example distribution, not a
 * standard; a teacher may weight these however the specific question
 * warrants.
 */
export const modalverbStandardProfile: EvaluationProfile = {
  exerciseType: "modalverb.standard",
  objective: "grammar.modal.insert",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "AuxiliaryVerb", points: 0.3 },
    { skill: "Conjugation", points: 0.3 },
    { skill: "VerbLemma", points: 0.25 },
    { skill: "ExtraneousElement", points: 0.15 },
  ],
};
