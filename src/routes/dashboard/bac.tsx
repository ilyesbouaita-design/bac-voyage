import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/bac")({
  component: BacPage,
});

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-brand-coral"
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
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
  cefr_level?: string;
  duration_minutes?: number;
  total_points?: number;
  created_at: string;
  attempt?: ExamAttempt | null;
}

function BacPage() {
  const auth = useAuth("student");
  const { locale } = useLocale();
  const t = dashboardTranslations[locale];

  const [exams, setExams] = useState<Exam[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  useEffect(() => {
    async function fetchExams() {
      if (!auth.userId) return;
      setDataLoading(true);

      const { data: examsData, error } = await supabase
        .from("exams")
        .select("id, title_fr, title_ar, cefr_level, duration_minutes, total_points, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error || !examsData) {
        setExams([]);
        setDataLoading(false);
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

      setExams(examsWithAttempts);
      setDataLoading(false);
    }

    if (!auth.loading) {
      fetchExams();
    }
  }, [auth.loading, auth.userId]);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerIcon />
      </div>
    );
  }

  const isEmpty = !dataLoading && exams.length === 0;

  function AttemptBadge({ attempt }: { attempt: ExamAttempt }) {
    if (attempt.status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
          {t.attempt_in_progress}
        </span>
      );
    }
    if (attempt.status === "submitted") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          {t.attempt_submitted}
        </span>
      );
    }
    if (attempt.status === "graded") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          {t.attempt_graded} {attempt.score !== null && attempt.max_score !== null
            ? `${attempt.score}/${attempt.max_score}`
            : ""}
        </span>
      );
    }
    return null;
  }

  function ExamActionButton({ attempt, examId }: { attempt: ExamAttempt | null | undefined; examId: string }) {
    if (!attempt) {
      return (
        <button
          type="button"
          className="mt-auto w-full rounded-xl bg-brand-coral text-white text-sm font-semibold py-2 px-4 hover:bg-brand-coral/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2"
          onClick={() => {
            // TODO: navigate to exam
            console.log("Start exam", examId);
          }}
        >
          {t.exam_start}
        </button>
      );
    }
    if (attempt.status === "in_progress") {
      return (
        <button
          type="button"
          className="mt-auto w-full rounded-xl bg-yellow-500 text-white text-sm font-semibold py-2 px-4 hover:bg-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
          onClick={() => {
            // TODO: navigate to exam continuation
            console.log("Continue exam", examId);
          }}
        >
          {t.exam_continue}
        </button>
      );
    }
    if (attempt.status === "graded") {
      return (
        <button
          type="button"
          className="mt-auto w-full rounded-xl bg-green-600 text-white text-sm font-semibold py-2 px-4 hover:bg-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          onClick={() => {
            // TODO: navigate to results
            console.log("View results", examId);
          }}
        >
          {t.exam_view_results}
        </button>
      );
    }
    // submitted — read only, no action for now
    return (
      <button
        type="button"
        disabled
        className="mt-auto w-full rounded-xl bg-blue-200 text-blue-700 text-sm font-semibold py-2 px-4 cursor-not-allowed"
      >
        {t.exam_awaiting_grade}
      </button>
    );
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems} user={auth}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bac — Examens</h1>
          <p className="mt-1 text-gray-500">{t.exams_subtitle}</p>
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
            <p className="mt-4 text-gray-500 font-medium">{t.empty_exams}</p>
            <p className="text-sm text-gray-400 mt-1">{t.empty_exams_hint}</p>
          </div>
        )}

        {/* Exams grid */}
        {!dataLoading && exams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const title = locale === "ar" ? exam.title_ar : exam.title_fr;
              const cefrClass = exam.cefr_level
                ? (cefrColors[exam.cefr_level] ?? "bg-gray-100 text-gray-600")
                : "bg-gray-100 text-gray-600";

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {exam.cefr_level && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cefrClass}`}>
                        {exam.cefr_level}
                      </span>
                    )}
                    {exam.attempt && <AttemptBadge attempt={exam.attempt} />}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 leading-snug">{title}</h3>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {exam.duration_minutes != null && (
                      <span className="flex items-center gap-1">
                        <ClockIcon />
                        {exam.duration_minutes} {t.exam_minutes_label}
                      </span>
                    )}
                    {exam.total_points != null && (
                      <span className="flex items-center gap-1">
                        <StarIcon />
                        {exam.total_points} {t.exam_points_label}
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  <ExamActionButton attempt={exam.attempt} examId={exam.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
