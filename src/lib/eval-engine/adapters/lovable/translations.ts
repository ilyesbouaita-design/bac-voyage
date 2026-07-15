import type { FeedbackItem } from "../../core/feedback.ts";

/**
 * Migration bridge (production compatibility review, Phase 0): the engine
 * deliberately never returns translated text — feedback is structured
 * { key, points, skill, params? } so ANY consumer can translate it. This
 * module is bac-voyage's specific FR/AR/DE translation of those keys.
 *
 * It exists so the migration can swap the OLD grading engine for THIS one
 * without changing bac-voyage's existing feedback_fr/feedback_ar/feedback_de
 * string contract on day one (see legacy.ts). A later, separate migration
 * phase can choose to expose raw FeedbackItem[] + keys to the frontend
 * directly for proper client-side i18n — this module doesn't preclude that,
 * it just isn't required for it.
 *
 * Keys are added INCREMENTALLY, one BAC exercise type at a time, as each
 * type is migrated — not all ~54 at once. An untranslated key degrades to a
 * visible placeholder rather than throwing, so a not-yet-migrated exercise
 * type never crashes the caller; it just doesn't have a nice message yet.
 */

export type Locale = "fr" | "ar" | "de";

export interface TranslatedText {
  readonly fr: string;
  readonly ar: string;
  readonly de: string;
}

export type TranslationDictionary = Readonly<Record<string, TranslatedText>>;

/** Replace {{paramName}} with String(params[paramName]); leaves unknown placeholders untouched. */
function interpolate(template: string, params?: Readonly<Record<string, string | number | boolean>>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}

/**
 * BAC exercise types migrated so far (grows one entry per completed
 * migration step): synonym, kombinieren, richtig_falsch_zitat, uebersetzung,
 * tempus.perfekt, passiv.präsens, passiv.präteritum, satzbau.temporal/
 * final/kausal/konditional/konzessiv/relativ, fragen_zum_text,
 * grammatik_konnektoren, grammatik_deklination.
 *
 * This completes migrating every BAC exercise (sub-)type that grades
 * automatically with the CURRENT production schema, no answer_key needed.
 * See the compatibility matrix for the remaining 5 sub-types that need an
 * answer_key field added before they can be migrated the same way.
 *
 * Migration Plan Phase 6 (net-new, not a migration from V2 coverage — these
 * 6 types never had an engine profile at all before now) added gegenteil,
 * titel, kompositum_bilden, and ergaenzen with ZERO new keys: all four
 * reuse ExactMatch and its already-translated exact.match.* keys. Only
 * kompositum_loesen (vocab.compound.*) and wortableitung (vocab.derivation.*)
 * needed genuinely new skills and therefore new keys, added below.
 */
export const FEEDBACK_TRANSLATIONS: TranslationDictionary = {
  // --- synonym --------------------------------------------------------------
  "exact.match.correct": {
    fr: "Réponse correcte.",
    ar: "إجابة صحيحة.",
    de: "Richtige Antwort.",
  },
  "exact.match.wrong": {
    fr: "Réponse incorrecte. Réponse(s) attendue(s) : {{accepted}}.",
    ar: "إجابة خاطئة. الإجابة (الإجابات) المتوقعة: {{accepted}}.",
    de: "Falsche Antwort. Erwartete Antwort(en): {{accepted}}.",
  },
  "exact.match.empty": {
    fr: "Aucune réponse fournie.",
    ar: "لم تُقدَّم أي إجابة.",
    de: "Keine Antwort angegeben.",
  },
  // Migration Plan Phase 7 — opt-in typo tolerance (off by default; see
  // ExactMatchSkill's fuzzy config). No currently-shipped profile enables
  // it, so this key does not appear in any existing profile's output today.
  "exact.match.typo": {
    fr: "Réponse presque correcte (faute de frappe probable, proche de « {{closest}} »).",
    ar: "إجابة قريبة جدًا من الصحيحة (يُحتمل أنه خطأ كتابي، قريبة من «{{closest}}»).",
    de: "Antwort fast richtig (wahrscheinlich ein Schreibfehler, nahe an „{{closest}}“).",
  },

  // --- kombinieren ------------------------------------------------------------
  "match.combine.correct": {
    fr: "Toutes les paires sont correctes ({{correct}}/{{total}}).",
    ar: "جميع الأزواج صحيحة ({{correct}}/{{total}}).",
    de: "Alle Paare sind richtig ({{correct}}/{{total}}).",
  },
  "match.combine.empty": {
    fr: "Aucune paire n'a été renseignée.",
    ar: "لم يتم تحديد أي زوج.",
    de: "Es wurden keine Paare zugeordnet.",
  },
  "match.combine.none": {
    fr: "Aucune paire correcte ({{correct}}/{{total}}). Éléments à revoir : {{wrong}}.",
    ar: "لا توجد أزواج صحيحة ({{correct}}/{{total}}). العناصر التي يجب مراجعتها: {{wrong}}.",
    de: "Keine der Paare ist richtig ({{correct}}/{{total}}). Zu überprüfende Elemente: {{wrong}}.",
  },
  "match.combine.partial": {
    fr: "{{correct}}/{{total}} paires correctes. Éléments à revoir : {{wrong}}.",
    ar: "{{correct}}/{{total}} أزواج صحيحة. العناصر التي يجب مراجعتها: {{wrong}}.",
    de: "{{correct}}/{{total}} Paare richtig. Zu überprüfende Elemente: {{wrong}}.",
  },

  // --- richtig_falsch_zitat -----------------------------------------------
  // reading.rf.wrong deliberately does NOT interpolate any param: the skill
  // emits it with either {reason} or {expected} depending on which failure
  // fired, never both, and a template referencing an absent param would
  // leave a literal "{{...}}" placeholder visible in whichever branch
  // doesn't have it. A generic message is correct here, not a shortcut.
  "reading.rf.correct": {
    fr: "Le choix Richtig/Falsch est correct.",
    ar: "الاختيار (صحيح/خاطئ) صحيح.",
    de: "Die Richtig/Falsch-Wahl ist richtig.",
  },
  "reading.rf.wrong": {
    fr: "Le choix Richtig/Falsch est incorrect.",
    ar: "الاختيار (صحيح/خاطئ) غير صحيح.",
    de: "Die Richtig/Falsch-Wahl ist falsch.",
  },
  "reading.zitat.correct": {
    fr: "La citation est correcte.",
    ar: "الاقتباس صحيح.",
    de: "Das Zitat ist korrekt.",
  },
  "reading.zitat.missing": {
    fr: "Aucune citation fournie.",
    ar: "لم يتم تقديم أي اقتباس.",
    de: "Kein Zitat angegeben.",
  },
  "reading.zitat.too_long": {
    fr: "La citation contient la phrase correcte mais est trop longue.",
    ar: "يحتوي الاقتباس على الجملة الصحيحة لكنه طويل جدًا.",
    de: "Das Zitat enthält den richtigen Satz, ist aber zu lang.",
  },
  "reading.zitat.paraphrase": {
    fr: "La citation doit être exacte (mot pour mot), pas reformulée (couverture : {{coverage}}).",
    ar: "يجب أن يكون الاقتباس حرفيًا وليس إعادة صياغة (نسبة التطابق: {{coverage}}).",
    de: "Das Zitat muss wortwörtlich sein, keine Umformulierung (Übereinstimmung: {{coverage}}).",
  },
  "reading.zitat.wrong": {
    fr: "La citation ne correspond pas à la phrase attendue.",
    ar: "لا يتطابق الاقتباس مع الجملة المتوقعة.",
    de: "Das Zitat entspricht nicht dem erwarteten Satz.",
  },

  // --- uebersetzung ---------------------------------------------------------
  "semantic.meaning.correct": {
    fr: "Traduction correcte.",
    ar: "الترجمة صحيحة.",
    de: "Übersetzung korrekt.",
  },
  // Same reasoning as reading.rf.wrong above: this key fires with EITHER
  // {errors, missing} or {errors: 0, reason: "empty"} -- "errors" is the
  // only param common to both, so it's the only one interpolated here.
  "semantic.meaning.error": {
    fr: "{{errors}} erreur(s) de sens détectée(s).",
    ar: "تم اكتشاف {{errors}} خطأ (أخطاء) في المعنى.",
    de: "{{errors}} Bedeutungsfehler festgestellt.",
  },
  // Injected by SemanticStrategy itself (not a skill) whenever a result is
  // deferred to manual review -- appended to whatever skill feedback
  // already explains the score.
  "semantic.review.suggested": {
    fr: "Cette réponse nécessite une relecture humaine (confiance : {{confidence}}). Note suggérée ci-dessus.",
    ar: "تحتاج هذه الإجابة إلى مراجعة بشرية (درجة الثقة: {{confidence}}). الدرجة المقترحة أعلاه.",
    de: "Diese Antwort erfordert eine menschliche Überprüfung (Konfidenz: {{confidence}}). Vorgeschlagene Punktzahl oben.",
  },

  // --- tempus.perfekt / passiv.präsens / passiv.präteritum ------------------
  // These three profiles share the same three skills (AuxiliaryVerb,
  // PartizipII, Conjugation), just with different point weights, so they
  // share the same feedback keys -- migrating the keys once covers all three
  // profiles; each is still verified individually (see the tests).
  // Each "wrong" key fires with EITHER {expected} or {expected, got}
  // depending on whether a wrong-but-present form was found -- only
  // "expected" is common to both, so only it is interpolated (same
  // reasoning as reading.rf.wrong / semantic.meaning.error above).
  "grammar.auxiliary.correct": {
    fr: "L'auxiliaire est correct.",
    ar: "الفعل المساعد صحيح.",
    de: "Das Hilfsverb ist richtig.",
  },
  "grammar.auxiliary.wrong": {
    fr: "Auxiliaire incorrect. Attendu : {{expected}}.",
    ar: "الفعل المساعد غير صحيح. المتوقع: {{expected}}.",
    de: "Falsches Hilfsverb. Erwartet: {{expected}}.",
  },
  "grammar.partizip.correct": {
    fr: "Le participe II est correct.",
    ar: "صيغة التصريف الثاني (Partizip II) صحيحة.",
    de: "Das Partizip II ist richtig.",
  },
  "grammar.partizip.wrong": {
    fr: "Participe II incorrect. Attendu : {{expected}}.",
    ar: "صيغة Partizip II غير صحيحة. المتوقع: {{expected}}.",
    de: "Falsches Partizip II. Erwartet: {{expected}}.",
  },
  "grammar.conjugation.correct": {
    fr: "La conjugaison est correcte.",
    ar: "التصريف صحيح.",
    de: "Die Konjugation ist richtig.",
  },
  "grammar.conjugation.wrong": {
    fr: "Conjugaison incorrecte. Attendu : {{expected}}.",
    ar: "التصريف غير صحيح. المتوقع: {{expected}}.",
    de: "Falsche Konjugation. Erwartet: {{expected}}.",
  },

  // --- modalverb.standard: ExtraneousElement (Migration Plan Phase 7) --------
  "grammar.extraneous.none": {
    fr: "Aucun élément superflu (pas de virgule ni de « zu » inutile).",
    ar: "لا توجد عناصر زائدة (لا فاصلة ولا «zu» غير ضرورية).",
    de: "Keine überflüssigen Elemente (kein Komma, kein unnötiges „zu“).",
  },
  "grammar.extraneous.comma": {
    fr: "Virgule superflue : cette phrase ne comporte pas de proposition subordonnée.",
    ar: "فاصلة زائدة: هذه الجملة لا تحتوي على جملة فرعية.",
    de: "Überflüssiges Komma: Dieser Satz hat keinen Nebensatz.",
  },
  "grammar.extraneous.zu": {
    fr: "« zu » superflu : après ce verbe modal, l'infinitif est employé seul.",
    ar: "«zu» زائدة: بعد هذا الفعل الوجوبي، يُستخدم صيغة المصدر بمفردها.",
    de: "Überflüssiges „zu“: Nach diesem Modalverb steht der bloße Infinitiv.",
  },
  "grammar.extraneous.both": {
    fr: "Virgule superflue ET « zu » superflu : ni l'une ni l'autre n'est nécessaire ici.",
    ar: "فاصلة زائدة و«zu» زائدة: كلاهما غير ضروري هنا.",
    de: "Überflüssiges Komma UND überflüssiges „zu“: keines von beiden gehört hierher.",
  },

  // --- satzbau.temporal / final / kausal / konditional / konzessiv --------
  // All five conjunction-based Satzbau sub-types share the same two skills
  // (VerbPosition, Comma), so they share these same feedback keys -- see
  // satzbauFinal.ts's own doc comment for why VerbPosition/Comma are
  // conjunction-agnostic. Each profile is still verified individually.
  // Unlike the "wrong" keys above, structure.verb_position.wrong ALWAYS
  // carries BOTH {expected} and {reason} together (confirmed by reading
  // every call site) -- safe to interpolate both, no dangling-placeholder risk.
  "structure.verb_position.correct": {
    fr: "Le verbe est correctement placé en fin de proposition.",
    ar: "الفعل في الموضع الصحيح في نهاية الجملة الفرعية.",
    de: "Das Verb steht richtig am Ende des Nebensatzes.",
  },
  "structure.verb_position.wrong": {
    fr: "Position du verbe incorrecte (attendu : {{expected}}).",
    ar: "موضع الفعل غير صحيح (المتوقع: {{expected}}).",
    de: "Falsche Verbposition (erwartet: {{expected}}).",
  },
  "structure.comma.correct": {
    fr: "La virgule de la proposition est correctement placée.",
    ar: "الفاصلة في الموضع الصحيح.",
    de: "Das Komma ist richtig gesetzt.",
  },
  "structure.comma.missing": {
    fr: "La virgule attendue avant/après la proposition subordonnée est manquante.",
    ar: "الفاصلة المطلوبة قبل/بعد الجملة الفرعية غير موجودة.",
    de: "Das erforderliche Komma vor/nach dem Nebensatz fehlt.",
  },

  // --- satzbau.relativ (adds RelativePronoun on top of the shared VerbPosition/Comma above) --
  // Each of these two "wrong"/"missing" keys has exactly ONE call site with
  // a fixed param set (unlike the auxiliary/partizip/conjugation "wrong"
  // keys above) -- safe to interpolate every param present.
  "grammar.relative_pronoun.correct": {
    fr: "Le pronom relatif est correct.",
    ar: "الضمير الموصول صحيح.",
    de: "Das Relativpronomen ist richtig.",
  },
  "grammar.relative_pronoun.missing": {
    fr: "Aucun pronom relatif détecté (attendu : {{expected}}).",
    ar: "لم يتم العثور على ضمير موصول (المتوقع: {{expected}}).",
    de: "Kein Relativpronomen erkannt (erwartet: {{expected}}).",
  },
  "grammar.relative_pronoun.wrong": {
    fr: "Pronom relatif incorrect (attendu {{expected}}, obtenu {{got}}).",
    ar: "ضمير موصول غير صحيح (المتوقع {{expected}}، الموجود {{got}}).",
    de: "Falsches Relativpronomen (erwartet {{expected}}, erhalten {{got}}).",
  },

  // --- fragen_zum_text --------------------------------------------------------
  // reading.info.expressed/missing each have TWO call sites with different
  // param sets (see InformationExpressedSkill) -- only expressed/total are
  // common to both, so "missing"/"reason" are not interpolated here, same
  // conservative policy as every other multi-call-site key above.
  "reading.info.expressed": {
    fr: "Les informations requises sont exprimées ({{expressed}}/{{total}}).",
    ar: "تم التعبير عن المعلومات المطلوبة ({{expressed}}/{{total}}).",
    de: "Die erforderlichen Informationen sind enthalten ({{expressed}}/{{total}}).",
  },
  "reading.info.missing": {
    fr: "Les informations requises ne sont pas exprimées ({{expressed}}/{{total}}).",
    ar: "لم يتم التعبير عن المعلومات المطلوبة ({{expressed}}/{{total}}).",
    de: "Die erforderlichen Informationen fehlen ({{expressed}}/{{total}}).",
  },
  "reading.info.partial": {
    fr: "Certaines informations requises sont exprimées ({{expressed}}/{{total}}).",
    ar: "تم التعبير عن بعض المعلومات المطلوبة ({{expressed}}/{{total}}).",
    de: "Einige der erforderlichen Informationen sind enthalten ({{expressed}}/{{total}}).",
  },
  "structure.full_sentence.correct": {
    fr: "La réponse est formulée en phrase complète.",
    ar: "الإجابة مكتوبة بجملة كاملة.",
    de: "Die Antwort ist ein vollständiger Satz.",
  },
  "structure.full_sentence.missing": {
    fr: "Aucune réponse fournie.",
    ar: "لم تُقدَّم أي إجابة.",
    de: "Keine Antwort angegeben.",
  },
  "structure.full_sentence.fragment": {
    fr: "La réponse doit être une phrase complète, pas un simple mot-clé.",
    ar: "يجب أن تكون الإجابة جملة كاملة، لا مجرد كلمة مفردة.",
    de: "Die Antwort muss ein vollständiger Satz sein, kein einzelnes Stichwort.",
  },
  // Migration Plan Phase 7 — the verb-shape heuristic's own failure key,
  // distinct from "fragment" (too few words): enough words, but none of
  // them look like a conjugated verb (e.g. a noun-phrase-only answer).
  "structure.full_sentence.no_verb": {
    fr: "La réponse contient assez de mots, mais ne semble pas comporter de verbe conjugué.",
    ar: "الإجابة تحتوي على عدد كافٍ من الكلمات، لكنها لا تبدو تحتوي على فعل مصرّف.",
    de: "Die Antwort hat genug Wörter, scheint aber kein konjugiertes Verb zu enthalten.",
  },

  // --- grammatik_konnektoren ---------------------------------------------
  "grammar.connector.correct": {
    fr: "Le connecteur est correct.",
    ar: "أداة الربط صحيحة.",
    de: "Der Konnektor ist richtig.",
  },
  "grammar.connector.missing": {
    fr: "Aucun connecteur fourni.",
    ar: "لم تُقدَّم أداة ربط.",
    de: "Kein Konnektor angegeben.",
  },
  "grammar.connector.wrong": {
    fr: "Connecteur incorrect (attendu {{expected}}, obtenu {{got}}).",
    ar: "أداة ربط غير صحيحة (المتوقع {{expected}}، الموجود {{got}}).",
    de: "Falscher Konnektor (erwartet {{expected}}, erhalten {{got}}).",
  },

  // --- grammatik_deklination ------------------------------------------------
  // grammar.declension.correct has two call sites, one with no wrongGaps
  // param (the "no gaps at all" edge case) -- only correct/total are common
  // to both, same conservative policy as every multi-call-site key above.
  "grammar.declension.correct": {
    fr: "Toutes les terminaisons sont correctes ({{correct}}/{{total}}).",
    ar: "جميع النهايات صحيحة ({{correct}}/{{total}}).",
    de: "Alle Endungen sind richtig ({{correct}}/{{total}}).",
  },
  "grammar.declension.missing": {
    fr: "Aucune terminaison n'a été renseignée.",
    ar: "لم يتم إدخال أي نهاية.",
    de: "Es wurden keine Endungen angegeben.",
  },
  "grammar.declension.wrong": {
    fr: "Aucune terminaison correcte ({{correct}}/{{total}}). Emplacements à revoir : {{wrongGaps}}.",
    ar: "لا توجد نهايات صحيحة ({{correct}}/{{total}}). المواضع التي يجب مراجعتها: {{wrongGaps}}.",
    de: "Keine der Endungen ist richtig ({{correct}}/{{total}}). Zu überprüfende Stellen: {{wrongGaps}}.",
  },
  "grammar.declension.partial": {
    fr: "{{correct}}/{{total}} terminaisons correctes. Emplacements à revoir : {{wrongGaps}}.",
    ar: "{{correct}}/{{total}} نهايات صحيحة. المواضع التي يجب مراجعتها: {{wrongGaps}}.",
    de: "{{correct}}/{{total}} Endungen richtig. Zu überprüfende Stellen: {{wrongGaps}}.",
  },

  // --- kompositum_loesen (Migration Plan Phase 6) ---------------------------
  "vocab.compound.correct": {
    fr: "Les deux parties du composé sont correctes ({{correct}}/{{total}}).",
    ar: "كلا جزأي الكلمة المركبة صحيحان ({{correct}}/{{total}}).",
    de: "Beide Teile des Kompositums sind richtig ({{correct}}/{{total}}).",
  },
  "vocab.compound.missing": {
    fr: "Aucune des deux parties n'a été renseignée.",
    ar: "لم يتم إدخال أي من الجزأين.",
    de: "Es wurde keiner der beiden Teile angegeben.",
  },
  "vocab.compound.wrong": {
    fr: "Aucune des deux parties n'est correcte ({{correct}}/{{total}}). À revoir : {{wrongParts}}.",
    ar: "لا يوجد جزء صحيح ({{correct}}/{{total}}). للمراجعة: {{wrongParts}}.",
    de: "Keiner der beiden Teile ist richtig ({{correct}}/{{total}}). Zu überprüfen: {{wrongParts}}.",
  },
  "vocab.compound.partial": {
    fr: "{{correct}}/{{total}} partie(s) correcte(s). À revoir : {{wrongParts}}.",
    ar: "{{correct}}/{{total}} جزء (أجزاء) صحيح. للمراجعة: {{wrongParts}}.",
    de: "{{correct}}/{{total}} Teil(e) richtig. Zu überprüfen: {{wrongParts}}.",
  },

  // --- wortableitung (Migration Plan Phase 6) --------------------------------
  "vocab.derivation.correct": {
    fr: "La dérivation est correcte.",
    ar: "الصيغة المشتقة صحيحة.",
    de: "Die Ableitung ist richtig.",
  },
  "vocab.derivation.missing": {
    fr: "Aucune réponse fournie.",
    ar: "لم تُقدَّم أي إجابة.",
    de: "Keine Antwort angegeben.",
  },
  "vocab.derivation.wrong": {
    fr: "Dérivation incorrecte. Attendu : {{expected}}.",
    ar: "صيغة مشتقة غير صحيحة. المتوقع: {{expected}}.",
    de: "Falsche Ableitung. Erwartet: {{expected}}.",
  },
  "vocab.derivation.wrong_article": {
    fr: "Le mot est correct mais l'article est incorrect (attendu {{expected}}, obtenu {{got}}).",
    ar: "الكلمة صحيحة لكن الأداة غير صحيحة (المتوقع {{expected}}، الموجود {{got}}).",
    de: "Das Wort ist richtig, aber der Artikel ist falsch (erwartet {{expected}}, erhalten {{got}}).",
  },
  // --- wortableitung, Migration Plan Phase 2 additions (V1 parity: the
  // Majuskel/capitalization check, and the new fuzzy-tolerance typo case) --
  "vocab.derivation.wrong_capitalization": {
    fr: "Le mot est correct mais il manque la majuscule (attendu {{expected}}).",
    ar: "الكلمة صحيحة لكن ينقصها الحرف الكبير (المتوقع {{expected}}).",
    de: "Das Wort ist richtig, aber die Großschreibung fehlt (erwartet {{expected}}).",
  },
  "vocab.derivation.wrong_capitalization_and_article": {
    fr: "Le mot est correct, mais la majuscule et l'article sont tous deux incorrects (attendu {{expectedArticle}} {{expected}}, article obtenu {{gotArticle}}).",
    ar: "الكلمة صحيحة، لكن الحرف الكبير والأداة كلاهما غير صحيحين (المتوقع {{expectedArticle}} {{expected}}، الأداة الموجودة {{gotArticle}}).",
    de: "Das Wort ist richtig, aber Großschreibung und Artikel sind beide falsch (erwartet {{expectedArticle}} {{expected}}, erhaltener Artikel {{gotArticle}}).",
  },
  "vocab.derivation.typo": {
    fr: "Faute de frappe probable, proche de {{closest}} (distance {{distance}}) — crédit partiel accordé.",
    ar: "يُحتمل وجود خطأ إملائي، قريب من {{closest}} (المسافة {{distance}}) — تم منح درجة جزئية.",
    de: "Wahrscheinlicher Tippfehler, nahe an {{closest}} (Distanz {{distance}}) — Teilpunkte vergeben.",
  },
};

/** Translate one FeedbackItem. Never throws: an untranslated key degrades to a visible placeholder. */
export function translateFeedbackItem(
  item: FeedbackItem,
  locale: Locale,
  dictionary: TranslationDictionary = FEEDBACK_TRANSLATIONS,
): string {
  const entry = dictionary[item.key];
  if (!entry) return `[untranslated: ${item.key}]`;
  return interpolate(entry[locale], item.params);
}

/**
 * Translate a whole feedback list into ONE string (one line per item),
 * matching the legacy contract's single feedback_fr/feedback_ar/feedback_de
 * string per question — even though the new engine can report several
 * skill-level verdicts for one question. A richer per-skill breakdown UI is
 * a separate, later frontend change, not required for this migration step.
 */
export function translateFeedback(
  items: readonly FeedbackItem[],
  locale: Locale,
  dictionary: TranslationDictionary = FEEDBACK_TRANSLATIONS,
): string {
  return items.map((item) => translateFeedbackItem(item, locale, dictionary)).join("\n");
}
