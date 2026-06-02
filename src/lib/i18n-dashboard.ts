/**
 * Dashboard-specific translations (admin + student).
 * Kept separate from the landing-page i18n to avoid bloating the public bundle.
 */

import type { Locale } from "./i18n";

export interface DashboardTranslations {
  // Sidebar
  sidebar_overview: string;
  sidebar_exams: string;
  sidebar_grammar: string;
  sidebar_vocabulary: string;
  sidebar_students: string;
  sidebar_settings: string;
  sidebar_back_home: string;
  sidebar_logout: string;

  // Admin overview
  admin_welcome: string;
  admin_total_students: string;
  admin_total_exams: string;
  admin_published_exams: string;
  admin_draft_exams: string;
  admin_total_exercises: string;
  admin_recent_activity: string;

  // Admin exams
  exams_title: string;
  exams_create: string;
  exams_edit: string;
  exams_delete: string;
  exams_publish: string;
  exams_unpublish: string;
  exams_no_exams: string;
  exams_search: string;
  exam_title: string;
  exam_description: string;
  exam_level: string;
  exam_duration: string;
  exam_duration_unit: string;
  exam_points: string;
  exam_status: string;
  exam_published: string;
  exam_draft: string;
  exam_created: string;
  exam_sections: string;
  exam_questions: string;
  exam_save: string;
  exam_cancel: string;

  // Admin grammar
  grammar_title: string;
  grammar_create: string;
  grammar_topics: string;
  grammar_lessons: string;
  grammar_no_topics: string;

  // Admin vocabulary
  vocab_title: string;
  vocab_create: string;
  vocab_sets: string;
  vocab_words: string;
  vocab_no_sets: string;

  // Student overview
  student_welcome: string;
  student_xp: string;
  student_level: string;
  student_streak: string;
  student_streak_days: string;
  student_progress: string;
  student_continue: string;
  student_start: string;

  // Student sections
  grammatik_section: string;
  grammatik_desc: string;
  wortschatz_section: string;
  wortschatz_desc: string;
  bac_section: string;
  bac_desc: string;
  topics_available: string;
  sets_available: string;
  exams_available: string;
  exercises_count: string;
  words_count: string;
  view_all: string;
  no_content: string;

  // Exam taking
  exam_start: string;
  exam_submit: string;
  exam_in_progress: string;
  exam_submitted: string;
  exam_graded: string;
  exam_score: string;
  exam_results: string;
  exam_retry: string;
  exam_back: string;

  // Common
  loading: string;
  save: string;
  cancel: string;
  delete_confirm: string;
  yes: string;
  no: string;
  actions: string;
  search: string;
  filter: string;
  all: string;
}

const fr: DashboardTranslations = {
  // Sidebar
  sidebar_overview: "Tableau de bord",
  sidebar_exams: "Examens",
  sidebar_grammar: "Grammaire",
  sidebar_vocabulary: "Vocabulaire",
  sidebar_students: "Étudiants",
  sidebar_settings: "Paramètres",
  sidebar_back_home: "Retour à l'accueil",
  sidebar_logout: "Se déconnecter",

  // Admin overview
  admin_welcome: "Bienvenue, Admin",
  admin_total_students: "Étudiants inscrits",
  admin_total_exams: "Total examens",
  admin_published_exams: "Publiés",
  admin_draft_exams: "Brouillons",
  admin_total_exercises: "Exercices",
  admin_recent_activity: "Activité récente",

  // Admin exams
  exams_title: "Gestion des examens",
  exams_create: "Créer un examen",
  exams_edit: "Modifier",
  exams_delete: "Supprimer",
  exams_publish: "Publier",
  exams_unpublish: "Dépublier",
  exams_no_exams: "Aucun examen créé pour le moment.",
  exams_search: "Rechercher un examen…",
  exam_title: "Titre",
  exam_description: "Description",
  exam_level: "Niveau CECR",
  exam_duration: "Durée",
  exam_duration_unit: "minutes",
  exam_points: "Points",
  exam_status: "Statut",
  exam_published: "Publié",
  exam_draft: "Brouillon",
  exam_created: "Créé le",
  exam_sections: "Sections",
  exam_questions: "Questions",
  exam_save: "Enregistrer",
  exam_cancel: "Annuler",

  // Admin grammar
  grammar_title: "Gestion de la grammaire",
  grammar_create: "Ajouter un thème",
  grammar_topics: "Thèmes",
  grammar_lessons: "Leçons",
  grammar_no_topics: "Aucun thème de grammaire pour le moment.",

  // Admin vocabulary
  vocab_title: "Gestion du vocabulaire",
  vocab_create: "Ajouter un ensemble",
  vocab_sets: "Ensembles",
  vocab_words: "Mots",
  vocab_no_sets: "Aucun ensemble de vocabulaire pour le moment.",

  // Student overview
  student_welcome: "Bonjour",
  student_xp: "XP",
  student_level: "Niveau",
  student_streak: "Série",
  student_streak_days: "jours",
  student_progress: "Ta progression",
  student_continue: "Continuer",
  student_start: "Commencer",

  // Student sections
  grammatik_section: "Grammatik",
  grammatik_desc: "Apprends les règles de grammaire allemande",
  wortschatz_section: "Wortschatz",
  wortschatz_desc: "Enrichis ton vocabulaire allemand",
  bac_section: "Bac — Examens",
  bac_desc: "Entraîne-toi avec des sujets d'examen réels",
  topics_available: "thèmes disponibles",
  sets_available: "ensembles disponibles",
  exams_available: "examens disponibles",
  exercises_count: "exercices",
  words_count: "mots",
  view_all: "Voir tout",
  no_content: "Contenu bientôt disponible.",

  // Exam taking
  exam_start: "Commencer l'examen",
  exam_submit: "Soumettre",
  exam_in_progress: "En cours",
  exam_submitted: "Soumis",
  exam_graded: "Corrigé",
  exam_score: "Score",
  exam_results: "Voir les résultats",
  exam_retry: "Réessayer",
  exam_back: "Retour",

  // Common
  loading: "Chargement…",
  save: "Enregistrer",
  cancel: "Annuler",
  delete_confirm: "Confirmer la suppression ?",
  yes: "Oui",
  no: "Non",
  actions: "Actions",
  search: "Rechercher",
  filter: "Filtrer",
  all: "Tout",
};

const ar: DashboardTranslations = {
  // Sidebar
  sidebar_overview: "لوحة التحكم",
  sidebar_exams: "الامتحانات",
  sidebar_grammar: "القواعد",
  sidebar_vocabulary: "المفردات",
  sidebar_students: "الطلاب",
  sidebar_settings: "الإعدادات",
  sidebar_back_home: "العودة للرئيسية",
  sidebar_logout: "تسجيل الخروج",

  // Admin overview
  admin_welcome: "مرحبًا، المشرف",
  admin_total_students: "الطلاب المسجلون",
  admin_total_exams: "إجمالي الامتحانات",
  admin_published_exams: "منشورة",
  admin_draft_exams: "مسودات",
  admin_total_exercises: "التمارين",
  admin_recent_activity: "النشاط الأخير",

  // Admin exams
  exams_title: "إدارة الامتحانات",
  exams_create: "إنشاء امتحان",
  exams_edit: "تعديل",
  exams_delete: "حذف",
  exams_publish: "نشر",
  exams_unpublish: "إلغاء النشر",
  exams_no_exams: "لا توجد امتحانات حتى الآن.",
  exams_search: "ابحث عن امتحان…",
  exam_title: "العنوان",
  exam_description: "الوصف",
  exam_level: "مستوى CEFR",
  exam_duration: "المدة",
  exam_duration_unit: "دقيقة",
  exam_points: "النقاط",
  exam_status: "الحالة",
  exam_published: "منشور",
  exam_draft: "مسودة",
  exam_created: "تاريخ الإنشاء",
  exam_sections: "الأقسام",
  exam_questions: "الأسئلة",
  exam_save: "حفظ",
  exam_cancel: "إلغاء",

  // Admin grammar
  grammar_title: "إدارة القواعد",
  grammar_create: "إضافة موضوع",
  grammar_topics: "المواضيع",
  grammar_lessons: "الدروس",
  grammar_no_topics: "لا توجد مواضيع قواعد حتى الآن.",

  // Admin vocabulary
  vocab_title: "إدارة المفردات",
  vocab_create: "إضافة مجموعة",
  vocab_sets: "المجموعات",
  vocab_words: "الكلمات",
  vocab_no_sets: "لا توجد مجموعات مفردات حتى الآن.",

  // Student overview
  student_welcome: "مرحبًا",
  student_xp: "نقاط الخبرة",
  student_level: "المستوى",
  student_streak: "سلسلة",
  student_streak_days: "يوم",
  student_progress: "تقدّمك",
  student_continue: "متابعة",
  student_start: "ابدأ",

  // Student sections
  grammatik_section: "Grammatik — القواعد",
  grammatik_desc: "تعلّم قواعد اللغة الألمانية",
  wortschatz_section: "Wortschatz — المفردات",
  wortschatz_desc: "وسّع مفرداتك الألمانية",
  bac_section: "Bac — الامتحانات",
  bac_desc: "تدرّب على مواضيع امتحانات حقيقية",
  topics_available: "مواضيع متاحة",
  sets_available: "مجموعات متاحة",
  exams_available: "امتحانات متاحة",
  exercises_count: "تمارين",
  words_count: "كلمات",
  view_all: "عرض الكل",
  no_content: "المحتوى قريبًا.",

  // Exam taking
  exam_start: "بدء الامتحان",
  exam_submit: "إرسال",
  exam_in_progress: "قيد التقدّم",
  exam_submitted: "تم الإرسال",
  exam_graded: "تم التصحيح",
  exam_score: "النتيجة",
  exam_results: "عرض النتائج",
  exam_retry: "إعادة المحاولة",
  exam_back: "رجوع",

  // Common
  loading: "جارٍ التحميل…",
  save: "حفظ",
  cancel: "إلغاء",
  delete_confirm: "تأكيد الحذف؟",
  yes: "نعم",
  no: "لا",
  actions: "الإجراءات",
  search: "بحث",
  filter: "تصفية",
  all: "الكل",
};

export const dashboardTranslations: Record<Locale, DashboardTranslations> = { fr, ar };
