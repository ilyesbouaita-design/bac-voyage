import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/grammatik")({
  component: GrammatikPage,
});

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-brand-violet"
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
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8M12 8v8" />
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

interface GrammarTopic {
  id: string;
  title_fr: string;
  title_ar: string;
  description_fr?: string;
  description_ar?: string;
  cefr_level?: string;
  order_index?: number;
  exerciseCount?: number;
}

function GrammatikPage() {
  const auth = useAuth("student");
  const { locale } = useLocale();
  const t = dashboardTranslations[locale];

  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  useEffect(() => {
    async function fetchTopics() {
      setDataLoading(true);

      const { data: topicsData, error } = await supabase
        .from("grammar_topics")
        .select("id, title_fr, title_ar, description_fr, description_ar, cefr_level, order_index")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error || !topicsData) {
        setTopics([]);
        setDataLoading(false);
        return;
      }

      // Fetch exercise counts for each topic
      const topicsWithCounts = await Promise.all(
        topicsData.map(async (topic) => {
          const { count } = await supabase
            .from("exercises")
            .select("id", { count: "exact", head: true })
            .eq("pillar", "grammatik")
            .eq("topic_id", topic.id);
          return { ...topic, exerciseCount: count ?? 0 };
        })
      );

      setTopics(topicsWithCounts);
      setDataLoading(false);
    }

    fetchTopics();
  }, []);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerIcon />
      </div>
    );
  }

  const isEmpty = !dataLoading && topics.length === 0;

  return (
    <DashboardLayout sidebarItems={sidebarItems} user={auth}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grammatik</h1>
          <p className="mt-1 text-gray-500">{t.grammar_subtitle}</p>
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
            <p className="mt-4 text-gray-500 font-medium">{t.empty_topics}</p>
            <p className="text-sm text-gray-400 mt-1">{t.empty_topics_hint}</p>
          </div>
        )}

        {/* Topics grid */}
        {!dataLoading && topics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => {
              const title = locale === "ar" ? topic.title_ar : topic.title_fr;
              const description =
                locale === "ar" ? topic.description_ar : topic.description_fr;
              const cefrClass = topic.cefr_level
                ? (cefrColors[topic.cefr_level] ?? "bg-gray-100 text-gray-600")
                : "bg-gray-100 text-gray-600";

              return (
                <div
                  key={topic.id}
                  className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-3 cursor-default hover:shadow-md transition-shadow"
                  title={t.grammar_topic_coming_soon}
                >
                  {/* CEFR badge */}
                  <div className="flex items-center justify-between">
                    {topic.cefr_level && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cefrClass}`}>
                        {topic.cefr_level}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {topic.exerciseCount} {t.exercises_count_label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 leading-snug">{title}</h3>

                  {/* Description */}
                  {description && (
                    <p className="text-sm text-gray-500 line-clamp-3">{description}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
