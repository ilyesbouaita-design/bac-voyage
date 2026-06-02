import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/wortschatz")({
  component: WortschatzPage,
});

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-brand-teal"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PenToolIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m12 19 7-7 3 3-7 7-3-3z" />
      <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="m2 2 7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-300">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

const cefrColors: Record<string, string> = {
  A1: "bg-green-100 text-green-700",
  A2: "bg-lime-100 text-lime-700",
  B1: "bg-yellow-100 text-yellow-700",
  B2: "bg-orange-100 text-orange-700",
  C1: "bg-red-100 text-red-700",
  C2: "bg-purple-100 text-purple-700",
};

interface VocabSet {
  id: string;
  title_fr: string;
  title_ar: string;
  theme?: string;
  cefr_level?: string;
  order_index?: number;
  wordCount?: number;
}

function WortschatzPage() {
  const auth = useAuth("student");
  const { locale } = useLocale();
  const t = dashboardTranslations[locale];

  const [sets, setSets] = useState<VocabSet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  useEffect(() => {
    async function fetchSets() {
      setDataLoading(true);

      const { data: setsData, error } = await supabase
        .from("vocab_sets")
        .select("id, title_fr, title_ar, theme, cefr_level, order_index")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error || !setsData) {
        setSets([]);
        setDataLoading(false);
        return;
      }

      // Fetch word counts for each set
      const setsWithCounts = await Promise.all(
        setsData.map(async (set) => {
          const { count } = await supabase
            .from("vocab_words")
            .select("id", { count: "exact", head: true })
            .eq("set_id", set.id);
          return { ...set, wordCount: count ?? 0 };
        })
      );

      setSets(setsWithCounts);
      setDataLoading(false);
    }

    fetchSets();
  }, []);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerIcon />
      </div>
    );
  }

  const isEmpty = !dataLoading && sets.length === 0;

  return (
    <DashboardLayout sidebarItems={sidebarItems} user={auth}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wortschatz</h1>
          <p className="mt-1 text-gray-500">{t.vocab_subtitle}</p>
        </div>

        {/* Loading state */}
        {dataLoading && (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <EmptyIcon />
            <p className="mt-4 text-gray-500 font-medium">{t.empty_vocab_sets}</p>
            <p className="text-sm text-gray-400 mt-1">{t.empty_vocab_sets_hint}</p>
          </div>
        )}

        {/* Vocab sets grid */}
        {!dataLoading && sets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((set) => {
              const title = locale === "ar" ? set.title_ar : set.title_fr;
              const cefrClass = set.cefr_level
                ? (cefrColors[set.cefr_level] ?? "bg-gray-100 text-gray-600")
                : "bg-gray-100 text-gray-600";

              return (
                <div
                  key={set.id}
                  className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {set.theme && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal">
                        {set.theme}
                      </span>
                    )}
                    {set.cefr_level && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cefrClass}`}>
                        {set.cefr_level}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 leading-snug">{title}</h3>

                  {/* Word count */}
                  <div className="mt-auto">
                    <span className="text-sm font-medium text-brand-teal">
                      {set.wordCount} {t.words_count_label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
