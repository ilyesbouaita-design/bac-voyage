import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

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

function getT(locale: string) {
  return (
    dashboardTranslations[locale as keyof typeof dashboardTranslations] ??
    dashboardTranslations["fr"]
  );
}

interface StatsCard {
  label: string;
  count: number | null;
  colorClass: string;
  bgClass: string;
  icon: React.ReactNode;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-violet border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminOverview() {
  const { loading, displayName } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  const [stats, setStats] = useState<{
    totalStudents: number | null;
    totalExams: number | null;
    publishedExams: number | null;
    totalExercises: number | null;
  }>({
    totalStudents: null,
    totalExams: null,
    publishedExams: null,
    totalExercises: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    async function fetchStats() {
      setStatsLoading(true);
      const [studentsRes, examsRes, publishedRes, exercisesRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true }),
          supabase.from("exams").select("*", { count: "exact", head: true }),
          supabase
            .from("exams")
            .select("*", { count: "exact", head: true })
            .eq("is_published", true),
          supabase
            .from("exercises")
            .select("*", { count: "exact", head: true }),
        ]);

      setStats({
        totalStudents: studentsRes.count ?? 0,
        totalExams: examsRes.count ?? 0,
        publishedExams: publishedRes.count ?? 0,
        totalExercises: exercisesRes.count ?? 0,
      });
      setStatsLoading(false);
    }

    fetchStats();
  }, [loading]);

  if (loading) return <Spinner />;

  const cards: StatsCard[] = [
    {
      label: t.admin_stat_total_students ?? "Total Students",
      count: stats.totalStudents,
      colorClass: "text-brand-violet",
      bgClass: "bg-brand-violet/10",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: t.admin_stat_total_exams ?? "Total Exams",
      count: stats.totalExams,
      colorClass: "text-brand-coral",
      bgClass: "bg-brand-coral/10",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
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
      label: t.admin_stat_published_exams ?? "Published Exams",
      count: stats.publishedExams,
      colorClass: "text-brand-gold",
      bgClass: "bg-brand-gold/10",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: t.admin_stat_total_exercises ?? "Total Exercises",
      count: stats.totalExercises,
      colorClass: "text-brand-teal",
      bgClass: "bg-brand-teal/10",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardLayout navItems={navItems(t)} role="admin">
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.admin_welcome ?? "Welcome back"},{" "}
            <span className="text-brand-violet">{displayName}</span>
          </h1>
          <p className="text-gray-500 mt-1">
            {t.admin_overview_subtitle ??
              "Here is a summary of your platform."}
          </p>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bgClass} ${card.colorClass}`}
                >
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className={`text-3xl font-bold mt-0.5 ${card.colorClass}`}>
                    {card.count ?? "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t.admin_recent_activity ?? "Recent Activity"}
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-40"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-sm">
              {t.admin_recent_activity_placeholder ??
                "Activity feed coming soon."}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
