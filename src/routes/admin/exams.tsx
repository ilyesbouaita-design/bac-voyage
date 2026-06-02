import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/exams")({
  component: AdminExams,
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

interface Exam {
  id: string;
  title_fr: string;
  cefr_level: string;
  is_published: boolean;
  total_points: number;
  duration_minutes: number;
  created_at: string;
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

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "de" ? "de-DE" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminExams() {
  const { loading } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    fetchExams();
  }, [loading]);

  async function fetchExams() {
    setExamsLoading(true);
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setExams(data as Exam[]);
    }
    setExamsLoading(false);
  }

  async function togglePublish(exam: Exam) {
    setToggling(exam.id);
    const { error } = await supabase
      .from("exams")
      .update({ is_published: !exam.is_published })
      .eq("id", exam.id);
    if (!error) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === exam.id ? { ...e, is_published: !e.is_published } : e
        )
      );
    }
    setToggling(null);
  }

  const filtered = exams.filter((e) =>
    e.title_fr.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <DashboardLayout navItems={navItems(t)} role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.admin_exams_title ?? "Gestion des examens"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t.admin_exams_subtitle ?? "Manage and publish your exams."}
            </p>
          </div>
          <Link to="/admin/exam-new" className="inline-flex items-center gap-2 bg-brand-violet text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-violet/90 transition-colors">
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
            {t.admin_exams_create ?? "Create exam"}
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin_exams_search ?? "Search exams…"}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet/30 focus:border-brand-violet"
          />
        </div>

        {/* Content */}
        {examsLoading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
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
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <p className="font-medium">
              {t.admin_exams_empty ?? "No exams found."}
            </p>
            <p className="text-sm mt-1">
              {t.admin_exams_empty_hint ?? "Create your first exam to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
                    {exam.title_fr}
                  </h2>
                  <span
                    className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cefrColor(exam.cefr_level)}`}
                  >
                    {exam.cefr_level}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      exam.is_published
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        exam.is_published ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {exam.is_published
                      ? (t.admin_exams_published ?? "Published")
                      : (t.admin_exams_draft ?? "Draft")}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    {exam.total_points}{" "}
                    {t.admin_exams_points ?? "pts"}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {exam.duration_minutes}{" "}
                    {t.admin_exams_minutes ?? "min"}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(exam.created_at, locale)}
                  </span>
                </div>

                {/* Toggle button */}
                <div className="pt-1 border-t border-gray-100">
                  <button
                    onClick={() => togglePublish(exam)}
                    disabled={toggling === exam.id}
                    className={`w-full py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                      exam.is_published
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-brand-violet/10 text-brand-violet hover:bg-brand-violet/20"
                    }`}
                  >
                    {toggling === exam.id
                      ? "…"
                      : exam.is_published
                        ? (t.admin_exams_unpublish ?? "Unpublish")
                        : (t.admin_exams_publish ?? "Publish")}
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
