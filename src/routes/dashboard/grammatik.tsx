import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { LessonPlayer } from "@/components/learning/LessonPlayer";
import { awardXp } from "@/lib/xp-service";

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
  lessonCount: number;
}

interface LessonBlock {
  id: string;
  type: string;
  title_fr: string;
  content: Record<string, unknown>;
  points: number;
  order_index: number;
}

interface Lesson {
  id: string;
  topic_id: string;
  title_fr: string;
  title_ar?: string | null;
  body_fr: { blocks: LessonBlock[] } | null;
  order_index: number;
  is_published: boolean;
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

            {/* Lesson count */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280" }}>
              <span>
                {topic.lessonCount}{" "}
                {locale === "ar" ? "درس" : `leçon${topic.lessonCount !== 1 ? "s" : ""}`}
              </span>
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

// ─── Lesson completion localStorage helpers ───────────────────────────────────

function lessonCompletionKey(studentId: string, lessonId: string): string {
  return `bac-lesson-complete-${studentId}-${lessonId}`;
}

function isLessonCompleted(studentId: string, lessonId: string): boolean {
  try {
    return !!localStorage.getItem(lessonCompletionKey(studentId, lessonId));
  } catch {
    return false;
  }
}

function saveLessonCompletion(studentId: string, lessonId: string, results: { totalStars: number; totalXp: number; scores: Record<string, number> }): void {
  try {
    localStorage.setItem(
      lessonCompletionKey(studentId, lessonId),
      JSON.stringify({ completedAt: new Date().toISOString(), ...results }),
    );
  } catch {
    /* ignore quota errors */
  }
}

// ─── Unit Detail View ─────────────────────────────────────────────────────────

interface UnitDetailProps {
  topicId: string;
  studentId: string;
  locale: "fr" | "ar";
  onBack: () => void;
  onPlayLesson: (lesson: Lesson) => void;
}

function UnitDetail({ topicId, studentId, locale, onBack, onPlayLesson }: UnitDetailProps) {
  const isRtl = locale === "ar";

  const [topic, setTopic] = useState<{ id: string; title_fr: string; title_ar: string; icon?: string; color?: string } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [topicRes, lessonsRes] = await Promise.all([
        supabase.from("grammar_topics").select("id, title_fr, title_ar, description_fr, slug").eq("id", topicId).single(),
        supabase
          .from("lessons")
          .select("*")
          .eq("topic_id", topicId)
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
      ]);

      if (!active) return;
      setTopic(topicRes.data ?? null);
      setLessons((lessonsRes.data ?? []) as Lesson[]);
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [topicId]);

  const color = topic?.color ?? "#6C4CE0";
  const icon = topic?.icon ?? "📖";
  const title = topic ? (locale === "ar" ? topic.title_ar : topic.title_fr) : "";

  const LESSON_COLORS = ["#6C4CE0", "#0FB6A3", "#FFB200", "#FF5A5F"];

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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                  {lessons.length} {locale === "ar" ? "درس" : `leçon${lessons.length !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
          </div>

          {/* Lesson cards */}
          {lessons.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", textAlign: "center" }}>
              <span style={{ fontSize: 48 }}>📖</span>
              <p style={{ marginTop: 16, color: "#6b7280", fontWeight: 600, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
                {locale === "ar" ? "لا توجد دروس منشورة بعد." : "Aucune leçon publiée pour le moment."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {lessons.map((lesson, idx) => {
                const lessonColor = LESSON_COLORS[idx % LESSON_COLORS.length];
                const blockCount = lesson.body_fr?.blocks?.length ?? 0;
                const completed = isLessonCompleted(studentId, lesson.id);
                return (
                  <div
                    key={lesson.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #f3f4f6",
                      borderLeft: `4px solid ${lessonColor}`,
                      borderRadius: 12,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      fontFamily: "'Times New Roman', Times, serif",
                      fontSize: 12,
                    }}
                  >
                    {/* Number badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: `${lessonColor}22`,
                        color: lessonColor,
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>

                    {/* Title + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{lesson.title_fr}</div>
                      <div style={{ color: "#6b7280", marginTop: 2 }}>
                        {blockCount} bloc{blockCount !== 1 ? "s" : ""}
                        {completed && (
                          <span
                            style={{
                              marginLeft: 10,
                              background: "#dcfce7",
                              color: "#16a34a",
                              borderRadius: 999,
                              padding: "1px 8px",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            Complété ✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Play button */}
                    <button
                      type="button"
                      onClick={() => onPlayLesson(lesson)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: lessonColor,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 16px",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      ▶ {locale === "ar" ? "تشغيل" : "Jouer"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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
  const [playingLesson, setPlayingLesson] = useState<Lesson | null>(null);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  // Fetch topics + lesson counts
  useEffect(() => {
    if (auth.loading || !auth.userId) return;

    let active = true;

    async function fetchTopics() {
      setDataLoading(true);

      const { data: topicsData, error } = await supabase
        .from("grammar_topics")
        .select("id, title_fr, title_ar, description_fr, description_ar, cefr_level, order_index, is_published, slug")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (!active) return;

      if (error || !topicsData) {
        setTopics([]);
        setDataLoading(false);
        return;
      }

      // Exclude Wortschatz anchor topics (slug starts with "ws-")
      const grammarTopics = topicsData.filter(
        (t: any) => !(t.slug && t.slug.startsWith("ws-"))
      );

      // For each topic, count published lessons
      const enriched = await Promise.all(
        grammarTopics.map(async (topic) => {
          const { count } = await supabase
            .from("lessons")
            .select("id", { count: "exact", head: true })
            .eq("topic_id", topic.id)
            .eq("is_published", true);

          return {
            ...topic,
            lessonCount: count ?? 0,
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

  // If a lesson is being played, render LessonPlayer fullscreen (outside DashboardLayout)
  if (playingLesson) {
    return (
      <LessonPlayer
        lessonTitle={playingLesson.title_fr}
        blocks={playingLesson.body_fr?.blocks ?? []}
        onComplete={async (results) => {
          // Save to localStorage (keep for offline/fast check)
          saveLessonCompletion(auth.userId!, playingLesson.id, results);

          // Persist to Supabase
          await awardXp({
            studentId: auth.userId!,
            amount: results.totalXp,
            source: "lesson",
            refId: playingLesson.id,
          });

          setPlayingLesson(null);
        }}
        onExit={() => setPlayingLesson(null)}
      />
    );
  }

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
            onPlayLesson={setPlayingLesson}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
