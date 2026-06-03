import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { supabase } from "@/lib/supabase";
import { getEinheitById } from "@/lib/einheiten";
import type { ContentBlock, BlockProgress } from "@/lib/learning-types";
import { isBlockUnlocked, UNLOCK_THRESHOLD } from "@/lib/learning-types";

export const Route = createFileRoute("/dashboard/learn/$section/$unitId")({
  component: LearnPage,
});

// ─── ExerciseRenderer graceful import ────────────────────────────────────────

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

// ─── localStorage helpers ─────────────────────────────────────────────────────

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
    /* ignore */
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
      style={{ animation: "spin 1s linear infinite", width: 28, height: 28, color }}
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

function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDone }: { message: string; type: "success" | "warning"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const bg = type === "success" ? "#22c55e" : "#f59e0b";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: bg,
        color: "#fff",
        borderRadius: 12,
        padding: "12px 20px",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        fontWeight: 700,
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        animation: "slideUp 0.25s ease",
        maxWidth: 300,
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      {message}
    </div>
  );
}

// ─── Horizontal step bar ──────────────────────────────────────────────────────

const MEDIA_TYPES = new Set(["youtube", "image", "audio", "pdf"]);

interface HorizontalStepBarProps {
  blocks: ContentBlock[];
  progresses: BlockProgress[];
  activeBlockId: string | null;
  onBlockClick: (id: string) => void;
  accentColor: string;
}

function HorizontalStepBar({
  blocks,
  progresses,
  activeBlockId,
  onBlockClick,
  accentColor,
}: HorizontalStepBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active step into view
  useEffect(() => {
    if (!scrollRef.current || !activeBlockId) return;
    const el = scrollRef.current.querySelector(`[data-block-id="${activeBlockId}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeBlockId]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        gap: 4,
        overflowX: "auto",
        padding: "4px 4px",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
      aria-label="Étapes du parcours"
    >
      <style>{`.step-bar-scroll::-webkit-scrollbar { display: none; }`}</style>
      {blocks.map((block, index) => {
        const prog = progresses.find((p) => p.block_id === block.id);
        const isMedia = MEDIA_TYPES.has(block.type);
        const unlocked = isBlockUnlocked(index, progresses, blocks);
        const done = isMedia
          ? (prog?.completed ?? false)
          : (prog?.best_score ?? 0) >= UNLOCK_THRESHOLD;
        const isActive = block.id === activeBlockId;
        const isLocked = !unlocked;

        let bg = "#e5e7eb";
        let fg = "#9ca3af";
        if (done) { bg = "#22c55e"; fg = "#fff"; }
        else if (isActive) { bg = accentColor; fg = "#fff"; }
        else if (unlocked) { bg = `${accentColor}22`; fg = accentColor; }

        return (
          <button
            key={block.id}
            data-block-id={block.id}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && onBlockClick(block.id)}
            title={block.title_fr}
            aria-current={isActive ? "step" : undefined}
            aria-disabled={isLocked}
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: bg,
              color: fg,
              border: isActive ? `2px solid ${accentColor}` : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLocked ? "default" : "pointer",
              opacity: isLocked ? 0.45 : 1,
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 11,
              fontWeight: 700,
              transition: "background 0.15s, transform 0.1s",
              outline: "none",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (!isLocked && !isActive) {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            {done ? (
              <CheckIcon size={13} />
            ) : isLocked ? (
              <LockIcon size={11} />
            ) : (
              index + 1
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Unit info ────────────────────────────────────────────────────────────────

interface UnitInfo {
  title: string;
  icon: string;
  color: string;
}

async function fetchUnitInfo(
  section: string,
  unitId: string,
  locale: "fr" | "ar",
): Promise<UnitInfo> {
  if (section === "grammatik") {
    const { data } = await supabase
      .from("grammar_topics")
      .select("title_fr, title_ar, icon, color")
      .eq("id", unitId)
      .single();
    if (data) {
      return {
        title: locale === "ar" ? data.title_ar : data.title_fr,
        icon: data.icon ?? "📖",
        color: data.color ?? "#6C4CE0",
      };
    }
    return { title: "Grammatik", icon: "📖", color: "#6C4CE0" };
  }

  // Wortschatz — look up from einheiten
  const einheit = getEinheitById(unitId);
  if (einheit) {
    return {
      title: `Einheit ${einheit.number}: ${einheit.title_de}`,
      icon: einheit.icon,
      color: einheit.color,
    };
  }
  return { title: "Wortschatz", icon: "📚", color: "#0FB6A3" };
}

async function fetchBlocks(
  section: string,
  unitId: string,
): Promise<ContentBlock[]> {
  if (section === "grammatik") {
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .eq("topic_id", unitId)
      .eq("pillar", "grammatik")
      .eq("is_published", true)
      .order("order_index", { ascending: true });
    return (data ?? []) as ContentBlock[];
  }

  // Wortschatz: find vocab_set by slug = unitId (einheit-XX)
  const { data: setData } = await supabase
    .from("vocab_sets")
    .select("id")
    .eq("slug", unitId)
    .maybeSingle();

  if (!setData?.id) return [];

  const { data } = await supabase
    .from("exercises")
    .select("*")
    .eq("set_id", setData.id)
    .eq("pillar", "wortschatz")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  return (data ?? []) as ContentBlock[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function LearnPage() {
  const { section, unitId } = Route.useParams();
  const navigate = useNavigate();
  const auth = useAuth("student");
  const { locale } = useLocale();

  const [unitInfo, setUnitInfo] = useState<UnitInfo | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [progresses, setProgresses] = useState<BlockProgress[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCompleted, setCurrentCompleted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRtl = locale === "ar";
  const accentColor = unitInfo?.color ?? "#6C4CE0";

  const showToast = useCallback((message: string, type: "success" | "warning" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Load unit info + blocks
  useEffect(() => {
    if (auth.loading || !auth.userId) return;

    let active = true;

    async function load() {
      setLoading(true);

      const [info, fetchedBlocks] = await Promise.all([
        fetchUnitInfo(section, unitId, locale),
        fetchBlocks(section, unitId),
      ]);

      if (!active) return;

      const fetchedProgress = loadAllProgresses(auth.userId!, fetchedBlocks);
      setUnitInfo(info);
      setBlocks(fetchedBlocks);
      setProgresses(fetchedProgress);

      // Auto-select first unlocked incomplete block
      const firstActive = fetchedBlocks.find((b, i) => {
        const prog = fetchedProgress.find((p) => p.block_id === b.id);
        const isMedia = MEDIA_TYPES.has(b.type);
        const done = isMedia ? (prog?.completed ?? false) : (prog?.best_score ?? 0) >= UNLOCK_THRESHOLD;
        const unlocked = isBlockUnlocked(i, fetchedProgress, fetchedBlocks);
        return unlocked && !done;
      });
      const initial = firstActive?.id ?? fetchedBlocks[0]?.id ?? null;
      setActiveBlockId(initial);

      // Check if initial block is already done
      if (initial) {
        const p = fetchedProgress.find((pr) => pr.block_id === initial);
        const b = fetchedBlocks.find((bl) => bl.id === initial);
        if (b && p) {
          const isMedia = MEDIA_TYPES.has(b.type);
          setCurrentCompleted(isMedia ? p.completed : p.best_score >= UNLOCK_THRESHOLD);
        } else {
          setCurrentCompleted(false);
        }
      }

      setLoading(false);
    }

    load();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.userId, section, unitId, locale]);

  // When active block changes, update currentCompleted
  useEffect(() => {
    if (!activeBlockId) { setCurrentCompleted(false); return; }
    const b = blocks.find((bl) => bl.id === activeBlockId);
    const p = progresses.find((pr) => pr.block_id === activeBlockId);
    if (b && p) {
      const isMedia = MEDIA_TYPES.has(b.type);
      setCurrentCompleted(isMedia ? p.completed : p.best_score >= UNLOCK_THRESHOLD);
    } else {
      setCurrentCompleted(false);
    }
  }, [activeBlockId, blocks, progresses]);

  const activeBlockIdx = blocks.findIndex((b) => b.id === activeBlockId);
  const activeBlock = blocks[activeBlockIdx] ?? null;
  const isFirstBlock = activeBlockIdx <= 0;
  const isLastBlock = activeBlockIdx >= blocks.length - 1;
  const nextBlock = blocks[activeBlockIdx + 1] ?? null;
  const prevBlock = blocks[activeBlockIdx - 1] ?? null;

  const activeUnlocked = activeBlockIdx >= 0
    ? isBlockUnlocked(activeBlockIdx, progresses, blocks)
    : false;

  const handleBlockClick = useCallback((blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const unlocked = isBlockUnlocked(idx, progresses, blocks);
    if (!unlocked) {
      showToast(
        locale === "ar"
          ? "أكمل التمرين السابق بنسبة 70% على الأقل لفتح هذا."
          : "Complétez l'exercice précédent avec au moins 70% pour débloquer.",
        "warning",
      );
      return;
    }
    setActiveBlockId(blockId);
  }, [blocks, progresses, locale, showToast]);

  const handleComplete = useCallback((score: number) => {
    if (!activeBlockId || !auth.userId) return;

    const existing = progresses.find((p) => p.block_id === activeBlockId);
    const newProg: BlockProgress = {
      block_id: activeBlockId,
      student_id: auth.userId,
      completed: true,
      score,
      attempts: (existing?.attempts ?? 0) + 1,
      best_score: Math.max(existing?.best_score ?? 0, score),
      completed_at: new Date().toISOString(),
    };

    saveProgress(newProg);

    const updated = [...progresses.filter((p) => p.block_id !== activeBlockId), newProg];
    setProgresses(updated);
    setCurrentCompleted(score >= UNLOCK_THRESHOLD || MEDIA_TYPES.has(activeBlock?.type ?? ""));

    showToast(
      locale === "ar"
        ? `تم إنهاء التمرين! النتيجة: ${score}%`
        : `Exercice terminé ! Score : ${score}%`,
      "success",
    );
  }, [activeBlockId, auth.userId, progresses, locale, activeBlock, showToast]);

  const handleNext = useCallback(() => {
    if (!nextBlock) return;
    const nextIdx = blocks.findIndex((b) => b.id === nextBlock.id);
    const unlocked = isBlockUnlocked(nextIdx, progresses, blocks);
    if (!unlocked) {
      showToast(
        locale === "ar"
          ? "أكمل هذا التمرين أولاً للمضي قدماً."
          : "Complétez cet exercice pour avancer.",
        "warning",
      );
      return;
    }
    setActiveBlockId(nextBlock.id);
  }, [nextBlock, blocks, progresses, locale, showToast]);

  const handlePrev = useCallback(() => {
    if (!prevBlock) return;
    setActiveBlockId(prevBlock.id);
  }, [prevBlock]);

  const handleBack = useCallback(() => {
    const backTo = section === "grammatik" ? "/dashboard/grammatik" : "/dashboard/wortschatz";
    navigate({ to: backTo });
  }, [navigate, section]);

  // Counts
  const completedCount = progresses.filter((p) => {
    const b = blocks.find((bl) => bl.id === p.block_id);
    if (!b) return false;
    const isMedia = MEDIA_TYPES.has(b.type);
    return isMedia ? p.completed : p.best_score >= UNLOCK_THRESHOLD;
  }).length;

  const overallPct = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  // Determine if "Suivant" is enabled
  const canGoNext = nextBlock !== null && (() => {
    const nextIdx = blocks.findIndex((b) => b.id === nextBlock.id);
    return isBlockUnlocked(nextIdx, progresses, blocks);
  })();

  if (auth.loading || loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 12,
          background: "#f9fafb",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
        }}
      >
        <SpinnerIcon color={accentColor} />
        <span style={{ color: "#9ca3af" }}>
          {locale === "ar" ? "جارٍ التحميل…" : "Chargement…"}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#f9fafb",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {/* ── Slim top bar ────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 20px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            padding: "4px 8px",
            borderRadius: 8,
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
            (e.currentTarget as HTMLButtonElement).style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
          }}
        >
          <ArrowLeftIcon size={14} />
          {locale === "ar" ? "رجوع" : "Retour"}
        </button>

        {/* Unit title */}
        {unitInfo && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{unitInfo.icon}</span>
            <span
              style={{
                fontWeight: 700,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 13,
              }}
            >
              {unitInfo.title}
            </span>
          </div>
        )}

        {/* Right side: progress counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Step counter */}
          {blocks.length > 0 && (
            <span
              style={{
                background: `${accentColor}15`,
                color: accentColor,
                borderRadius: 999,
                padding: "2px 10px",
                fontWeight: 700,
              }}
            >
              {activeBlockIdx + 1} / {blocks.length}
            </span>
          )}

          {/* Overall progress bar (compact) */}
          <div
            style={{
              width: 80,
              height: 6,
              background: "#e5e7eb",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallPct}%`,
                background: overallPct >= 100 ? "#22c55e" : accentColor,
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ color: "#6b7280", minWidth: 32, textAlign: "right" }}>{overallPct}%</span>
        </div>
      </header>

      {/* ── Horizontal step bar ─────────────────────────────────────────── */}
      {blocks.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "10px 20px",
          }}
        >
          <HorizontalStepBar
            blocks={blocks}
            progresses={progresses}
            activeBlockId={activeBlockId}
            onBlockClick={handleBlockClick}
            accentColor={accentColor}
          />
        </div>
      )}

      {/* ── Main content area ────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 20px 100px",
          maxWidth: 860,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {blocks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <span style={{ fontSize: 48 }}>📭</span>
            <p style={{ marginTop: 16, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
              {locale === "ar" ? "لا توجد تمارين في هذه الوحدة بعد." : "Aucun exercice disponible dans cette unité."}
            </p>
          </div>
        ) : !activeBlock ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <SpinnerIcon color={accentColor} />
          </div>
        ) : !activeUnlocked ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f3f4f6",
              padding: 48,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 48 }}>🔒</span>
            <p
              style={{
                marginTop: 16,
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              {locale === "ar"
                ? "أكمل التمرين السابق بنسبة 70% على الأقل لفتح هذا."
                : "Complétez l'exercice précédent avec au moins 70% pour débloquer."}
            </p>
            <button
              type="button"
              onClick={handlePrev}
              style={{
                marginTop: 16,
                background: accentColor,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 20px",
                cursor: "pointer",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {locale === "ar" ? "العودة للتمرين السابق" : "Revenir à l'exercice précédent"}
            </button>
          </div>
        ) : ExerciseRenderer ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f3f4f6",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <ExerciseRenderer
              block={activeBlock}
              locale={locale}
              onComplete={handleComplete}
            />
          </div>
        ) : (
          /* Fallback when ExerciseRenderer isn't built yet */
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f3f4f6",
              padding: 40,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 40 }}>⚙️</span>
            <h2
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
                marginTop: 16,
              }}
            >
              {locale === "ar" ? (activeBlock.title_ar ?? activeBlock.title_fr) : activeBlock.title_fr}
            </h2>
            <p style={{ color: "#6b7280", marginTop: 8, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
              {locale === "ar" ? "جارٍ تحميل محرك التمارين…" : "Chargement du moteur d'exercices…"}
            </p>
            <p style={{ color: "#d1d5db", marginTop: 4, fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
              Type: <strong>{activeBlock.type}</strong>
            </p>
            {/* Demo complete button for dev/testing */}
            <button
              type="button"
              onClick={() => handleComplete(100)}
              style={{
                marginTop: 20,
                background: accentColor,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 20px",
                cursor: "pointer",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {locale === "ar" ? "وضع علامة مكتمل (تجريبي)" : "Marquer comme complété (dev)"}
            </button>
          </div>
        )}
      </main>

      {/* ── Bottom navigation bar ────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
        }}
      >
        {/* Prev button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isFirstBlock}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: isFirstBlock ? "#f3f4f6" : "#fff",
            color: isFirstBlock ? "#d1d5db" : "#374151",
            border: `1px solid ${isFirstBlock ? "#e5e7eb" : "#d1d5db"}`,
            borderRadius: 10,
            padding: "8px 16px",
            cursor: isFirstBlock ? "default" : "pointer",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            fontWeight: 600,
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isFirstBlock) {
              (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af";
            }
          }}
          onMouseLeave={(e) => {
            if (!isFirstBlock) {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
            }
          }}
        >
          <ArrowLeftIcon size={14} />
          {locale === "ar" ? "السابق" : "Précédent"}
        </button>

        {/* Center: current block title */}
        {activeBlock && (
          <div
            style={{
              flex: 1,
              textAlign: "center",
              overflow: "hidden",
              padding: "0 12px",
            }}
          >
            <span
              style={{
                color: "#6b7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {locale === "ar" ? (activeBlock.title_ar ?? activeBlock.title_fr) : activeBlock.title_fr}
            </span>
            {currentCompleted && (
              <span
                style={{
                  color: "#22c55e",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  marginTop: 2,
                }}
              >
                <CheckIcon size={12} />
                {locale === "ar" ? "مكتمل" : "Complété"}
              </span>
            )}
          </div>
        )}

        {/* Next button */}
        {isLastBlock ? (
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: overallPct >= 100 ? "#22c55e" : accentColor,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {locale === "ar" ? "إنهاء الوحدة" : "Terminer l'unité"}
            <CheckIcon size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: canGoNext ? accentColor : "#e5e7eb",
              color: canGoNext ? "#fff" : "#9ca3af",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              cursor: canGoNext ? "pointer" : "default",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              fontWeight: 700,
              transition: "background 0.15s, opacity 0.15s",
              opacity: canGoNext ? 1 : 0.7,
            }}
          >
            {locale === "ar" ? "التالي" : "Suivant →"}
            {!isRtl && <ArrowRightIcon size={14} />}
            {isRtl && <ArrowLeftIcon size={14} />}
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
