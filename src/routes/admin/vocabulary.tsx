import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/vocabulary")({
  component: AdminVocabulary,
});

function getT(locale: string) {
  return (
    dashboardTranslations[locale as keyof typeof dashboardTranslations] ??
    dashboardTranslations["fr"]
  );
}

const navItems = (t: ReturnType<typeof getT>) => [
  {
    label: t.sidebar_overview,
    to: "/admin",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: t.sidebar_exams,
    to: "/admin/exams",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: t.sidebar_grammar,
    to: "/admin/grammatik-units",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    label: t.sidebar_vocabulary,
    to: "/admin/wortschatz-units",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

interface VocabSet {
  id: string;
  title_fr: string;
  theme: string;
  cefr_level: string;
  is_published: boolean;
  order_index: number;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-violet border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function cefrColor(level: string) {
  const map: Record<string, string> = {
    A1: "bg-brand-teal/15 text-brand-teal",
    A2: "bg-brand-teal/25 text-brand-teal",
    B1: "bg-brand-violet/15 text-brand-violet",
    B2: "bg-brand-violet/25 text-brand-violet",
    C1: "bg-brand-coral/15 text-brand-coral",
    C2: "bg-brand-coral/25 text-brand-coral",
  };
  return map[level] ?? "bg-gray-100 text-gray-600";
}

function themeColor(theme: string) {
  // Simple deterministic hash for stable colors
  const palette = [
    "bg-brand-gold/15 text-brand-gold",
    "bg-brand-teal/15 text-brand-teal",
    "bg-brand-coral/15 text-brand-coral",
    "bg-brand-violet/15 text-brand-violet",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
  ];
  let hash = 0;
  for (let i = 0; i < theme.length; i++) hash += theme.charCodeAt(i);
  return palette[hash % palette.length];
}

function AdminVocabulary() {
  const { loading } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  const [sets, setSets] = useState<VocabSet[]>([]);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    fetchData();
  }, [loading]);

  async function fetchData() {
    setDataLoading(true);

    const { data: setsData, error: setsError } = await supabase
      .from("vocab_sets")
      .select("*")
      .order("order_index", { ascending: true });

    if (!setsError && setsData) {
      const fetchedSets = setsData as VocabSet[];
      setSets(fetchedSets);

      // Fetch word counts for each set
      const counts: Record<string, number> = {};
      await Promise.all(
        fetchedSets.map(async (set) => {
          const { count } = await supabase
            .from("vocab_words")
            .select("*", { count: "exact", head: true })
            .eq("set_id", set.id);
          counts[set.id] = count ?? 0;
        })
      );
      setWordCounts(counts);
    }

    setDataLoading(false);
  }

  if (loading) return <Spinner />;

  return (
    <DashboardLayout navItems={navItems(t)} role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.admin_vocabulary_title ?? "Vocabulaire"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.admin_vocabulary_subtitle ?? "Manage vocabulary sets and word lists."}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-brand-violet text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-violet/90 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t.admin_vocabulary_add_set ?? "Add set"}
          </button>
        </div>

        {/* Content */}
        {dataLoading ? (
          <Spinner />
        ) : sets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4 opacity-40"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <p className="font-medium">
              {t.admin_vocabulary_empty ?? "No vocabulary sets yet."}
            </p>
            <p className="text-sm mt-1">
              {t.admin_vocabulary_empty_hint ?? "Add your first set to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
                    {set.title_fr}
                  </h2>
                  <span
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cefrColor(set.cefr_level)}`}
                  >
                    {set.cefr_level}
                  </span>
                </div>

                {/* Theme badge */}
                <div>
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${themeColor(set.theme)}`}
                  >
                    {set.theme}
                  </span>
                </div>

                {/* Status + word count */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      set.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        set.is_published ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {set.is_published
                      ? (t.admin_vocabulary_published ?? "Published")
                      : (t.admin_vocabulary_draft ?? "Draft")}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    {wordCounts[set.id] ?? 0}{" "}
                    {t.admin_vocabulary_words ?? "words"}
                  </span>
                </div>

                {/* Footer */}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {t.admin_vocabulary_order ?? "Order"}: #{set.order_index}
                  </span>
                  <button className="text-brand-violet hover:underline font-medium text-xs">
                    {t.admin_vocabulary_edit ?? "Edit"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
