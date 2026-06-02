import type { Locale } from "@/lib/i18n";

export interface ExamFormTranslations {
  // Page titles
  createExam: string;
  editExam: string;

  // Metadata section
  metadata: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  cefrLevel: string;
  cefrLevelPlaceholder: string;
  durationMinutes: string;
  durationPlaceholder: string;
  totalPoints: string;

  // Sections
  sections: string;
  section: string;
  sectionNumber: string;
  addSection: string;
  deleteSection: string;
  deleteSectionConfirm: string;
  sectionTitleFr: string;
  sectionTitleAr: string;
  instructionsFr: string;
  passageDe: string;
  passageDePlaceholder: string;
  sectionKind: string;
  noSections: string;
  expandSection: string;
  collapseSection: string;

  // Section kinds
  kindReading: string;
  kindWriting: string;
  kindGrammar: string;
  kindVocabulary: string;

  // Questions
  questions: string;
  question: string;
  questionNumber: string;
  addQuestion: string;
  deleteQuestion: string;
  deleteQuestionConfirm: string;
  questionType: string;
  promptFr: string;
  promptAr: string;
  promptDe: string;
  points: string;
  gradeMethod: string;
  noQuestions: string;

  // Question types
  typeMcq: string;
  typeTrueFalse: string;
  typeFillBlank: string;
  typeCloze: string;
  typeMatching: string;
  typeOrdering: string;
  typeShortText: string;
  typeEssay: string;

  // Grade methods
  gradeAuto: string;
  gradeAi: string;
  gradeManual: string;

  // MCQ editor
  mcqOptions: string;
  mcqOptionText: string;
  mcqCorrectOption: string;
  mcqAddOption: string;
  mcqRemoveOption: string;
  mcqMinOptions: string;

  // True/False editor
  tfTrue: string;
  tfFalse: string;
  tfCorrectAnswer: string;

  // Fill blank editor
  fillCorrectAnswer: string;
  fillAlternatives: string;
  fillAddAlternative: string;
  fillRemoveAlternative: string;

  // Short text editor
  shortSampleAnswer: string;

  // Essay editor
  essayMaxWords: string;

  // Matching editor
  matchingPairs: string;
  matchingLeft: string;
  matchingRight: string;
  matchingAddPair: string;
  matchingRemovePair: string;
  matchingMinPairs: string;

  // Ordering editor
  orderingItems: string;
  orderingItem: string;
  orderingAddItem: string;
  orderingRemoveItem: string;
  orderingMinItems: string;
  orderingHint: string;

  // Cloze editor
  clozeText: string;
  clozeTextPlaceholder: string;
  clozeAnswers: string;
  clozeAnswer: string;
  clozeAddAnswer: string;
  clozeRemoveAnswer: string;
  clozeHint: string;

  // Action buttons
  save: string;
  cancel: string;
  saving: string;

  // Validation
  titleRequired: string;
  sectionTitleRequired: string;

  // Placeholders
  placeholderTitleFr: string;
  placeholderTitleAr: string;
  placeholderDescriptionFr: string;
  placeholderDescriptionAr: string;
  placeholderInstructionsFr: string;
  placeholderPromptFr: string;
  placeholderSectionTitleFr: string;
  placeholderSectionTitleAr: string;

  // Toast messages
  toastSaveSuccess: string;
  toastSaveError: string;
}

export const examFormTranslations: Record<Locale, ExamFormTranslations> = {
  fr: {
    // Page titles
    createExam: "Creer un examen",
    editExam: "Modifier l'examen",

    // Metadata section
    metadata: "Informations de l'examen",
    titleFr: "Titre (Francais)",
    titleAr: "Titre (Arabe)",
    descriptionFr: "Description (Francais)",
    descriptionAr: "Description (Arabe)",
    cefrLevel: "Niveau CECRL",
    cefrLevelPlaceholder: "Selectionner un niveau",
    durationMinutes: "Duree (minutes)",
    durationPlaceholder: "ex: 90",
    totalPoints: "Total des points",

    // Sections
    sections: "Sections de l'examen",
    section: "Section",
    sectionNumber: "Section {n}",
    addSection: "Ajouter une section",
    deleteSection: "Supprimer la section",
    deleteSectionConfirm: "Supprimer cette section et toutes ses questions ?",
    sectionTitleFr: "Titre de la section (Francais)",
    sectionTitleAr: "Titre de la section (Arabe)",
    instructionsFr: "Instructions (Francais)",
    passageDe: "Texte en allemand",
    passageDePlaceholder: "Collez le texte allemand ici...",
    sectionKind: "Type de section",
    noSections: "Aucune section. Ajoutez une section pour commencer.",
    expandSection: "Developper",
    collapseSection: "Reduire",

    // Section kinds
    kindReading: "Comprehension ecrite",
    kindWriting: "Expression ecrite",
    kindGrammar: "Grammaire",
    kindVocabulary: "Vocabulaire",

    // Questions
    questions: "Questions",
    question: "Question",
    questionNumber: "Question {n}",
    addQuestion: "Ajouter une question",
    deleteQuestion: "Supprimer",
    deleteQuestionConfirm: "Supprimer cette question ?",
    questionType: "Type de question",
    promptFr: "Enonce (Francais)",
    promptAr: "Enonce (Arabe)",
    promptDe: "Enonce (Allemand)",
    points: "Points",
    gradeMethod: "Correction",
    noQuestions: "Aucune question dans cette section.",

    // Question types
    typeMcq: "Choix multiple (QCM)",
    typeTrueFalse: "Vrai / Faux",
    typeFillBlank: "Texte a trous",
    typeCloze: "Closure (Cloze)",
    typeMatching: "Appariement",
    typeOrdering: "Mise en ordre",
    typeShortText: "Reponse courte",
    typeEssay: "Redaction",

    // Grade methods
    gradeAuto: "Automatique",
    gradeAi: "IA",
    gradeManual: "Manuelle",

    // MCQ editor
    mcqOptions: "Options",
    mcqOptionText: "Texte de l'option",
    mcqCorrectOption: "Correct",
    mcqAddOption: "Ajouter une option",
    mcqRemoveOption: "Retirer",
    mcqMinOptions: "Minimum 2 options requises",

    // True/False editor
    tfTrue: "Vrai",
    tfFalse: "Faux",
    tfCorrectAnswer: "Reponse correcte",

    // Fill blank editor
    fillCorrectAnswer: "Reponse correcte",
    fillAlternatives: "Alternatives acceptees",
    fillAddAlternative: "Ajouter une alternative",
    fillRemoveAlternative: "Retirer",

    // Short text editor
    shortSampleAnswer: "Exemple de reponse",

    // Essay editor
    essayMaxWords: "Nombre maximum de mots",

    // Matching editor
    matchingPairs: "Paires",
    matchingLeft: "Element gauche",
    matchingRight: "Element droit",
    matchingAddPair: "Ajouter une paire",
    matchingRemovePair: "Retirer",
    matchingMinPairs: "Minimum 2 paires requises",

    // Ordering editor
    orderingItems: "Elements (dans l'ordre correct)",
    orderingItem: "Element",
    orderingAddItem: "Ajouter un element",
    orderingRemoveItem: "Retirer",
    orderingMinItems: "Minimum 2 elements requis",
    orderingHint: "L'ordre des elements ci-dessous represente l'ordre correct.",

    // Cloze editor
    clozeText: "Texte avec espaces",
    clozeTextPlaceholder:
      "Utilisez ___ pour marquer les espaces. Ex: Der Hund ___ im Garten.",
    clozeAnswers: "Reponses (dans l'ordre des espaces)",
    clozeAnswer: "Reponse",
    clozeAddAnswer: "Ajouter une reponse",
    clozeRemoveAnswer: "Retirer",
    clozeHint:
      "Utilisez ___ (3 tirets bas) pour chaque espace dans le texte.",

    // Action buttons
    save: "Enregistrer l'examen",
    cancel: "Annuler",
    saving: "Enregistrement...",

    // Validation
    titleRequired: "Le titre en francais est requis",
    sectionTitleRequired: "Le titre de la section est requis",

    // Placeholders
    placeholderTitleFr: "ex: Examen BAC Allemand 2025 — Session 1",
    placeholderTitleAr: "العنوان بالعربية",
    placeholderDescriptionFr: "Description de l'examen...",
    placeholderDescriptionAr: "وصف الامتحان...",
    placeholderInstructionsFr: "Consignes pour cette section...",
    placeholderPromptFr: "Enonce de la question...",
    placeholderSectionTitleFr: "ex: Comprehension de texte",
    placeholderSectionTitleAr: "عنوان القسم بالعربية",

    // Toast messages
    toastSaveSuccess: "Examen enregistre avec succes",
    toastSaveError: "Erreur lors de l'enregistrement",
  },
  ar: {
    // Page titles
    createExam: "انشاء امتحان",
    editExam: "تعديل الامتحان",

    // Metadata section
    metadata: "معلومات الامتحان",
    titleFr: "العنوان (فرنسي)",
    titleAr: "العنوان (عربي)",
    descriptionFr: "الوصف (فرنسي)",
    descriptionAr: "الوصف (عربي)",
    cefrLevel: "مستوى CECRL",
    cefrLevelPlaceholder: "اختر مستوى",
    durationMinutes: "المدة (دقائق)",
    durationPlaceholder: "مثلا: 90",
    totalPoints: "مجموع النقاط",

    // Sections
    sections: "اقسام الامتحان",
    section: "قسم",
    sectionNumber: "القسم {n}",
    addSection: "اضافة قسم",
    deleteSection: "حذف القسم",
    deleteSectionConfirm: "حذف هذا القسم وجميع اسئلته؟",
    sectionTitleFr: "عنوان القسم (فرنسي)",
    sectionTitleAr: "عنوان القسم (عربي)",
    instructionsFr: "التعليمات (فرنسي)",
    passageDe: "النص بالالمانية",
    passageDePlaceholder: "الصق النص الالماني هنا...",
    sectionKind: "نوع القسم",
    noSections: "لا توجد اقسام. اضف قسما للبدء.",
    expandSection: "توسيع",
    collapseSection: "تقليص",

    // Section kinds
    kindReading: "فهم مكتوب",
    kindWriting: "تعبير كتابي",
    kindGrammar: "قواعد",
    kindVocabulary: "مفردات",

    // Questions
    questions: "الاسئلة",
    question: "سؤال",
    questionNumber: "السؤال {n}",
    addQuestion: "اضافة سؤال",
    deleteQuestion: "حذف",
    deleteQuestionConfirm: "حذف هذا السؤال؟",
    questionType: "نوع السؤال",
    promptFr: "نص السؤال (فرنسي)",
    promptAr: "نص السؤال (عربي)",
    promptDe: "نص السؤال (الماني)",
    points: "النقاط",
    gradeMethod: "طريقة التصحيح",
    noQuestions: "لا توجد اسئلة في هذا القسم.",

    // Question types
    typeMcq: "اختيار متعدد",
    typeTrueFalse: "صحيح / خطا",
    typeFillBlank: "ملء الفراغات",
    typeCloze: "اختبار الاغلاق",
    typeMatching: "مطابقة",
    typeOrdering: "ترتيب",
    typeShortText: "اجابة قصيرة",
    typeEssay: "مقال",

    // Grade methods
    gradeAuto: "تلقائي",
    gradeAi: "ذكاء اصطناعي",
    gradeManual: "يدوي",

    // MCQ editor
    mcqOptions: "الخيارات",
    mcqOptionText: "نص الخيار",
    mcqCorrectOption: "صحيح",
    mcqAddOption: "اضافة خيار",
    mcqRemoveOption: "ازالة",
    mcqMinOptions: "مطلوب خياران على الاقل",

    // True/False editor
    tfTrue: "صحيح",
    tfFalse: "خطا",
    tfCorrectAnswer: "الاجابة الصحيحة",

    // Fill blank editor
    fillCorrectAnswer: "الاجابة الصحيحة",
    fillAlternatives: "البدائل المقبولة",
    fillAddAlternative: "اضافة بديل",
    fillRemoveAlternative: "ازالة",

    // Short text editor
    shortSampleAnswer: "نموذج الاجابة",

    // Essay editor
    essayMaxWords: "الحد الاقصى للكلمات",

    // Matching editor
    matchingPairs: "الازواج",
    matchingLeft: "العنصر الايسر",
    matchingRight: "العنصر الايمن",
    matchingAddPair: "اضافة زوج",
    matchingRemovePair: "ازالة",
    matchingMinPairs: "مطلوب زوجان على الاقل",

    // Ordering editor
    orderingItems: "العناصر (بالترتيب الصحيح)",
    orderingItem: "عنصر",
    orderingAddItem: "اضافة عنصر",
    orderingRemoveItem: "ازالة",
    orderingMinItems: "مطلوب عنصران على الاقل",
    orderingHint: "ترتيب العناصر ادناه يمثل الترتيب الصحيح.",

    // Cloze editor
    clozeText: "النص مع الفراغات",
    clozeTextPlaceholder:
      "استخدم ___ لتحديد الفراغات. مثال: Der Hund ___ im Garten.",
    clozeAnswers: "الاجابات (بترتيب الفراغات)",
    clozeAnswer: "اجابة",
    clozeAddAnswer: "اضافة اجابة",
    clozeRemoveAnswer: "ازالة",
    clozeHint: "استخدم ___ (3 شرطات سفلية) لكل فراغ في النص.",

    // Action buttons
    save: "حفظ الامتحان",
    cancel: "الغاء",
    saving: "جاري الحفظ...",

    // Validation
    titleRequired: "العنوان بالفرنسية مطلوب",
    sectionTitleRequired: "عنوان القسم مطلوب",

    // Placeholders
    placeholderTitleFr: "مثال: Examen BAC Allemand 2025 — Session 1",
    placeholderTitleAr: "العنوان بالعربية",
    placeholderDescriptionFr: "وصف الامتحان...",
    placeholderDescriptionAr: "وصف الامتحان بالعربية...",
    placeholderInstructionsFr: "تعليمات هذا القسم...",
    placeholderPromptFr: "نص السؤال...",
    placeholderSectionTitleFr: "مثال: فهم النص",
    placeholderSectionTitleAr: "عنوان القسم بالعربية",

    // Toast messages
    toastSaveSuccess: "تم حفظ الامتحان بنجاح",
    toastSaveError: "خطا اثناء الحفظ",
  },
};
