import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/grammar")({
  component: AdminGrammar,
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
    to: "/admin/grammar",
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
    to: "/admin/vocabulary",
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

interface GrammarTopic {
  id: string;
  title_fr: string;
  cefr_level: string;
  is_published: boolean;
  description_fr?: string;
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

function AdminGrammar() {
  const { loading } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    fetchData();
  }, [loading]);

  async function fetchData() {
    setDataLoading(true);

    const { data: topicsData, error: topicsError } = await supabase
      .from("grammar_topics")
      .select("*")
      .order("order_index", { ascending: true });

    if (!topicsError && topicsData) {
      const fetchedTopics = topicsData as GrammarTopic[];
      setTopics(fetchedTopics);

      // Fetch lesson counts for each topic
      const counts: Record<string, number> = {};
      await Promise.all(
        fetchedTopics.map(async (topic) => {
          const { count } = await supabase
            .from("grammar_lessons")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", topic.id);
          counts[topic.id] = count ?? 0;
        })
      );
      setLessonCounts(counts);
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
              {t.admin_grammar_title ?? "Grammaire"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.admin_grammar_subtitle ?? "Manage grammar topics and lessons."}
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
            {t.admin_grammar_add_topic ?? "Add topic"}
          </button>
        </div>

        {/* Content */}
        {dataLoading ? (
          <Spinner />
        ) : topics.length === 0 ? (
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
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <p className="font-medium">
              {t.admin_grammar_empty ?? "No grammar topics yet."}
            </p>
            <p className="text-sm mt-1">
              {t.admin_grammar_empty_hint ?? "Add your first topic to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
                    {topic.title_fr}
                  </h2>
                  <span
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cefrColor(topic.cefr_level)}`}
                  >
                    {topic.cefr_level}
                  </span>
                </div>

                {/* Description */}
                {topic.description_fr && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {topic.description_fr}
                  </p>
                )}

                {/* Status + Lesson count */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      topic.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        topic.is_published ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {topic.is_published
                      ? (t.admin_grammar_published ?? "Published")
                      : (t.admin_grammar_draft ?? "Draft")}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-violet/10 text-brand-violet">
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    {lessonCounts[topic.id] ?? 0}{" "}
                    {t.admin_grammar_lessons ?? "lessons"}
                  </span>
                </div>

                {/* Order index badge */}
                <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {t.admin_grammar_order ?? "Order"}: #{topic.order_index}
                  </span>
                  <button className="text-brand-violet hover:underline font-medium text-xs">
                    {t.admin_grammar_edit ?? "Edit"}
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
