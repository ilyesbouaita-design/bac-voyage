import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { EINHEITEN, type Einheit } from "@/lib/einheiten";
import { LessonPlayer } from "@/components/learning/LessonPlayer";
import { awardXp } from "@/lib/xp-service";

export const Route = createFileRoute("/dashboard/wortschatz")({
  component: WortschatzPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

function SpinnerIcon({ color = "#FFB200" }: { color?: string }) {
  return (
    <svg
      style={{ animation: "spin 1s linear infinite", width: 32, height: 32, color }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

// ─── localStorage lesson completion helpers ───────────────────────────────────

function lessonCompletionKey(studentId: string, lessonId: string): string {
  return `bac-ws-lesson-complete-${studentId}-${lessonId}`;
}

function isLessonCompleted(studentId: string, lessonId: string): boolean {
  try {
    return !!localStorage.getItem(lessonCompletionKey(studentId, lessonId));
  } catch {
    return false;
  }
}

function saveLessonCompletion(
  studentId: string,
  lessonId: string,
  results: { totalStars: number; totalXp: number; scores: Record<string, number> },
): void {
  try {
    localStorage.setItem(
      lessonCompletionKey(studentId, lessonId),
      JSON.stringify({ completedAt: new Date().toISOString(), ...results }),
    );
  } catch {
    /* ignore quota errors */
  }
}

// ─── Anchor topic lookup ──────────────────────────────────────────────────────
// Returns the grammar_topics id for a ws-einheit-XX anchor, or null if not yet created.

async function findWortschatzAnchorId(einheitId: string): Promise<string | null> {
  const slug = `ws-${einheitId}`;
  const { data } = await supabase
    .from("grammar_topics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

// ─── Einheit list view ────────────────────────────────────────────────────────

interface EinheitWithCount {
  einheit: Einheit;
  lessonCount: number;
}

interface EinheitListProps {
  einheiten: EinheitWithCount[];
  loading: boolean;
  locale: "fr" | "ar";
  onSelect: (einheitId: string) => void;
}

function EinheitList({ einheiten, loading, locale, onSelect }: EinheitListProps) {
  const isRtl = locale === "ar";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <SpinnerIcon />
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
      {einheiten.map(({ einheit, lessonCount }) => {
        const subtitle = locale === "ar" ? einheit.title_ar : einheit.title_fr;

        return (
          <button
            key={einheit.id}
            type="button"
            onClick={() => onSelect(einheit.id)}
            style={{
              textAlign: isRtl ? "right" : "left",
              background: "#fff",
              border: "1px solid #f3f4f6",
              borderLeft: isRtl ? "1px solid #f3f4f6" : `4px solid ${einheit.color}`,
              borderRight: isRtl ? `4px solid ${einheit.color}` : "1px solid #f3f4f6",
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
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: `${einheit.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {einheit.icon}
              </div>
              <span
                style={{
                  background: einheit.color,
                  color: "#fff",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                Einheit {einheit.number}
              </span>
            </div>

            {/* Titles */}
            <div>
              <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>
                {einheit.title_de}
              </div>
              <div style={{ color: "#6b7280", marginTop: 2 }}>
                {subtitle}
              </div>
            </div>

            {/* Lesson count */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280" }}>
              <span>
                {lessonCount}{" "}
                {locale === "ar" ? "درس" : `leçon${lessonCount !== 1 ? "s" : ""}`}
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

// ─── Einheit detail view ──────────────────────────────────────────────────────

interface EinheitDetailProps {
  einheit: Einheit;
  studentId: string;
  locale: "fr" | "ar";
  onBack: () => void;
  onPlayLesson: (lesson: Lesson) => void;
}

const LESSON_COLORS = ["#6C4CE0", "#0FB6A3", "#FFB200", "#FF5A5F"];

function EinheitDetail({ einheit, studentId, locale, onBack, onPlayLesson }: EinheitDetailProps) {
  const isRtl = locale === "ar";

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      // Find the ws anchor topic
      const topicId = await findWortschatzAnchorId(einheit.id);

      if (!active) return;

      if (!topicId) {
        setLessons([]);
        setLoading(false);
        return;
      }

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("topic_id", topicId)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (!active) return;
      setLessons((lessonsData ?? []) as Lesson[]);
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [einheit.id]);

  const subtitle = locale === "ar" ? einheit.title_ar : einheit.title_fr;

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
          <SpinnerIcon color={einheit.color} />
        </div>
      ) : (
        <>
          {/* Einheit header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: `${einheit.color}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {einheit.icon}
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
                  Einheit {einheit.number}: {einheit.title_de}
                </h1>
                <p style={{
                  color: "#6b7280",
                  margin: "4px 0 0",
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: 12,
                }}>
                  {subtitle}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    background: `${einheit.color}22`,
                    color: einheit.color,
                    borderRadius: 999,
                    padding: "2px 10px",
                    fontWeight: 600,
                    marginTop: 4,
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: 12,
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

function WortschatzPage() {
  const auth = useAuth("student");
  const { locale, setLocale } = useLocale();
  const t = dashboardTranslations[locale];

  const [einheitenWithCounts, setEinheitenWithCounts] = useState<{ einheit: Einheit; lessonCount: number }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [playingLesson, setPlayingLesson] = useState<Lesson | null>(null);

  const sidebarItems = [
    { label: t.sidebar_overview, to: "/dashboard", icon: <HomeIcon /> },
    { label: t.sidebar_grammar, to: "/dashboard/grammatik", icon: <PenToolIcon /> },
    { label: t.sidebar_vocabulary, to: "/dashboard/wortschatz", icon: <BookOpenIcon /> },
    { label: t.sidebar_exams, to: "/dashboard/bac", icon: <GraduationCapIcon /> },
  ];

  // Fetch published lesson counts per einheit
  useEffect(() => {
    if (auth.loading || !auth.userId) return;

    let active = true;

    async function fetchCounts() {
      setDataLoading(true);

      const result = await Promise.all(
        EINHEITEN.map(async (einheit) => {
          const topicId = await findWortschatzAnchorId(einheit.id);

          if (!topicId) {
            return { einheit, lessonCount: 0 };
          }

          const { count } = await supabase
            .from("lessons")
            .select("id", { count: "exact", head: true })
            .eq("topic_id", topicId)
            .eq("is_published", true);

          return { einheit, lessonCount: count ?? 0 };
        }),
      );

      if (!active) return;
      setEinheitenWithCounts(result);
      setDataLoading(false);
    }

    fetchCounts();
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
  const selectedEinheit = selectedUnit ? EINHEITEN.find((e) => e.id === selectedUnit) ?? null : null;

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
        {selectedUnit === null || !selectedEinheit ? (
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
                Wortschatz
              </h1>
              <p style={{ color: "#6b7280", marginTop: 4, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
                {locale === "ar"
                  ? "ثرّ مفرداتك في اللغة الألمانية."
                  : "Enrichissez votre vocabulaire allemand."}
              </p>
            </div>

            <EinheitList
              einheiten={einheitenWithCounts}
              loading={dataLoading}
              locale={locale}
              onSelect={setSelectedUnit}
            />
          </div>
        ) : (
          <EinheitDetail
            einheit={selectedEinheit}
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
