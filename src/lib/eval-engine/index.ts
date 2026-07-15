// ============================================================================
// German Evaluation Engine — public API
//
// Feature-complete: Engine, all 3 Strategies (exact/structural/semantic), 5
// Registries, 27 exercise-type Profiles (all 18 real BAC bac_types now have
// at least one), ~21 Skills across grammar/semantic/reading/matching/
// connectors/declension/wortbildung families, the Lovable integration
// adapter (src/adapters/lovable), and its migration bridge (FR/AR/DE
// feedback translation + a converter back to bac-voyage's existing
// production result shape, for a zero-frontend-change cutover) are all
// exported below.
// ============================================================================

// --- Core contracts -------------------------------------------------------
export type {
  Answer,
  AnswerInput,
  AnswerValue,
  AnswerScalar,
  TextAnswer,
  CompoundAnswer,
} from "./core/answer.ts";
export { textAnswer, compoundAnswer, toAnswer, answerText, answerField, answerString } from "./core/answer.ts";
export type { FeedbackItem } from "./core/feedback.ts";
export type { EvaluationInput } from "./core/input.ts";
export type { EvaluationProfile, SkillBinding } from "./core/profile.ts";
export { profileMaxScore } from "./core/profile.ts";
export type { EvaluationResult } from "./core/result.ts";
export type {
  Skill,
  SkillContext,
  SkillResult,
  SkillResolver,
  AnySkill,
} from "./core/skill.ts";
export type { EvaluationStrategy } from "./core/strategy.ts";
export type {
  Normalizer,
  Matcher,
  NormalizeOptions,
  SkillUtilities,
  FuzzyMatch,
} from "./core/utilities.ts";

// --- Engine + registries --------------------------------------------------
export { Engine } from "./engine/Engine.ts";
export { Registry } from "./registry/Registry.ts";
export { SkillRegistry } from "./registry/SkillRegistry.ts";
export { StrategyRegistry } from "./registry/StrategyRegistry.ts";
export { ProfileRegistry } from "./registry/ProfileRegistry.ts";

// --- Strategies -----------------------------------------------------------
export { ExactStrategy } from "./strategies/ExactStrategy.ts";
export { StructuralStrategy } from "./strategies/StructuralStrategy.ts";
export { SemanticStrategy } from "./strategies/SemanticStrategy.ts";
export { runSkillPipeline } from "./strategies/pipeline.ts";

// --- Utilities ------------------------------------------------------------
export {
  DefaultNormalizer,
  DefaultMatcher,
  createDefaultUtilities,
} from "./utilities/index.ts";
export { damerauLevenshteinDistance } from "./utilities/Matcher.ts";

// --- Composition root -----------------------------------------------------
export { createEngine } from "./bootstrap.ts";
export type { EngineParts, CreateEngineOptions } from "./bootstrap.ts";

// --- Built-in skills ------------------------------------------------------
export { ExactMatchSkill } from "./skills/ExactMatchSkill.ts";
export type { ExactMatchConfig, FuzzyToleranceConfig } from "./skills/ExactMatchSkill.ts";

// --- Built-in profiles ----------------------------------------------------
export { synonymProfile } from "./profiles/synonym.ts";
export { gegenteilProfile } from "./profiles/gegenteil.ts";
export { titelProfile } from "./profiles/titel.ts";
export { ergaenzenProfile } from "./profiles/ergaenzen.ts";
export { tempusPerfektProfile } from "./profiles/tempusPerfekt.ts";
export { tempusPraesensProfile } from "./profiles/tempusPraesens.ts";
export { tempusPraeteritumProfile } from "./profiles/tempusPraeteritum.ts";
export { tempusFuturProfile } from "./profiles/tempusFutur.ts";

// --- Scoring policies -----------------------------------------------------
export type {
  ScoringPolicy,
  ScoreBreakdown,
  ScoringPolicyFn,
  ScoringResolver,
} from "./core/scoring.ts";
export { ScoringRegistry } from "./registry/ScoringRegistry.ts";
export {
  sumPolicy,
  allOrNothingPolicy,
  deductionPolicy,
  createDefaultScoringRegistry,
} from "./scoring/policies.ts";

// --- German linguistic utilities ------------------------------------------
export type { GermanLinguistics, AuxiliaryLemma, FiniteVerbHit } from "./core/utilities.ts";
export { DefaultGermanLinguistics } from "./utilities/index.ts";

// --- Structural analysis (clause boundaries + triggers) --------------------
export type {
  StructuralAnalyzer,
  ClauseTriggerRecognizer,
  ClauseTrigger,
  Clause,
  ClauseBoundary,
  SentenceStructure,
} from "./core/utilities.ts";
export { DefaultStructuralAnalyzer } from "./utilities/index.ts";

// --- Grammar skills + reference -------------------------------------------
export { AuxiliaryVerbSkill } from "./skills/grammar/AuxiliaryVerbSkill.ts";
export { PartizipIISkill } from "./skills/grammar/PartizipIISkill.ts";
export { ConjugationSkill } from "./skills/grammar/ConjugationSkill.ts";
export { VerbLemmaSkill } from "./skills/grammar/VerbLemmaSkill.ts";
export { ExtraneousElementSkill } from "./skills/grammar/ExtraneousElementSkill.ts";
export type { ExtraneousElementConfig } from "./skills/grammar/ExtraneousElementSkill.ts";
export { InfinitiveSkill } from "./skills/grammar/InfinitiveSkill.ts";
export { VerbPositionSkill } from "./skills/grammar/VerbPositionSkill.ts";
export type { VerbPositionConfig } from "./skills/grammar/VerbPositionSkill.ts";
export { RelativePronounSkill } from "./skills/grammar/RelativePronounSkill.ts";
export { QuestionWordSkill } from "./skills/grammar/QuestionWordSkill.ts";
export { QuestionInversionSkill } from "./skills/grammar/QuestionInversionSkill.ts";
export { CommaSkill } from "./skills/grammar/CommaSkill.ts";
export type { CommaConfig } from "./skills/grammar/CommaSkill.ts";
export type { GrammarReference, VerbAnswerKey, ResolvedVerbKey } from "./skills/grammar/reference.ts";
export { resolveVerbKey } from "./skills/grammar/reference.ts";
export { satzbauTemporalProfile } from "./profiles/satzbauTemporal.ts";
export { satzbauFinalProfile } from "./profiles/satzbauFinal.ts";
export { satzbauKausalProfile } from "./profiles/satzbauKausal.ts";
export { satzbauKonditionalProfile } from "./profiles/satzbauKonditional.ts";
export { satzbauKonzessivProfile } from "./profiles/satzbauKonzessiv.ts";
export { satzbauRelativProfile } from "./profiles/satzbauRelativ.ts";
export { passivPraesensProfile } from "./profiles/passivPraesens.ts";
export { passivPraeteritumProfile } from "./profiles/passivPraeteritum.ts";
export { modalverbStandardProfile } from "./profiles/modalverbStandard.ts";
export { uebersetzungProfile } from "./profiles/uebersetzung.ts";
export { fragenZumTextProfile } from "./profiles/fragenZumText.ts";

// --- Semantic skills + text similarity + meaning judge --------------------
export { MeaningSkill } from "./skills/semantic/MeaningSkill.ts";
export type { MeaningConfig } from "./skills/semantic/MeaningSkill.ts";
export { InformationExpressedSkill } from "./skills/semantic/InformationExpressedSkill.ts";
export type { InformationExpressedConfig } from "./skills/semantic/InformationExpressedSkill.ts";
export { FullSentenceSkill } from "./skills/semantic/FullSentenceSkill.ts";
export type { FullSentenceConfig } from "./skills/semantic/FullSentenceSkill.ts";
export type { TranslationReference, ComprehensionReference, RequiredInfoPoint } from "./skills/semantic/reference.ts";
export type {
  TextSimilarity,
  SimilarityOptions,
  OverlapResult,
  MeaningJudge,
  MeaningTarget,
  MeaningContext,
  MeaningVerdict,
} from "./core/utilities.ts";
export { DefaultTextSimilarity, DefaultMeaningJudge } from "./utilities/index.ts";
export type { DefaultMeaningJudgeOptions } from "./utilities/index.ts";

// --- Reading skills + profile (Richtig/Falsch mit Zitat) ------------------
export { RichtigFalschSkill } from "./skills/reading/RichtigFalschSkill.ts";
export { ZitatMatchSkill } from "./skills/reading/ZitatMatchSkill.ts";
export type { ZitatConfig } from "./skills/reading/ZitatMatchSkill.ts";
export type { RichtigFalschReference } from "./skills/reading/reference.ts";
export { richtigFalschZitatProfile } from "./profiles/richtigFalschZitat.ts";

// --- Matching skill + profile (Kombinieren) -------------------------------
export { KombinationSkill } from "./skills/matching/KombinationSkill.ts";
export type { KombinationConfig } from "./skills/matching/KombinationSkill.ts";
export type { KombinationReference } from "./skills/matching/reference.ts";
export { kombinierenProfile } from "./profiles/kombinieren.ts";

// --- Connector skill + profile (Konnektoren) -------------------------------
export { ConnectorSkill } from "./skills/connectors/ConnectorSkill.ts";
export type { ConnectorReference } from "./skills/connectors/reference.ts";
export { konnektorenProfile } from "./profiles/konnektoren.ts";
export { fragenStellenProfile } from "./profiles/fragenStellen.ts";

// --- Declension skill + profile (Deklination) ------------------------------
export { DeclensionEndingSkill } from "./skills/declension/DeclensionEndingSkill.ts";
export type { DeclensionEndingConfig } from "./skills/declension/DeclensionEndingSkill.ts";
export type { DeclensionReference, TemplateSegment } from "./skills/declension/reference.ts";
export { parseDeklinationTemplate, expectedGapValues } from "./skills/declension/reference.ts";
export { deklinationProfile } from "./profiles/deklination.ts";

// --- Wortbildung skills + profiles (Kompositum lösen, Wortableitung) -------
// (Kompositum bilden reuses ExactMatchSkill above, not a new skill.)
export { CompoundPartsSkill } from "./skills/wortbildung/CompoundPartsSkill.ts";
export type { CompoundPartsConfig } from "./skills/wortbildung/CompoundPartsSkill.ts";
export { DerivationSkill } from "./skills/wortbildung/DerivationSkill.ts";
export type { DerivationConfig, DerivationFuzzyToleranceConfig } from "./skills/wortbildung/DerivationSkill.ts";
export type {
  CompoundPartsReference,
  DerivationEntry,
  DerivationReference,
} from "./skills/wortbildung/reference.ts";
export { kompositumBildenProfile } from "./profiles/kompositumBilden.ts";
export { kompositumLoesenProfile } from "./profiles/kompositumLoesen.ts";
export { wortableitungProfile } from "./profiles/wortableitung.ts";

// --- Multi-item exercise aggregation --------------------------------------
export { evaluateExercise } from "./aggregate.ts";
export type { ExerciseItem, ExerciseEvaluation } from "./aggregate.ts";

// --- Lovable integration adapter --------------------------------------------
// Maps bac-voyage's question/answer models to EvaluationInput and back to a
// translation-key-based result. Consumes the public API above only; the
// Engine, Strategies, Skills, Profiles, Registries, and Utilities are
// unchanged by its existence.
export { correctAnswer, createFullyLoadedEngine, inputMappers } from "./adapters/lovable/index.ts";
export type { InputMapper } from "./adapters/lovable/index.ts";
export type {
  BacContent,
  BacExamQuestion,
  BacQuestionType,
  GrammarAnswerKeyInput,
  LovableCorrectionResult,
} from "./adapters/lovable/index.ts";

// --- Migration bridge (production compatibility review, Phase 0) ----------
export {
  translateFeedback,
  translateFeedbackItem,
  FEEDBACK_TRANSLATIONS,
  toLegacyResult,
} from "./adapters/lovable/index.ts";
export type {
  Locale,
  TranslatedText,
  TranslationDictionary,
  LegacyCorrectionResult,
  LegacyLayerName,
} from "./adapters/lovable/index.ts";

// --- Migration bridge — routing + shadow mode (Migration Plan, Phase 1) ---
// Per-bac_type routing (default: every type stays on v2, zero behavior
// change) and a shadow-mode comparator for running the new engine alongside
// v2 on real traffic without affecting what's shown or persisted. NOT yet
// wired into bac-voyage's real grading-orchestrator.ts — see routing.ts's
// header for the illustrative wiring and the migration plan document
// (cmrjer6n31kdi06ad8fz4ukm7) for the phased rollout this unlocks.
export {
  DEFAULT_ROUTING_CONFIG,
  resolveRoutingMode,
  shouldCallV2,
  shouldCallNewEngine,
  shouldUseNewEngineResult,
  compareGradingOutcomes,
  runShadowComparison,
  fromLovableResult,
} from "./adapters/lovable/index.ts";
export type {
  RoutingMode,
  RoutingConfig,
  GradingOutcome,
  ShadowModeDiff,
  ShadowModeContext,
  ShadowModeResult,
} from "./adapters/lovable/index.ts";
