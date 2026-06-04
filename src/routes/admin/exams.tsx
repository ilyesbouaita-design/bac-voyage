import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EINHEITEN, getEinheitById } from "@/lib/einheiten";

export const Route = createFileRoute("/admin/exams")({
  component: AdminExams,
});

const tmr: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

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

interface Exam {
  id: string;
  title_fr: string;
  slug: string | null;
  is_published: boolean;
  total_points: number;
  duration_minutes: number;
  created_at: string;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[#6C4CE0] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminExams() {
  const { loading } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  // null = folder view, string = einheit id = exam list view
  const [selectedEinheit, setSelectedEinheit] = useState<string | null>(null);

  // Exam counts per einheit (for folder cards)
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  // Exams for the selected einheit
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Load exam counts for all einheiten on mount
  useEffect(() => {
    if (loading) return;
    fetchExamCounts();
  }, [loading]);

  // Load exams when an einheit is selected
  useEffect(() => {
    if (!selectedEinheit) return;
    fetchExamsForEinheit(selectedEinheit);
  }, [selectedEinheit]);

  async function fetchExamCounts() {
    setCountsLoading(true);
    const counts: Record<string, number> = {};
    await Promise.all(
      EINHEITEN.map(async (einheit) => {
        const { count } = await supabase
          .from("exams")
          .select("id", { count: "exact", head: true })
          .eq("slug", einheit.id);
        counts[einheit.id] = count ?? 0;
      })
    );
    setExamCounts(counts);
    setCountsLoading(false);
  }

  async function fetchExamsForEinheit(einheitId: string) {
    setExamsLoading(true);
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("slug", einheitId)
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

  async function deleteExam(examId: string) {
    if (!confirm("Supprimer cet examen ?")) return;
    await supabase.from("exams").delete().eq("id", examId);
    setExams((prev) => prev.filter((e) => e.id !== examId));
    // Update count
    if (selectedEinheit) {
      setExamCounts((prev) => ({
        ...prev,
        [selectedEinheit]: Math.max(0, (prev[selectedEinheit] ?? 1) - 1),
      }));
    }
  }

  if (loading) return <Spinner />;

  // ============ STATE 2: Exam list inside a folder ============
  if (selectedEinheit !== null) {
    const einheit = getEinheitById(selectedEinheit);

    return (
      <DashboardLayout
        t={t}
        locale={locale as any}
        onLocaleChange={() => {}}
        role="admin"
        navItems={navItems(t)}
      >
        <div style={tmr}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedEinheit(null)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                style={tmr}
              >
                <span style={{ fontSize: "14px" }}>&larr;</span>
                <span>Retour aux unit&eacute;s</span>
              </button>
              {einheit && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "18px" }}>{einheit.icon}</span>
                    <span className="font-bold" style={{ fontSize: "13px", ...tmr }}>
                      Einheit {einheit.number}: {einheit.title_de}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: einheit.color + "18",
                        color: einheit.color,
                      }}
                    >
                      {einheit.title_fr}
                    </span>
                  </div>
                </>
              )}
            </div>
            <Link
              to="/admin/bac-builder"
              search={{ einheit: selectedEinheit }}
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl font-bold transition-opacity hover:opacity-90"
              style={{ background: "#6C4CE0", ...tmr }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
              Cr&eacute;er un examen
            </Link>
          </div>

          {/* Exam list */}
          {examsLoading ? (
            <Spinner />
          ) : exams.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border text-muted-foreground"
              style={tmr}
            >
              <span style={{ fontSize: "40px", marginBottom: "12px" }}>
                {einheit?.icon ?? "📄"}
              </span>
              <p className="font-semibold" style={{ fontSize: "13px" }}>
                Aucun examen dans cette unit&eacute;.
              </p>
              <p className="mt-1" style={{ fontSize: "11px" }}>
                Cr&eacute;ez votre premier examen !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-border bg-card shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                  style={{
                    borderLeft: einheit ? `4px solid ${einheit.color}` : undefined,
                  }}
                >
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ fontSize: "13px", ...tmr }}>
                      {exam.title_fr}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-muted-foreground" style={{ fontSize: "11px", ...tmr }}>
                        &#9200; {exam.duration_minutes} min
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: "11px", ...tmr }}>
                        {exam.total_points} pts
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          fontSize: "10px",
                          backgroundColor: exam.is_published ? "#dcfce7" : "#f3f4f6",
                          color: exam.is_published ? "#16a34a" : "#6b7280",
                          ...tmr,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{
                            backgroundColor: exam.is_published ? "#16a34a" : "#9ca3af",
                          }}
                        />
                        {exam.is_published ? "Publié" : "Brouillon"}
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to="/admin/bac-builder"
                      search={{ examId: exam.id }}
                      className="px-3 py-1.5 rounded-xl font-medium transition-colors bg-[#6C4CE0]/10 text-[#6C4CE0] hover:bg-[#6C4CE0]/20"
                      style={tmr}
                    >
                      &#9999;&#65039; Modifier
                    </Link>
                    <button
                      onClick={() => togglePublish(exam)}
                      disabled={toggling === exam.id}
                      className="px-3 py-1.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: exam.is_published ? "#dcfce7" : "#f3f4f6",
                        color: exam.is_published ? "#16a34a" : "#6b7280",
                        ...tmr,
                      }}
                    >
                      {toggling === exam.id
                        ? "..."
                        : exam.is_published
                          ? "D&eacute;publier"
                          : "Publier"}
                    </button>
                    <button
                      onClick={() => deleteExam(exam.id)}
                      className="px-3 py-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      style={tmr}
                      title="Supprimer"
                    >
                      &#128465;
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

  // ============ STATE 1: Folder view (default) ============
  return (
    <DashboardLayout
      t={t}
      locale={locale as any}
      onLocaleChange={() => {}}
      role="admin"
      navItems={navItems(t)}
    >
      <div style={tmr}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-bold" style={{ fontSize: "16px", ...tmr }}>
            Examens Bac
          </h1>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: "11px", ...tmr }}>
            S&eacute;lectionnez une unit&eacute; pour g&eacute;rer ses examens.
          </p>
        </div>

        {/* 2-column grid of Einheit cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EINHEITEN.map((einheit) => (
            <button
              key={einheit.id}
              onClick={() => setSelectedEinheit(einheit.id)}
              className="text-left rounded-2xl border border-border bg-card shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all group"
              style={{
                borderLeft: `4px solid ${einheit.color}`,
                ...tmr,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{einheit.icon}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: einheit.color + "18",
                      color: einheit.color,
                    }}
                  >
                    Einheit {einheit.number}
                  </span>
                </div>
                <p className="font-bold truncate" style={{ fontSize: "13px", ...tmr }}>
                  {einheit.title_de}
                </p>
                <p className="text-muted-foreground truncate" style={{ fontSize: "11px", ...tmr }}>
                  {einheit.title_fr}
                </p>
                <p className="mt-1.5" style={{ fontSize: "11px", color: einheit.color, ...tmr }}>
                  {countsLoading ? (
                    <span className="opacity-50">Chargement...</span>
                  ) : (
                    <span className="font-semibold">
                      {examCounts[einheit.id] ?? 0} examen
                      {(examCounts[einheit.id] ?? 0) !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>

              {/* Arrow */}
              <span
                className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                style={{ fontSize: "16px" }}
              >
                &rarr;
              </span>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
