import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import ProgressTracker from "@/components/learning/ProgressTracker";
import type { ContentBlock, BlockProgress } from "@/lib/learning-types";
import { isBlockUnlocked, UNLOCK_THRESHOLD } from "@/lib/learning-types";

export const Route = createFileRoute("/dashboard/grammatik")({
  component: GrammatikPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface GrammarTopic {
  id: string;
  title_fr: string;
  title_ar: string;
  description_fr?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  cefr_level?: string;
  order_index?: number;
  is_published?: boolean;
  exerciseCount: number;
  completedCount: number;
}

// ─── localStorage progress helpers ───────────────────────────────────────────

function progressKey(studentId: string, blockId: string): string {
  return `bac-progress-${studentId}-${blockId}`;
}

function loadProgress(studentId: string, blockId: string): BlockProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(studentId, blockId));
    if (!raw) return null;
    return JSON.parse(raw) as BlockProgress;
  } catch {
    return null;
  }
}

function saveProgress(progress: BlockProgress): void {
  try {
    localStorage.setItem(
      progressKey(progress.student_id, progress.block_id),
      JSON.stringify(progress),
    );
  } catch {
    /* ignore quota errors */
  }
}

function loadAllProgresses(studentId: string, blocks: ContentBlock[]): BlockProgress[] {
  return blocks
    .map((b) => loadProgress(studentId, b.id))
    .filter((p): p is BlockProgress => p !== null);
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

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  onDone: () => void;
}

function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#22c55e",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 20px",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        fontWeight: 700,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        animation: "slideUp 0.25s ease",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      {message}
    </div>
  );
}

// ─── ExerciseRenderer placeholder ────────────────────────────────────────────
// The actual ExerciseRenderer is imported dynamically below; we define a
// lightweight async-import wrapper so the route compiles even when the file
// doesn't yet exist.

let ExerciseRenderer: React.ComponentType<{
  block: ContentBlock;
  locale: "fr" | "ar";
  onComplete: (score: number) => void;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExerciseRenderer = require("@/components/learning/ExerciseRenderer").default;
} catch {
  ExerciseRenderer = null;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "#6C4CE0" }: { value: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: value >= 100 ? "#22c55e" : color,
          borderRadius: 999,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ─── Unit List View ───────────────────────────────────────────────────────────

interface UnitListProps {
  topics: GrammarTopic[];
  loading: boolean;
  locale: "fr" | "ar";
  onSelect: (id: string) => void;
}

function UnitList({ topics, loading, locale, onSelect }: UnitListProps) {
  const isRtl = locale === "ar";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <SpinnerIcon />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", textAlign: "center" }}>
        <span style={{ fontSize: 48 }}>📚</span>
        <p style={{ marginTop: 16, color: "#6b7280", fontWeight: 600 }}>
          {locale === "ar" ? "لا توجد مواضيع بعد." : "Aucun thème disponible pour le moment."}
        </p>
        <p style={{ color: "#9ca3af", marginTop: 4 }}>
          {locale === "ar" ? "تحقق لاحقاً." : "Revenez bientôt !"}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {topics.map((topic) => {
        const title = locale === "ar" ? topic.title_ar : topic.title_fr;
        const description = locale === "ar" ? topic.description_ar : topic.description_fr;
        const color = topic.color ?? "#6C4CE0";
        const icon = topic.icon ?? "📖";
        const pct = topic.exerciseCount > 0
          ? Math.round((topic.completedCount / topic.exerciseCount) * 100)
          : 0;
        const allDone = topic.exerciseCount > 0 && topic.completedCount >= topic.exerciseCount && pct >= 70;

        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelect(topic.id)}
            style={{
              textAlign: isRtl ? "right" : "left",
              background: "#fff",
              border: "1px solid #f3f4f6",
              borderLeft: isRtl ? "1px solid #f3f4f6" : `4px solid ${color}`,
              borderRight: isRtl ? `4px solid ${color}` : "1px solid #f3f4f6",
              borderRadius: 16,
              padding: 20,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              transition: "box-shadow 0.2s, transform 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            {/* Top row: icon circle + completed badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: `${color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              {allDone && (
                <span
                  style={{
                    background: "#dcfce7",
                    color: "#16a34a",
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontWeight: 700,
                  }}
                >
                  Complété ✓
                </span>
              )}
            </div>

            {/* Title */}
            <div style={{ fontWeight: 700, color: "#111827", fontSize: 13, lineHeight: 1.3 }}>
              {title}
            </div>

            {/* Description */}
            {description && (
              <div
                style={{
                  color: "#6b7280",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </div>
            )}

            {/* Progress bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <ProgressBar value={pct} color={color} />
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span>
                  {topic.completedCount} / {topic.exerciseCount}{" "}
                  {locale === "ar" ? "تمرين مكتمل" : "exercices complétés"}
                </span>
                <span style={{ color, fontWeight: 700 }}>{pct}%</span>
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", justifyContent: isRtl ? "flex-start" : "flex-end", color: "#9ca3af" }}>
              <ArrowRightIcon />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Unit Detail View ─────────────────────────────────────────────────────────

interface UnitDetailProps {
  topicId: string;
  studentId: string;
  locale: "fr" | "ar";
  onBack: () => void;
}

function UnitDetail({ topicId, studentId, locale, onBack }: UnitDetailProps) {
  const isRtl = locale === "ar";

  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [progresses, setProgresses] = useState<BlockProgress[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load topic + blocks + progress
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [topicRes, blocksRes] = await Promise.all([
        supabase.from("grammar_topics").select("*").eq("id", topicId).single(),
        supabase
          .from("exercises")
          .select("*")
          .eq("topic_id", topicId)
          .eq("pillar", "grammatik")
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
      ]);

      if (!active) return;

      const fetchedBlocks: ContentBlock[] = (blocksRes.data ?? []) as ContentBlock[];
      const fetchedProgress = loadAllProgresses(studentId, fetchedBlocks);

      setTopic(topicRes.data ? {
        ...topicRes.data,
        exerciseCount: fetchedBlocks.length,
        completedCount: fetchedProgress.filter((p) => p.best_score >= UNLOCK_THRESHOLD || p.completed).length,
      } : null);
      setBlocks(fetchedBlocks);
      setProgresses(fetchedProgress);

      // Auto-select first unlocked incomplete block
      const firstActive = fetchedBlocks.find((b, i) => {
        const prog = fetchedProgress.find((p) => p.block_id === b.id);
        const mediaTypes = ["youtube", "image", "audio", "pdf"];
        const isMedia = mediaTypes.includes(b.type);
        const done = isMedia ? (prog?.completed ?? false) : (prog?.best_score ?? 0) >= UNLOCK_THRESHOLD;
        const unlocked = isBlockUnlocked(i, fetchedProgress, fetchedBlocks);
        return unlocked && !done;
      });
      setActiveBlockId(firstActive?.id ?? fetchedBlocks[0]?.id ?? null);

      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [topicId, studentId]);

  const handleBlockClick = useCallback((blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const unlocked = isBlockUnlocked(idx, progresses, blocks);
    if (!unlocked) {
      setToast(
        locale === "ar"
          ? "أكمل التمرين السابق بنسبة 70% على الأقل لفتح هذا."
          : "Complétez l'exercice précédent avec au moins 70% pour débloquer.",
      );
      return;
    }
    setActiveBlockId(blockId);
  }, [blocks, progresses, locale]);

  const handleComplete = useCallback((score: number) => {
    if (!activeBlockId) return;

    const existing = progresses.find((p) => p.block_id === activeBlockId);
    const newProg: BlockProgress = {
      block_id: activeBlockId,
      student_id: studentId,
      completed: true,
      score,
      attempts: (existing?.attempts ?? 0) + 1,
      best_score: Math.max(existing?.best_score ?? 0, score),
      completed_at: new Date().toISOString(),
    };

    saveProgress(newProg);

    setProgresses((prev) => {
      const rest = prev.filter((p) => p.block_id !== activeBlockId);
      return [...rest, newProg];
    });

    const msg = locale === "ar"
      ? `تم إنهاء التمرين! النتيجة: ${score}%`
      : `Exercice terminé ! Score : ${score}%`;
    setToast(msg);

    // Auto-advance to next unlocked block after short delay
    if (score >= UNLOCK_THRESHOLD) {
      const currentIdx = blocks.findIndex((b) => b.id === activeBlockId);
      const nextBlock = blocks[currentIdx + 1];
      if (nextBlock) {
        setTimeout(() => setActiveBlockId(nextBlock.id), 1200);
      }
    }
  }, [activeBlockId, studentId, progresses, blocks, locale]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Keep showToast in scope
  void showToast;

  const activeBlock = blocks.find((b) => b.id === activeBlockId) ?? null;
  const activeBlockIdx = blocks.findIndex((b) => b.id === activeBlockId);
  const activeUnlocked = activeBlockIdx >= 0
    ? isBlockUnlocked(activeBlockIdx, progresses, blocks)
    : false;

  const overallPct = blocks.length === 0 ? 0 : Math.round(
    (progresses.filter((p) => {
      const b = blocks.find((bl) => bl.id === p.block_id);
      if (!b) return false;
      const isMedia = ["youtube", "image", "audio", "pdf"].includes(b.type);
      return isMedia ? p.completed : p.best_score >= UNLOCK_THRESHOLD;
    }).length / blocks.length) * 100,
  );

  const color = topic?.color ?? "#6C4CE0";
  const icon = topic?.icon ?? "📖";
  const title = topic ? (locale === "ar" ? topic.title_ar : topic.title_fr) : "";

  return (
    <div
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#6b7280",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          marginBottom: 20,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#111827"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
      >
        <ArrowLeftIcon />
        {locale === "ar" ? "العودة إلى الوحدات" : "Retour aux unités"}
      </button>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
          <SpinnerIcon color={color} />
        </div>
      ) : (
        <>
          {/* Unit header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: `${color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {icon}
              </div>
              <div>
                <h1
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {title}
                </h1>
                <span
                  style={{
                    display: "inline-block",
                    background: `${color}22`,
                    color,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  Grammatik
                </span>
              </div>
            </div>

            {/* Unit progress bar */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#374151" }}>
                <span>{locale === "ar" ? "تقدم الوحدة" : "Progression de l'unité"}</span>
                <span style={{ fontWeight: 700, color }}>{overallPct}%</span>
              </div>
              <ProgressBar value={overallPct} color={color} />
            </div>
          </div>

          {/* Split layout */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            {/* ProgressTracker sidebar */}
            <div
              style={{
                width: 250,
                flexShrink: 0,
                background: "#fff",
                borderRadius: 16,
                padding: 16,
                border: "1px solid #f3f4f6",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
              className="grammatik-tracker"
            >
              <style>{`
                @media (max-width: 768px) {
                  .grammatik-split { flex-direction: column !important; }
                  .grammatik-tracker { width: 100% !important; }
                }
              `}</style>
              <ProgressTracker
                blocks={blocks}
                progresses={progresses}
                activeBlockId={activeBlockId}
                onBlockClick={handleBlockClick}
                locale={locale}
              />
            </div>

            {/* Exercise area */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #f3f4f6",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              {!activeBlock ? (
                <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                  <span style={{ fontSize: 40 }}>🎯</span>
                  <p style={{ marginTop: 12, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
                    {locale === "ar" ? "اختر تمريناً من القائمة." : "Sélectionnez un exercice dans le parcours."}
                  </p>
                </div>
              ) : !activeUnlocked ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <span style={{ fontSize: 40 }}>🔒</span>
                  <p
                    style={{
                      marginTop: 12,
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {locale === "ar"
                      ? "أكمل التمرين السابق بنسبة 70% على الأقل لفتح هذا."
                      : "Complétez l'exercice précédent avec au moins 70% pour débloquer."}
                  </p>
                </div>
              ) : ExerciseRenderer ? (
                <ExerciseRenderer
                  block={activeBlock}
                  locale={locale}
                  onComplete={handleComplete}
                />
              ) : (
                <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                  <span style={{ fontSize: 40 }}>⚙️</span>
                  <p style={{ marginTop: 12, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
                    {locale === "ar" ? "جاري تحميل التمرين..." : "Chargement de l'exercice…"}
                  </p>
                  <p style={{ marginTop: 8, color: "#d1d5db", fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
                    Type: <strong>{activeBlock.type}</strong> — {locale === "ar" ? activeBlock.title_ar ?? activeBlock.title_fr : activeBlock.title_fr}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function GrammatikPage() {
  const auth = useAuth("student");
  const { locale, setLocale } = useLocale();
  const t = dashboardTranslations[locale];

  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  // Fetch topics + exercise counts + student progress
  useEffect(() => {
    if (auth.loading || !auth.userId) return;

    let active = true;

    async function fetchTopics() {
      setDataLoading(true);

      const { data: topicsData, error } = await supabase
        .from("grammar_topics")
        .select("id, title_fr, title_ar, description_fr, description_ar, icon, color, cefr_level, order_index, is_published")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (!active) return;

      if (error || !topicsData) {
        setTopics([]);
        setDataLoading(false);
        return;
      }

      // For each topic, fetch exercise count
      const enriched = await Promise.all(
        topicsData.map(async (topic) => {
          const { data: blockData } = await supabase
            .from("exercises")
            .select("id")
            .eq("topic_id", topic.id)
            .eq("pillar", "grammatik")
            .eq("is_published", true);

          const allBlocks = (blockData ?? []) as { id: string }[];
          const exerciseCount = allBlocks.length;

          // Load progress from localStorage
          const completedCount = allBlocks.filter((b) => {
            const p = loadProgress(auth.userId!, b.id);
            return p ? (p.best_score >= UNLOCK_THRESHOLD || p.completed) : false;
          }).length;

          return {
            ...topic,
            exerciseCount,
            completedCount,
          } as GrammarTopic;
        }),
      );

      if (!active) return;
      setTopics(enriched);
      setDataLoading(false);
    }

    fetchTopics();
    return () => { active = false; };
  }, [auth.loading, auth.userId]);

  if (auth.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <SpinnerIcon />
      </div>
    );
  }

  const isRtl = locale === "ar";

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
        }}
      >
        {selectedUnit === null ? (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h1
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Grammatik
              </h1>
              <p style={{ color: "#6b7280", marginTop: 4 }}>
                {locale === "ar"
                  ? "تعلّم قواعد اللغة الألمانية خطوة بخطوة."
                  : "Apprenez les règles de grammaire allemande étape par étape."}
              </p>
            </div>

            <UnitList
              topics={topics}
              loading={dataLoading}
              locale={locale}
              onSelect={setSelectedUnit}
            />
          </div>
        ) : (
          <UnitDetail
            topicId={selectedUnit}
            studentId={auth.userId!}
            locale={locale}
            onBack={() => setSelectedUnit(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
