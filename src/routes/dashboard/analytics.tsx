import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface XpEvent {
  created_at: string;
  amount: number;
  source: string | null;
  ref_type: string | null;
  ref_id?: string | null;
}

interface ExamAttempt {
  id: string;
  score: number | null;
  max_score: number | null;
  status: string;
  submitted_at: string | null;
  exam_id: string;
  examTitle?: string;
}

interface RecentEvent {
  id?: string;
  created_at: string;
  amount: number;
  source: string | null;
  ref_type: string | null;
  ref_id: string | null;
  description?: string;
}

interface LessonProgress {
  lessonId: string;
  title: string;
  xp: number;
  topic?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SpinnerIcon({ color = "#6C4CE0" }: { color?: string }) {
  return (
    <svg
      style={{ animation: "spin 1s linear infinite", width: 32, height: 32, color }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25} />
      <path fill="currentColor" opacity={0.75} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const W = 600;
  const H = 140;
  const barW = Math.floor(W / data.length) - 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140 }}>
      {data.map((d, i) => {
        const barH = Math.round((d.value / maxVal) * (H - 36));
        const x = i * (W / data.length) + 2;
        const y = H - barH - 24;
        const isHover = hoverIdx === i;
        return (
          <g
            key={i}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 1)}
              fill="#6C4CE0"
              rx={3}
              opacity={isHover ? 1 : 0.85}
            />
            <text
              x={x + barW / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
              fontFamily="'Times New Roman', Times, serif"
            >
              {d.label}
            </text>
            {(d.value > 0 || isHover) && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#6C4CE0"
                fontFamily="'Times New Roman', Times, serif"
                fontWeight={isHover ? 700 : 400}
              >
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const R = 50;
  const CX = 70;
  const CY = 70;
  let cumAngle = -Math.PI / 2;

  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle);
    const y1 = CY + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d =
      seg.value === total
        ? `M ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY} A ${R} ${R} 0 1 1 ${CX - R} ${CY} Z`
        : `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...seg, d, pct: Math.round((seg.value / total) * 100) };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={20} />
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} opacity={0.9} />
        ))}
        <circle cx={CX} cy={CY} r={R - 14} fill="white" />
        <text
          x={CX}
          y={CY - 2}
          textAnchor="middle"
          fontSize={18}
          fontWeight="bold"
          fill="#1a1635"
          fontFamily="'Times New Roman', Times, serif"
        >
          {segments.reduce((s, d) => s + d.value, 0)}
        </text>
        <text
          x={CX}
          y={CY + 12}
          textAnchor="middle"
          fontSize={9}
          fill="#94a3b8"
          fontFamily="'Times New Roman', Times, serif"
        >
          XP total
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {arcs.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                background: a.color,
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 12, color: "#1a1635" }}>
              {a.label}: <strong>{a.value} XP</strong> ({a.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function getLast14Days(): { label: string; iso: string }[] {
  const days: { label: string; iso: string }[] = [];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      label: dayNames[d.getDay()],
      iso: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

// ─── Cards ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: 16,
  marginBottom: 16,
};

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 130,
        background: "white",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        padding: 14,
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1635" }}>{value}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const auth = useAuth("student");
  const { locale, setLocale } = useLocale();
  const t = dashboardTranslations[locale];

  const [dataLoading, setDataLoading] = useState(true);
  const [xpByDay, setXpByDay] = useState<{ label: string; value: number }[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [xpBySource, setXpBySource] = useState<{ label: string; value: number; color: string }[]>([]);
  const [recent, setRecent] = useState<RecentEvent[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [totals, setTotals] = useState({ exams: 0, lessons: 0 });

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
    { label: "Statistiques", to: "/dashboard/analytics", icon: <BarChartIcon /> },
  ];

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    const userId = auth.userId;
    let active = true;

    async function loadAll() {
      setDataLoading(true);

      const sinceIso = new Date(Date.now() - 14 * 86400000).toISOString();

      const [xpEventsRes, attemptsRes, allXpRes, recentRes, lessonEventsRes] = await Promise.all([
        supabase
          .from("xp_events")
          .select("created_at, amount, source, ref_type")
          .eq("student_id", userId)
          .gte("created_at", sinceIso)
          .order("created_at"),
        supabase
          .from("exam_attempts")
          .select("id, score, max_score, status, submitted_at, exam_id")
          .eq("student_id", userId)
          .eq("status", "graded")
          .order("submitted_at", { ascending: false })
          .limit(5),
        supabase
          .from("xp_events")
          .select("amount, source")
          .eq("student_id", userId),
        supabase
          .from("xp_events")
          .select("id, created_at, amount, source, ref_type, ref_id")
          .eq("student_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("xp_events")
          .select("ref_id, amount, created_at")
          .eq("student_id", userId)
          .eq("ref_type", "lesson")
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      // ── XP by day (last 14 days) ──
      const last14 = getLast14Days();
      const buckets: Record<string, number> = {};
      for (const day of last14) buckets[day.iso] = 0;
      const events14 = (xpEventsRes.data ?? []) as XpEvent[];
      for (const e of events14) {
        const key = e.created_at.slice(0, 10);
        if (key in buckets) buckets[key] += e.amount || 0;
      }
      setXpByDay(last14.map((d) => ({ label: d.label, value: buckets[d.iso] })));

      // ── Exam attempts with titles ──
      const attemptRows = (attemptsRes.data ?? []) as ExamAttempt[];
      let attemptsEnriched: ExamAttempt[] = attemptRows;
      const examIds = Array.from(new Set(attemptRows.map((a) => a.exam_id).filter(Boolean)));
      if (examIds.length > 0) {
        const { data: examsData } = await supabase
          .from("exams")
          .select("id, title")
          .in("id", examIds);
        const titleMap = new Map((examsData ?? []).map((e: { id: string; title: string }) => [e.id, e.title]));
        attemptsEnriched = attemptRows.map((a) => ({ ...a, examTitle: titleMap.get(a.exam_id) ?? "Examen" }));
      }
      setAttempts(attemptsEnriched);

      // ── XP by source (donut) ──
      const allXp = (allXpRes.data ?? []) as { amount: number; source: string | null }[];
      let lessonXp = 0;
      let examXp = 0;
      let otherXp = 0;
      for (const e of allXp) {
        if (e.source === "lesson") lessonXp += e.amount || 0;
        else if (e.source === "exam") examXp += e.amount || 0;
        else otherXp += e.amount || 0;
      }
      const segs: { label: string; value: number; color: string }[] = [];
      if (lessonXp > 0) segs.push({ label: "Leçons", value: lessonXp, color: "#6C4CE0" });
      if (examXp > 0) segs.push({ label: "Examens", value: examXp, color: "#FF5A5F" });
      if (otherXp > 0) segs.push({ label: "Autres", value: otherXp, color: "#0FB6A3" });
      setXpBySource(segs);

      // ── Recent activity ──
      const recentRows = (recentRes.data ?? []) as RecentEvent[];
      setRecent(recentRows);

      // ── Totals ──
      const examCount = allXp.filter((e) => e.source === "exam").length;
      const lessonCount = allXp.filter((e) => e.source === "lesson").length;
      setTotals({ exams: examCount, lessons: lessonCount });

      // ── Lesson progress by lesson (grouped by ref_id) ──
      const lessonRows = (lessonEventsRes.data ?? []) as { ref_id: string | null; amount: number; created_at: string }[];
      const lessonXpMap = new Map<string, number>();
      for (const r of lessonRows) {
        if (!r.ref_id) continue;
        lessonXpMap.set(r.ref_id, (lessonXpMap.get(r.ref_id) ?? 0) + (r.amount || 0));
      }
      const lessonIds = Array.from(lessonXpMap.keys());
      let lessonsEnriched: LessonProgress[] = [];
      if (lessonIds.length > 0) {
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id, title_fr, topic_id")
          .in("id", lessonIds);
        const lessonMap = new Map(
          (lessonsData ?? []).map((l: { id: string; title_fr: string; topic_id: string }) => [
            l.id,
            { title: l.title_fr, topic_id: l.topic_id },
          ]),
        );
        lessonsEnriched = lessonIds.map((id) => ({
          lessonId: id,
          title: lessonMap.get(id)?.title ?? "Leçon",
          xp: lessonXpMap.get(id) ?? 0,
        }));
        lessonsEnriched.sort((a, b) => b.xp - a.xp);
      }
      setLessonProgress(lessonsEnriched.slice(0, 8));

      setDataLoading(false);
    }

    loadAll();
    return () => {
      active = false;
    };
  }, [auth.loading, auth.userId]);

  if (auth.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <SpinnerIcon />
      </div>
    );
  }

  const isRtl = locale === "ar";
  const hasAnyData =
    xpByDay.some((d) => d.value > 0) ||
    attempts.length > 0 ||
    xpBySource.length > 0 ||
    recent.length > 0;

  const maxLessonXp = Math.max(...lessonProgress.map((l) => l.xp), 1);

  return (
    <DashboardLayout
      role="student"
      t={t}
      locale={locale}
      onLocaleChange={setLocale}
      displayName={auth.displayName}
      navItems={sidebarItems}
    >
      <div
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          direction: isRtl ? "rtl" : "ltr",
          color: "#1a1635",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            Statistiques
          </h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Votre progression, vos XP et vos résultats.
          </p>
        </div>

        {dataLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <SpinnerIcon />
          </div>
        ) : !hasAnyData ? (
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              padding: 48,
              color: "#6b7280",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1635", marginBottom: 6 }}>
              Aucune donnée pour le moment
            </div>
            <div>Commencez à apprendre pour voir vos statistiques ici !</div>
          </div>
        ) : (
          <>
            {/* 1. Hero stats bar */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <StatCard label="XP total" value={auth.xp} color="#6C4CE0" />
              <StatCard label="Niveau" value={auth.level} color="#FFB200" />
              <StatCard label="Série actuelle" value={`${auth.currentStreak} j`} color="#FF5A5F" />
              <StatCard label="Examens passés" value={totals.exams} color="#0FB6A3" />
              <StatCard label="Leçons terminées" value={totals.lessons} color="#6C4CE0" />
            </div>

            {/* 2. XP over time */}
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1635", margin: 0 }}>
                  XP des 14 derniers jours
                </h2>
                <span style={{ fontSize: 11, color: "#6b7280" }}>
                  Total: {xpByDay.reduce((s, d) => s + d.value, 0)} XP
                </span>
              </div>
              <BarChart data={xpByDay} />
            </div>

            {/* 3 + 4 side by side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 0,
              }}
            >
              {/* 3. Exam performance */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1635", margin: "0 0 12px" }}>
                  Performance aux examens
                </h2>
                {attempts.length === 0 ? (
                  <div style={{ color: "#6b7280", padding: 12 }}>Aucun examen passé</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {attempts.map((a) => {
                      const score = a.score ?? 0;
                      const max = a.max_score ?? 0;
                      const pct = max > 0 ? Math.round((score / max) * 100) : 0;
                      const isPass = pct >= 50;
                      const color = isPass ? "#0FB6A3" : "#FF5A5F";
                      return (
                        <div key={a.id}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#1a1635",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 200,
                              }}
                            >
                              {a.examTitle}
                            </span>
                            <span style={{ fontSize: 11, color, fontWeight: 600 }}>
                              {score}/{max} ({pct}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              background: "#f3f4f6",
                              borderRadius: 4,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: color,
                                borderRadius: 4,
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Activity by section (donut) */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1635", margin: "0 0 12px" }}>
                  Répartition des XP
                </h2>
                {xpBySource.length === 0 ? (
                  <div style={{ color: "#6b7280", padding: 12 }}>Pas encore de XP gagnés</div>
                ) : (
                  <DonutChart segments={xpBySource} />
                )}
              </div>
            </div>

            {/* 5. Recent activity */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1635", margin: "0 0 12px" }}>
                Activité récente
              </h2>
              {recent.length === 0 ? (
                <div style={{ color: "#6b7280", padding: 12 }}>Aucune activité récente</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recent.map((e, i) => {
                    const isLesson = e.ref_type === "lesson" || e.source === "lesson";
                    const icon = isLesson ? "🎓" : "📝";
                    const label = isLesson ? "Leçon terminée" : e.source === "exam" ? "Examen complété" : "Activité";
                    return (
                      <div
                        key={e.id ?? i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: "#fafafa",
                          borderRadius: 6,
                          border: "1px solid #f3f4f6",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1635" }}>{label}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{formatDate(e.created_at)}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#6C4CE0",
                            background: "#f5f3ff",
                            padding: "3px 8px",
                            borderRadius: 4,
                          }}
                        >
                          +{e.amount} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. Lesson completion by unit */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1635", margin: "0 0 12px" }}>
                Progression par leçon (Grammatik)
              </h2>
              {lessonProgress.length === 0 ? (
                <div style={{ color: "#6b7280", padding: 12 }}>
                  Pas encore de leçons terminées. Commencez avec Grammatik !
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {lessonProgress.map((l) => {
                    const pct = Math.round((l.xp / maxLessonXp) * 100);
                    return (
                      <div key={l.lessonId}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1a1635",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "70%",
                            }}
                          >
                            {l.title}
                          </span>
                          <span style={{ fontSize: 11, color: "#6C4CE0", fontWeight: 600 }}>
                            {l.xp} XP
                          </span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: "#f3f4f6",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: "linear-gradient(90deg, #6C4CE0, #FFB200)",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AnalyticsPage;
