import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
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

interface Counts {
  grammar: number | null;
  vocab: number | null;
  exams: number | null;
}

function DashboardIndex() {
  const auth = useAuth("student");
  const { locale } = useLocale();
  const t = dashboardTranslations[locale];

  const [counts, setCounts] = useState<Counts>({ grammar: null, vocab: null, exams: null });
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      setCountsLoading(true);
      const [grammarRes, vocabRes, examsRes] = await Promise.all([
        supabase
          .from("grammar_topics")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
        supabase
          .from("vocab_sets")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
        supabase
          .from("exams")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
      ]);
      setCounts({
        grammar: grammarRes.count ?? 0,
        vocab: vocabRes.count ?? 0,
        exams: examsRes.count ?? 0,
      });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerIcon />
      </div>
    );
  }

  const xp = auth.xp ?? 0;
  const level = auth.level ?? 1;
  const streak = auth.currentStreak ?? 0;
  const xpProgress = xp % 100;
  const streakLabel = locale === "ar" ? `${streak} ${t.streak_unit_ar ?? "يوم"}` : `${streak} ${t.streak_unit_fr ?? "jours"}`;

  const navCards = [
    {
      to: "/dashboard/grammatik",
      icon: <PenToolIcon />,
      title: t.sidebar_grammar,
      description: t.grammar_description,
      count: counts.grammar,
      colorClass: "text-brand-violet",
      bgClass: "bg-brand-violet/10",
    },
    {
      to: "/dashboard/wortschatz",
      icon: <BookOpenIcon />,
      title: t.sidebar_vocabulary,
      description: t.vocab_description,
      count: counts.vocab,
      colorClass: "text-brand-teal",
      bgClass: "bg-brand-teal/10",
    },
    {
      to: "/dashboard/bac",
      icon: <GraduationCapIcon />,
      title: t.sidebar_exams,
      description: t.exams_description,
      count: counts.exams,
      colorClass: "text-brand-coral",
      bgClass: "bg-brand-coral/10",
    },
  ];

  return (
    <DashboardLayout sidebarItems={sidebarItems} user={auth}>
      <div className="space-y-8">
        {/* Welcome heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t.welcome_greeting}{auth.displayName ? `, ${auth.displayName}` : ""}
          </h1>
          <p className="mt-1 text-gray-500">{t.overview_subtitle}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* XP */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-violet">
              {t.stats_xp}
            </span>
            <span className="text-3xl font-bold text-brand-violet">{xp}</span>
            <span className="text-xs text-gray-400">XP</span>
          </div>
          {/* Level */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
              {t.stats_level}
            </span>
            <span className="text-3xl font-bold text-brand-gold">{level}</span>
            <span className="text-xs text-gray-400">{t.stats_level_label}</span>
          </div>
          {/* Streak */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-coral">
              {t.stats_streak}
            </span>
            <span className="text-3xl font-bold text-brand-coral">{streak}</span>
            <span className="text-xs text-gray-400">
              {locale === "ar" ? (t.streak_unit_ar ?? "يوم") : (t.streak_unit_fr ?? "jours")}
            </span>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{t.xp_progress_label}</span>
            <span className="text-sm text-brand-violet font-semibold">{xpProgress}/100 XP</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-violet rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {t.xp_next_level_label} {100 - xpProgress} XP
          </p>
        </div>

        {/* Your Progress section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.your_progress_section}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {navCards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bgClass} ${card.colorClass}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-gray-900 group-hover:${card.colorClass} transition-colors`}>
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
                </div>
                <div className="mt-auto">
                  {countsLoading ? (
                    <span className="text-xs text-gray-400">{t.loading}</span>
                  ) : (
                    <span className={`text-sm font-medium ${card.colorClass}`}>
                      {card.count} {t.items_available}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
