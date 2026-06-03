/**
 * The 6 thematic units (Einheiten) that organize exams.
 * Stored in exams.slug as "einheit-01" through "einheit-06".
 */

export interface Einheit {
  id: string;        // "einheit-01" ... "einheit-06" (stored in exams.slug)
  number: string;    // "01" ... "06"
  title_de: string;  // German title
  title_fr: string;  // French title
  title_ar: string;  // Arabic title
  icon: string;      // Emoji icon
  color: string;     // Brand color hex
}

export const EINHEITEN: Einheit[] = [
  {
    id: "einheit-01",
    number: "01",
    title_de: "Geografie",
    title_fr: "Géographie",
    title_ar: "الجغرافيا",
    icon: "🌍",
    color: "#0FB6A3", // teal
  },
  {
    id: "einheit-02",
    number: "02",
    title_de: "Biografie",
    title_fr: "Biographie",
    title_ar: "السيرة الذاتية",
    icon: "👤",
    color: "#6C4CE0", // violet
  },
  {
    id: "einheit-03",
    number: "03",
    title_de: "Technologie",
    title_fr: "Technologie",
    title_ar: "التكنولوجيا",
    icon: "💻",
    color: "#FFB200", // gold
  },
  {
    id: "einheit-04",
    number: "04",
    title_de: "Umwelt",
    title_fr: "Environnement",
    title_ar: "البيئة",
    icon: "🌱",
    color: "#16a34a", // green
  },
  {
    id: "einheit-05",
    number: "05",
    title_de: "Medien",
    title_fr: "Médias",
    title_ar: "الإعلام",
    icon: "📱",
    color: "#FF5A5F", // coral
  },
  {
    id: "einheit-06",
    number: "06",
    title_de: "Jugend und Arbeitswelten",
    title_fr: "Jeunesse et monde du travail",
    title_ar: "الشباب وعالم العمل",
    icon: "🎓",
    color: "#8B5CF6", // purple
  },
];

export function getEinheitById(id: string): Einheit | undefined {
  return EINHEITEN.find((e) => e.id === id);
}

export function getEinheitLabel(id: string, locale: "fr" | "ar"): string {
  const e = getEinheitById(id);
  if (!e) return id;
  const title = locale === "ar" ? e.title_ar : e.title_fr;
  return `Einheit ${e.number}: ${e.title_de} — ${title}`;
}

export function getEinheitShortLabel(id: string, locale: "fr" | "ar"): string {
  const e = getEinheitById(id);
  if (!e) return id;
  return `${e.icon} Einheit ${e.number}`;
}
