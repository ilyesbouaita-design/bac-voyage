import { useState } from "react";
import {
  ContentBlock,
  BlockProgress,
  isBlockUnlocked,
  UNLOCK_THRESHOLD,
} from "../../lib/learning-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProgressTrackerProps {
  blocks: ContentBlock[];
  progresses: BlockProgress[];
  activeBlockId: string | null;
  onBlockClick: (blockId: string) => void;
  locale: "fr" | "ar";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MEDIA_TYPES = new Set(["youtube", "image", "audio", "pdf"]);

function getMediaIcon(type: string): string {
  switch (type) {
    case "youtube": return "📹";
    case "image":   return "🖼️";
    case "audio":   return "🔊";
    case "pdf":     return "📄";
    default:        return "📁";
  }
}

function getExerciseIcon(type: string): string {
  const icons: Record<string, string> = {
    drag_drop:        "↕️",
    qcm:              "✅",
    click_paste:      "📋",
    categorize:       "📂",
    match_arrows:     "🔗",
    fill_gaps:        "✏️",
    hangman:          "🎯",
    match_picture:    "🖼️",
    memory:           "🃏",
    flashcard:        "📇",
    sentence_builder: "🧩",
    speed_quiz:       "⚡",
    word_search:      "🔍",
    crossword:        "📝",
    spelling_bee:     "🐝",
  };
  return icons[type] ?? "📚";
}

function getBlockTitle(block: ContentBlock, locale: "fr" | "ar"): string {
  if (locale === "ar" && block.title_ar) return block.title_ar;
  return block.title_fr;
}

type BlockStatus = "completed" | "active" | "unlocked" | "locked";

function getBlockStatus(
  block: ContentBlock,
  blockIndex: number,
  progresses: BlockProgress[],
  blocks: ContentBlock[],
  activeBlockId: string | null,
): BlockStatus {
  const prog = progresses.find((p) => p.block_id === block.id);
  const unlocked = isBlockUnlocked(blockIndex, progresses, blocks);

  if (!unlocked) return "locked";

  const isMedia = MEDIA_TYPES.has(block.type);
  const isCompleted = isMedia
    ? (prog?.completed ?? false)
    : (prog?.best_score ?? 0) >= UNLOCK_THRESHOLD;

  if (isCompleted) return "completed";
  if (block.id === activeBlockId) return "active";
  return "unlocked";
}

// ---------------------------------------------------------------------------
// Step circle component
// ---------------------------------------------------------------------------

interface StepCircleProps {
  status: BlockStatus;
  icon: string;
  isMedia: boolean;
}

function StepCircle({ status, icon, isMedia }: StepCircleProps) {
  const base: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 18,
    position: "relative",
    transition: "box-shadow 0.2s",
  };

  if (status === "completed") {
    return (
      <div
        style={{
          ...base,
          background: "#22c55e",
          boxShadow: "0 0 0 3px #dcfce7",
        }}
        aria-label="Terminé"
      >
        <span style={{ fontSize: 18 }}>✓</span>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div
        style={{
          ...base,
          background: "#6C4CE0",
          boxShadow: "0 0 0 4px #ede9fe",
          animation: "pulse-ring 1.8s ease-in-out infinite",
        }}
        aria-label="En cours"
      >
        <span>{icon}</span>
        <style>{`
          @keyframes pulse-ring {
            0%   { box-shadow: 0 0 0 3px rgba(108,76,224,0.5); }
            50%  { box-shadow: 0 0 0 8px rgba(108,76,224,0.15); }
            100% { box-shadow: 0 0 0 3px rgba(108,76,224,0.5); }
          }
        `}</style>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div
        style={{
          ...base,
          background: "#e5e7eb",
          color: "#9ca3af",
        }}
        aria-label="Verrouillé"
      >
        <span style={{ fontSize: 16 }}>🔒</span>
      </div>
    );
  }

  // unlocked
  return (
    <div
      style={{
        ...base,
        background: isMedia ? "#f0fdf4" : "#ede9fe",
        border: `2px solid ${isMedia ? "#86efac" : "#c4b5fd"}`,
        color: isMedia ? "#16a34a" : "#6C4CE0",
      }}
      aria-label="Disponible"
    >
      <span>{icon}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score badge
// ---------------------------------------------------------------------------

function ScoreBadge({ score, isMedia }: { score: number | null; isMedia: boolean }) {
  if (score === null) return null;

  const color = isMedia
    ? "#16a34a"
    : score >= 80 ? "#22c55e"
    : score >= UNLOCK_THRESHOLD ? "#f59e0b"
    : "#ef4444";

  return (
    <span
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        color,
        fontWeight: 700,
        background: `${color}18`,
        borderRadius: 4,
        padding: "1px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {isMedia ? "✓ Vu" : `${score}%`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Connector line
// ---------------------------------------------------------------------------

function ConnectorLine({ completed }: { completed: boolean }) {
  return (
    <div
      style={{
        width: 2,
        height: 24,
        background: completed ? "#22c55e" : "#e5e7eb",
        marginLeft: 19,
        flexShrink: 0,
        transition: "background 0.3s",
      }}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Single step row
// ---------------------------------------------------------------------------

interface StepRowProps {
  block: ContentBlock;
  blockIndex: number;
  status: BlockStatus;
  progress: BlockProgress | undefined;
  isLast: boolean;
  isActive: boolean;
  locale: "fr" | "ar";
  onClick: () => void;
}

function StepRow({
  block,
  blockIndex,
  status,
  progress,
  isLast,
  isActive,
  locale,
  onClick,
}: StepRowProps) {
  const isMedia = MEDIA_TYPES.has(block.type);
  const icon = isMedia ? getMediaIcon(block.type) : getExerciseIcon(block.type);
  const title = getBlockTitle(block, locale);
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  const scoreValue: number | null = isMedia
    ? (progress?.completed ? 1 : null)
    : progress?.best_score != null
    ? progress.best_score
    : null;

  const isRtl = locale === "ar";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        role={isLocked ? "presentation" : "button"}
        tabIndex={isLocked ? -1 : 0}
        aria-current={isActive ? "step" : undefined}
        aria-disabled={isLocked}
        onClick={isLocked ? undefined : onClick}
        onKeyDown={(e) => {
          if (!isLocked && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 10px",
          borderRadius: 10,
          cursor: isLocked ? "default" : "pointer",
          background: isActive
            ? "rgba(108,76,224,0.07)"
            : "transparent",
          border: isActive
            ? "1px solid rgba(108,76,224,0.25)"
            : "1px solid transparent",
          opacity: isLocked ? 0.5 : 1,
          transition: "background 0.15s, border-color 0.15s",
          flexDirection: isRtl ? "row-reverse" : "row",
          userSelect: "none",
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!isLocked) {
            (e.currentTarget as HTMLDivElement).style.background =
              isActive ? "rgba(108,76,224,0.1)" : "rgba(0,0,0,0.03)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background =
            isActive ? "rgba(108,76,224,0.07)" : "transparent";
        }}
      >
        <StepCircle status={status} icon={icon} isMedia={isMedia} />

        {/* Text content */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: isRtl ? "right" : "left",
          }}
        >
          {/* Step number + type label */}
          <div
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 1,
            }}
          >
            {blockIndex + 1}
            {" · "}
            {isMedia
              ? (locale === "ar" ? "وسائط" : "Média")
              : (locale === "ar" ? "تمرين" : "Exercice")}
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              color: isLocked
                ? "#9ca3af"
                : isActive
                ? "#6C4CE0"
                : "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>

          {/* Points info */}
          {block.points != null && !isMedia && (
            <div
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                color: "#6b7280",
                marginTop: 1,
              }}
            >
              {block.points} {locale === "ar" ? "نقطة" : "pts"}
            </div>
          )}
        </div>

        {/* Score badge */}
        <div style={{ flexShrink: 0 }}>
          {isCompleted && (
            <ScoreBadge
              score={isMedia ? 1 : (progress?.best_score ?? 0)}
              isMedia={isMedia}
            />
          )}
        </div>
      </div>

      {/* Connector line (not after last item) */}
      {!isLast && (
        <ConnectorLine completed={isCompleted} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

function SummaryBar({
  blocks,
  progresses,
  locale,
}: {
  blocks: ContentBlock[];
  progresses: BlockProgress[];
  locale: "fr" | "ar";
}) {
  const exerciseBlocks = blocks.filter((b) => !MEDIA_TYPES.has(b.type));
  const completedExercises = exerciseBlocks.filter((b) => {
    const prog = progresses.find((p) => p.block_id === b.id);
    return (prog?.best_score ?? 0) >= UNLOCK_THRESHOLD;
  });

  const mediaBlocks = blocks.filter((b) => MEDIA_TYPES.has(b.type));
  const viewedMedia = mediaBlocks.filter((b) => {
    const prog = progresses.find((p) => p.block_id === b.id);
    return prog?.completed ?? false;
  });

  const overallPct =
    blocks.length === 0
      ? 0
      : Math.round(
          ((completedExercises.length + viewedMedia.length) / blocks.length) * 100,
        );

  const isRtl = locale === "ar";

  return (
    <div
      style={{
        padding: "10px 12px",
        background: "#f9fafb",
        borderRadius: 10,
        marginBottom: 16,
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          color: "#374151",
        }}
      >
        <span>
          {locale === "ar" ? "التقدم العام" : "Progression globale"}
        </span>
        <span style={{ fontWeight: 700, color: "#6C4CE0" }}>
          {overallPct}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
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
            background:
              overallPct === 100
                ? "#22c55e"
                : overallPct >= 50
                ? "#6C4CE0"
                : "#a78bfa",
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 6,
          color: "#6b7280",
        }}
      >
        <span>
          {completedExercises.length}/{exerciseBlocks.length}{" "}
          {locale === "ar" ? "تمرين" : "exercices"}
        </span>
        <span>·</span>
        <span>
          {viewedMedia.length}/{mediaBlocks.length}{" "}
          {locale === "ar" ? "وسائط" : "médias"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ProgressTracker
// ---------------------------------------------------------------------------

export default function ProgressTracker({
  blocks,
  progresses,
  activeBlockId,
  onBlockClick,
  locale,
}: ProgressTrackerProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const isRtl = locale === "ar";

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Desktop — vertical sidebar list                                     */}
      {/* ------------------------------------------------------------------ */}
      <nav
        aria-label={locale === "ar" ? "مسار التعلم" : "Parcours d'apprentissage"}
        style={{
          width: "100%",
          fontFamily: "'Times New Roman', Times, serif",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {/* Summary */}
        <SummaryBar blocks={blocks} progresses={progresses} locale={locale} />

        {/* Section label */}
        <div
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            fontWeight: 700,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
            paddingLeft: isRtl ? 0 : 10,
            paddingRight: isRtl ? 10 : 0,
          }}
        >
          {locale === "ar" ? "الوحدات" : "Étapes"}
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {blocks.map((block, index) => {
            const status = getBlockStatus(
              block,
              index,
              progresses,
              blocks,
              activeBlockId,
            );
            const progress = progresses.find((p) => p.block_id === block.id);

            return (
              <StepRow
                key={block.id}
                block={block}
                blockIndex={index}
                status={status}
                progress={progress}
                isLast={index === blocks.length - 1}
                isActive={block.id === activeBlockId}
                locale={locale}
                onClick={() => onBlockClick(block.id)}
              />
            );
          })}

          {blocks.length === 0 && (
            <div
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                color: "#9ca3af",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              {locale === "ar"
                ? "لا توجد وحدات بعد"
                : "Aucune étape pour le moment."}
            </div>
          )}
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile — horizontal scrollable pill strip (shown via media query)   */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="progress-tracker-mobile"
        style={{
          display: "none", // Shown via CSS below
        }}
      >
        <style>{`
          @media (max-width: 640px) {
            .progress-tracker-mobile {
              display: block !important;
            }
            .progress-tracker-desktop {
              display: none !important;
            }
          }
        `}</style>

        {/* Collapsed toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "#f9fafb",
            borderRadius: 10,
            marginBottom: isMobileExpanded ? 8 : 0,
            cursor: "pointer",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            direction: isRtl ? "rtl" : "ltr",
          }}
          onClick={() => setIsMobileExpanded((v) => !v)}
        >
          <span style={{ color: "#374151" }}>
            {locale === "ar" ? "مسار التعلم" : "Parcours d'apprentissage"}
          </span>
          <span style={{ color: "#6C4CE0", fontWeight: 700 }}>
            {isMobileExpanded ? "▲" : "▼"}
          </span>
        </div>

        {isMobileExpanded && (
          <div
            style={{
              overflowX: "auto",
              paddingBottom: 8,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                paddingLeft: 4,
                paddingRight: 4,
                minWidth: "min-content",
              }}
            >
              {blocks.map((block, index) => {
                const status = getBlockStatus(
                  block,
                  index,
                  progresses,
                  blocks,
                  activeBlockId,
                );
                const isMedia = MEDIA_TYPES.has(block.type);
                const icon = isMedia
                  ? getMediaIcon(block.type)
                  : getExerciseIcon(block.type);
                const isLocked = status === "locked";
                const isActive = block.id === activeBlockId;

                const circleColor =
                  status === "completed"
                    ? "#22c55e"
                    : status === "active"
                    ? "#6C4CE0"
                    : status === "locked"
                    ? "#e5e7eb"
                    : "#ede9fe";

                return (
                  <button
                    key={block.id}
                    disabled={isLocked}
                    onClick={() => !isLocked && onBlockClick(block.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      background: isActive ? "rgba(108,76,224,0.08)" : "#fff",
                      border: isActive
                        ? "1.5px solid #6C4CE0"
                        : "1.5px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "8px 10px",
                      cursor: isLocked ? "default" : "pointer",
                      opacity: isLocked ? 0.45 : 1,
                      minWidth: 64,
                    }}
                    aria-current={isActive ? "step" : undefined}
                    aria-disabled={isLocked}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: circleColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      {status === "completed" ? "✓" : status === "locked" ? "🔒" : icon}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Times New Roman', Times, serif",
                        fontSize: 12,
                        color: isLocked ? "#9ca3af" : "#374151",
                        textAlign: "center",
                        maxWidth: 72,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
