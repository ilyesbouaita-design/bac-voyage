import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_fragen_stellen": given a sentence with an underlined
 * constituent, form the question that would elicit it (e.g. "Er wohnt in
 * München." + underlined "in München" -> "Wo wohnt er?"). Two independent
 * aspects, two skills: QuestionWord (the right interrogative) and
 * QuestionInversion (the finite verb correctly in position 2).
 *
 * No sub-typing / profileKey indirection: the real content model
 * (GrammatikFragenStellenContent) has no sub-type discriminator, so this is
 * registered directly under its own exerciseType — the same pattern already
 * used by synonym, kombinieren, and grammatik_konnektoren.
 *
 * VerbPosition was deliberately NOT reused here: it is built entirely around
 * locating a SUBORDINATE clause via StructuralAnalyzer (a conjunction or
 * relative pronoun trigger). A main-clause question has no subordinate
 * clause at all — repurposing it would mean bolting an unrelated code path
 * onto an existing skill, not removing duplicated logic, so two small,
 * targeted skills were added instead.
 *
 * Scoring is "sum" (no recorded BAC rule dictates otherwise for this
 * exercise, unlike Satzbau's documented "-0.25 each"); the 0.5 / 0.5 split
 * is a reasonable, explicit, adjustable default — equal weight for two
 * independent, equally-testable aspects.
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Wo wohnt er?", answerKey: { questionWord: "wo", finite: "wohnt" } }.
 */
export const fragenStellenProfile: EvaluationProfile = {
  exerciseType: "grammatik_fragen_stellen",
  objective: "grammar.question.form",
  strategy: "structural",
  examSystem: "bac",
  scoring: "sum",
  skills: [
    { skill: "QuestionWord", points: 0.5 },
    { skill: "QuestionInversion", points: 0.5 },
  ],
};
