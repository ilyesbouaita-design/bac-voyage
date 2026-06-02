/**
 * Lightweight i18n system for BacAllemand.
 * Supports French (default) and Arabic with RTL direction switching.
 */

export type Locale = "fr" | "ar";

export interface Translations {
  // Navbar
  nav_home: string;
  nav_about: string;
  nav_login: string;
  nav_signup: string;
  nav_dark_mode: string;

  // Hero
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  hero_cta_secondary: string;

  // Features
  features_title: string;
  features_subtitle: string;
  feature_grammatik_title: string;
  feature_grammatik_desc: string;
  feature_wortschatz_title: string;
  feature_wortschatz_desc: string;
  feature_bac_title: string;
  feature_bac_desc: string;

  // About
  about_title: string;
  about_subtitle: string;
  about_bio: string;
  about_credential_1: string;
  about_credential_2: string;
  about_credential_3: string;

  // Footer
  footer_rights: string;
  footer_tagline: string;
}

const fr: Translations = {
  // Navbar
  nav_home: "Accueil",
  nav_about: "À propos",
  nav_login: "Se connecter",
  nav_signup: "S'inscrire",
  nav_dark_mode: "Mode sombre",

  // Hero
  hero_title: "Maîtrise l'allemand.\nRéussis ton Bac.",
  hero_subtitle:
    "Grammaire, vocabulaire et examens corrigés par intelligence artificielle. Une plateforme bilingue conçue pour les étudiants algériens.",
  hero_cta: "Commencer gratuitement",
  hero_cta_secondary: "En savoir plus",

  // Features
  features_title: "Tout ce qu'il faut pour réussir",
  features_subtitle:
    "Trois piliers d'apprentissage structuré, alimentés par l'IA.",
  feature_grammatik_title: "Grammatik",
  feature_grammatik_desc:
    "Maîtrise les règles de grammaire allemande avec des exercices interactifs, des explications claires et un suivi de progression personnalisé.",
  feature_wortschatz_title: "Wortschatz",
  feature_wortschatz_desc:
    "Enrichis ton vocabulaire avec des listes thématiques, des flashcards intelligentes et des exercices contextualisés pour chaque niveau.",
  feature_bac_title: "Bac — Examens",
  feature_bac_desc:
    "Entraîne-toi avec des sujets d'examen réels corrigés par IA. Obtiens un feedback détaillé et améliore tes résultats progressivement.",

  // About
  about_title: "À propos du professeur",
  about_subtitle: "L'expertise derrière BacAllemand",
  about_bio:
    "Je suis professeur d'allemand titulaire d'un Master en Germanistik, examinateur certifié du Goethe-Institut et détenteur du certificat DLL (Deutsch Lehren Lernen). Mon approche pédagogique combine expertise académique, expérience pratique en classe et méthodes modernes fondées sur la recherche pour aider les apprenants à progresser durablement.\n\nTout au long de ma carrière, j'ai travaillé avec des étudiants de différents âges et niveaux, en mettant toujours l'accent sur un apprentissage de l'allemand accessible, engageant et efficace.\n\nJe crois qu'un apprentissage réussi des langues va au-delà de la mémorisation de règles et de vocabulaire. Il nécessite des conseils clairs, un apprentissage structuré et des supports qui relient les connaissances en classe à la communication réelle et à la réussite aux examens.\n\nMon objectif est d'aider les apprenants à acquérir confiance, à développer de solides compétences linguistiques et à atteindre leurs objectifs académiques, professionnels ou personnels en allemand.",
  about_credential_1: "Master en Germanistik",
  about_credential_2: "Examinateur certifié Goethe-Institut",
  about_credential_3: "Certificat DLL (Deutsch Lehren Lernen)",

  // Footer
  footer_rights: "Tous droits réservés.",
  footer_tagline: "Apprends l'allemand. Réussis ton bac.",
};

const ar: Translations = {
  // Navbar
  nav_home: "الرئيسية",
  nav_about: "حول",
  nav_login: "تسجيل الدخول",
  nav_signup: "إنشاء حساب",
  nav_dark_mode: "الوضع الداكن",

  // Hero
  hero_title: "أتقن الألمانية.\nانجح في الباكالوريا.",
  hero_subtitle:
    "قواعد، مفردات وامتحانات مصحّحة بالذكاء الاصطناعي. منصة ثنائية اللغة مصمّمة للطلاب الجزائريين.",
  hero_cta: "ابدأ مجانًا",
  hero_cta_secondary: "اعرف أكثر",

  // Features
  features_title: "كل ما تحتاجه للنجاح",
  features_subtitle: "ثلاثة أعمدة للتعلّم المنظّم، مدعومة بالذكاء الاصطناعي.",
  feature_grammatik_title: "Grammatik — القواعد",
  feature_grammatik_desc:
    "أتقن قواعد اللغة الألمانية من خلال تمارين تفاعلية وشروحات واضحة ومتابعة تقدّم مخصّصة.",
  feature_wortschatz_title: "Wortschatz — المفردات",
  feature_wortschatz_desc:
    "وسّع مفرداتك بقوائم موضوعية وبطاقات ذكية وتمارين سياقية لكل مستوى.",
  feature_bac_title: "Bac — الامتحانات",
  feature_bac_desc:
    "تدرّب على مواضيع امتحانات حقيقية مصحّحة بالذكاء الاصطناعي. احصل على تقييم مفصّل وحسّن نتائجك تدريجيًا.",

  // About
  about_title: "عن الأستاذ",
  about_subtitle: "الخبرة وراء BacAllemand",
  about_bio:
    "أنا أستاذ لغة ألمانية حاصل على ماجستير في Germanistik، وممتحن معتمد من معهد غوته، وحامل شهادة DLL (Deutsch Lehren Lernen). يجمع نهجي التعليمي بين الخبرة الأكاديمية والتجربة العملية في الفصل والأساليب الحديثة المبنية على البحث لمساعدة المتعلمين على التقدّم بشكل دائم.\n\nخلال مسيرتي المهنية، عملت مع طلاب من مختلف الأعمار والمستويات، مع التركيز دائمًا على جعل تعلّم الألمانية سهلاً وممتعًا وفعّالاً.\n\nأؤمن بأن تعلّم اللغات بنجاح يتجاوز حفظ القواعد والمفردات. إنه يتطلب إرشادًا واضحًا وتعلّمًا منظّمًا ومواد تربط بين المعرفة في الفصل والتواصل الحقيقي والنجاح في الامتحانات.\n\nهدفي هو مساعدة المتعلمين على بناء الثقة وتطوير مهارات لغوية قوية وتحقيق أهدافهم الأكاديمية والمهنية والشخصية في اللغة الألمانية.",
  about_credential_1: "ماجستير في Germanistik",
  about_credential_2: "ممتحن معتمد من معهد غوته",
  about_credential_3: "شهادة DLL (Deutsch Lehren Lernen)",

  // Footer
  footer_rights: "جميع الحقوق محفوظة.",
  footer_tagline: "تعلّم الألمانية. انجح في الباكالوريا.",
};

export const translations: Record<Locale, Translations> = { fr, ar };

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem("locale");
    if (saved === "ar" || saved === "fr") return saved;
  } catch {
    /* SSR or private browsing */
  }
  return "fr";
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem("locale", locale);
  } catch {
    /* ignore */
  }
}
