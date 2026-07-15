export { inputMappers } from "./mappers.ts";
export type { InputMapper } from "./mappers.ts";
export { createFullyLoadedEngine } from "./bootstrap.ts";

// --- Correction entry point (moved to its own file so shadowMode.ts can
// import it without creating a cycle through this barrel file) ------------
export { correctAnswer } from "./correctAnswer.ts";

// --- Migration bridge (production compatibility review, Phase 0) ----------
// Converts the new engine's output into bac-voyage's EXISTING production
// CorrectionResult shape, so the migration needs no frontend change on day
// one. See translations.ts / legacy.ts for the full rationale.
export { translateFeedback, translateFeedbackItem, FEEDBACK_TRANSLATIONS } from "./translations.ts";
export type { Locale, TranslatedText, TranslationDictionary } from "./translations.ts";
export { toLegacyResult } from "./legacy.ts";
export type { LegacyCorrectionResult, LegacyLayerName } from "./legacy.ts";

// --- Migration bridge — routing + shadow mode (Migration Plan, Phase 1) ---
// Per-bac_type routing decisions (default: every type stays on v2, zero
// behavior change) and a shadow-mode comparator that runs the new engine
// alongside v2 on real traffic without ever affecting what gets shown or
// persisted. See routing.ts's header for the full rationale and the
// illustrative (not yet applied) grading-orchestrator.ts wiring.
export {
  DEFAULT_ROUTING_CONFIG,
  resolveRoutingMode,
  shouldCallV2,
  shouldCallNewEngine,
  shouldUseNewEngineResult,
} from "./routing.ts";
export type { RoutingMode, RoutingConfig } from "./routing.ts";
export { compareGradingOutcomes, runShadowComparison, fromLovableResult } from "./shadowMode.ts";
export type { GradingOutcome, ShadowModeDiff, ShadowModeContext, ShadowModeResult } from "./shadowMode.ts";

export type {
  BacContent,
  BacExamQuestion,
  BacQuestionType,
  ErgaenzenContent,
  FragenZumTextContent,
  GegenteilContent,
  GrammarAnswerKeyInput,
  GrammatikAktivPassivContent,
  GrammatikDeklinationContent,
  GrammatikFragenStellenContent,
  GrammatikKonnektorenContent,
  GrammatikModalverbContent,
  GrammatikSatzbauContent,
  GrammatikTempusContent,
  KombinierenContent,
  KompositumBildenContent,
  KompositumLoesenContent,
  LovableCorrectionResult,
  RichtigFalschContent,
  SynonymContent,
  TitelContent,
  UebersetzungContent,
  WortableitungContent,
} from "./types.ts";
