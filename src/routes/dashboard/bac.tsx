import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EINHEITEN, getEinheitById } from "@/lib/einheiten";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations, type DashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/bac")({
  component: BacPage,
});

// ─── Icons ───────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-brand-coral"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

function PenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m12 19 7-7 3 3-7 7-3-3z" />
      <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="m2 2 7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function GradCapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 inline-block">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AttemptStatus = "in_progress" | "submitted" | "graded";

interface ExamAttempt {
  id: string;
  status: AttemptStatus;
  score: number | null;
  max_score: number | null;
}

interface Exam {
  id: string;
  title_fr: string;
  title_ar: string;
  slug: string;
  cefr_level?: string;
  duration_minutes?: number;
  total_points?: number;
  created_at: string;
  attempt?: ExamAttempt | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AttemptBadge({ attempt, t }: { attempt: ExamAttempt; t: DashboardTranslations }) {
  if (attempt.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700" style={{ fontSize: "11px", fontWeight: 600 }}>
        {t.exam_in_progress}
      </span>
    );
  }
  if (attempt.status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" style={{ fontSize: "11px", fontWeight: 600 }}>
        {t.exam_submitted}
      </span>
    );
  }
  if (attempt.status === "graded") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700" style={{ fontSize: "11px", fontWeight: 600 }}>
        {t.exam_graded}
        {attempt.score !== null && attempt.max_score !== null
          ? ` ${attempt.score}/${attempt.max_score}`
          : ""}
      </span>
    );
  }
  return null;
}

function ExamActionButton({
  attempt,
  examId,
  t,
}: {
  attempt: ExamAttempt | null | undefined;
  examId: string;
  t: DashboardTranslations;
}) {
  const navigate = useNavigate();

  if (!attempt) {
    return (
      <button
        type="button"
        className="mt-auto w-full rounded-xl bg-brand-coral text-white font-semibold py-2 px-4 hover:bg-brand-coral/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2"
        style={{ fontSize: "12px" }}
        onClick={() => navigate({ to: `/dashboard/exam/${examId}` })}
      >
        {t.exam_start}
      </button>
    );
  }
  if (attempt.status === "in_progress") {
    return (
      <button
        type="button"
        className="mt-auto w-full rounded-xl bg-yellow-500 text-white font-semibold py-2 px-4 hover:bg-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        style={{ fontSize: "12px" }}
        onClick={() => navigate({ to: `/dashboard/exam/${examId}` })}
      >
        Continuer
      </button>
    );
  }
  if (attempt.status === "graded") {
    return (
      <button
        type="button"
        className="mt-auto w-full rounded-xl bg-green-600 text-white font-semibold py-2 px-4 hover:bg-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        style={{ fontSize: "12px" }}
        onClick={() => navigate({ to: `/dashboard/exam/${examId}` })}
      >
        {t.exam_results}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled
      className="mt-auto w-full rounded-xl bg-blue-200 text-blue-700 font-semibold py-2 px-4 cursor-not-allowed"
      style={{ fontSize: "12px" }}
    >
      {t.exam_submitted}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function BacPage() {
  const auth = useAuth("student");
  const { locale, setLocale } = useLocale();
  const t = dashboardTranslations[locale];

  // null = unit list view; string = unit detail view (einheit-XX)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // exam counts per slug for unit list view
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  // exams for the selected unit detail view
  const [unitExams, setUnitExams] = useState<Exam[]>([]);
  const [unitExamsLoading, setUnitExamsLoading] = useState(false);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GradCapIcon /> },
  ];

  // Fetch exam counts once on mount
  useEffect(() => {
    async function fetchCounts() {
      setCountsLoading(true);
      const { data, error } = await supabase
        .from("exams")
        .select("slug")
        .eq("is_published", true);

      if (!error && data) {
        const counts: Record<string, number> = {};
        for (const row of data) {
          if (row.slug) {
            counts[row.slug] = (counts[row.slug] ?? 0) + 1;
          }
        }
        setExamCounts(counts);
      }
      setCountsLoading(false);
    }

    if (!auth.loading) {
      fetchCounts();
    }
  }, [auth.loading]);

  // Fetch exams for selected unit
  useEffect(() => {
    if (!selectedUnit || !auth.userId) return;

    async function fetchUnitExams() {
      setUnitExamsLoading(true);

      const { data: examsData, error } = await supabase
        .from("exams")
        .select("id, title_fr, title_ar, slug, cefr_level, duration_minutes, total_points, created_at")
        .eq("slug", selectedUnit)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error || !examsData) {
        setUnitExams([]);
        setUnitExamsLoading(false);
        return;
      }

      // Fetch attempt for each exam
      const examsWithAttempts = await Promise.all(
        examsData.map(async (exam) => {
          const { data: attemptData } = await supabase
            .from("exam_attempts")
            .select("id, status, score, max_score")
            .eq("exam_id", exam.id)
            .eq("student_id", auth.userId)
            .maybeSingle();
          return { ...exam, attempt: attemptData ?? null };
        })
      );

      setUnitExams(examsWithAttempts);
      setUnitExamsLoading(false);
    }

    fetchUnitExams();
  }, [selectedUnit, auth.userId, auth.loading]);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerIcon />
      </div>
    );
  }

  const pageTitle = locale === "ar" ? "Bac — الامتحانات" : "Bac — Examens";
  const pageSubtitle = locale === "ar" ? "اختر وحدة للتدرب على امتحانات البكالوريا" : "Choisissez une unité pour vous entraîner aux examens du Bac";

  return (
    <DashboardLayout
      role="student"
      t={t}
      locale={locale}
      onLocaleChange={setLocale}
      displayName={auth.displayName}
      navItems={sidebarItems}
    >
      <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" }}>

        {/* ── UNIT LIST VIEW ─────────────────────────────────────────────── */}
        {selectedUnit === null && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-bold text-gray-900" style={{ fontSize: "22px" }}>{pageTitle}</h1>
              <p className="mt-1 text-gray-500" style={{ fontSize: "12px" }}>{pageSubtitle}</p>
            </div>

            {/* Loading */}
            {countsLoading && (
              <div className="flex items-center justify-center py-16">
                <SpinnerIcon />
              </div>
            )}

            {/* Units grid */}
            {!countsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EINHEITEN.map((einheit) => {
                  const count = examCounts[einheit.id] ?? 0;
                  const subtitle = locale === "ar" ? einheit.title_ar : einheit.title_fr;
                  const examLabel = locale === "ar"
                    ? `${count} امتحانات متاحة`
                    : `${count} examen${count !== 1 ? "s" : ""} disponible${count !== 1 ? "s" : ""}`;

                  return (
                    <button
                      key={einheit.id}
                      type="button"
                      onClick={() => setSelectedUnit(einheit.id)}
                      className="text-left w-full rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" }}
                    >
                      {/* Left colored border */}
                      <div
                        className="self-stretch w-1 rounded-full shrink-0"
                        style={{ backgroundColor: einheit.color, minWidth: "4px" }}
                      />

                      {/* Icon + badge */}
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <span style={{ fontSize: "28px" }}>{einheit.icon}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-white font-semibold"
                          style={{ backgroundColor: einheit.color, fontSize: "10px" }}
                        >
                          Einheit {einheit.number}
                        </span>
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate" style={{ fontSize: "13px" }}>
                          {einheit.title_de}
                        </div>
                        <div className="text-gray-500 truncate mt-0.5" style={{ fontSize: "12px" }}>
                          {subtitle}
                        </div>
                        <div className="mt-1.5 text-gray-400" style={{ fontSize: "11px" }}>
                          {examLabel}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400 shrink-0">
                        <ArrowRightIcon />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── UNIT DETAIL VIEW ───────────────────────────────────────────── */}
        {selectedUnit !== null && (() => {
          const einheit = getEinheitById(selectedUnit);
          if (!einheit) return null;
          const subtitle = locale === "ar" ? einheit.title_ar : einheit.title_fr;
          const backLabel = locale === "ar" ? "العودة إلى الوحدات" : "Retour aux unités";
          const emptyLabel = locale === "ar"
            ? "لا توجد امتحانات في هذه الوحدة بعد."
            : "Aucun examen disponible dans cette unité.";

          return (
            <div className="space-y-6">
              {/* Back button + unit header */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnit(null);
                    setUnitExams([]);
                  }}
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4"
                  style={{ fontSize: "12px" }}
                >
                  <ArrowLeftIcon />
                  {backLabel}
                </button>

                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "30px" }}>{einheit.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-bold text-gray-900" style={{ fontSize: "20px" }}>
                        Einheit {einheit.number}: {einheit.title_de}
                      </h1>
                      <span
                        className="px-2 py-0.5 rounded-full text-white font-semibold"
                        style={{ backgroundColor: einheit.color, fontSize: "10px" }}
                      >
                        Einheit {einheit.number}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-0.5" style={{ fontSize: "12px" }}>{subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Loading */}
              {unitExamsLoading && (
                <div className="flex items-center justify-center py-16">
                  <SpinnerIcon />
                </div>
              )}

              {/* Empty state */}
              {!unitExamsLoading && unitExams.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span style={{ fontSize: "48px" }}>📄</span>
                  <p className="mt-4 text-gray-500 font-medium" style={{ fontSize: "12px" }}>{emptyLabel}</p>
                </div>
              )}

              {/* Exam cards */}
              {!unitExamsLoading && unitExams.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unitExams.map((exam) => {
                    const title = locale === "ar" ? exam.title_ar : exam.title_fr;
                    return (
                      <div
                        key={exam.id}
                        className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                        style={{ borderLeftWidth: "4px", borderLeftColor: einheit.color }}
                      >
                        {/* Attempt badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {exam.attempt && <AttemptBadge attempt={exam.attempt} t={t} />}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 leading-snug" style={{ fontSize: "13px" }}>
                          {title}
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-gray-500" style={{ fontSize: "12px" }}>
                          {exam.duration_minutes != null && (
                            <span className="flex items-center gap-1">
                              <ClockIcon />
                              {exam.duration_minutes} min
                            </span>
                          )}
                          {exam.total_points != null && (
                            <span className="flex items-center gap-1">
                              <StarIcon />
                              {exam.total_points} pts
                            </span>
                          )}
                        </div>

                        {/* Action */}
                        <ExamActionButton attempt={exam.attempt} examId={exam.id} t={t} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </DashboardLayout>
  );
}
