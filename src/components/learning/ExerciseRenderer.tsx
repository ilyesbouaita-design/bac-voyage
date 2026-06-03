"use client";

// ---------------------------------------------------------------------------
// ExerciseRenderer
// Maps a ContentBlock to the correct exercise or media component.
// Handles readOnly preview mode and completed-block badge.
// ---------------------------------------------------------------------------

import React, { useEffect } from "react";

import type {
  ContentBlock,
  BlockProgress,
  DragDropContent,
  QcmContent,
  ClickPasteContent,
  CategorizeContent,
  MatchArrowsContent,
  FillGapsContent,
  HangmanContent,
  MatchPictureContent,
  MemoryContent,
  FlashcardContent,
  SentenceBuilderContent,
  SpeedQuizContent,
  WordSearchContent,
  CrosswordContent,
  SpellingBeeContent,
  YoutubeContent,
  ImageContent,
  AudioContent,
  PdfContent,
} from "@/lib/learning-types";

import { BLOCK_TYPES } from "@/lib/learning-types";

// Exercise components
import DragDropExercise from "@/components/learning/exercises/DragDropExercise";
import QcmExercise from "@/components/learning/exercises/QcmExercise";
import ClickPasteExercise from "@/components/learning/exercises/ClickPasteExercise";
import CategorizeExercise from "@/components/learning/exercises/CategorizeExercise";
import MatchArrowsExercise from "@/components/learning/exercises/MatchArrowsExercise";
import FillGapsExercise from "@/components/learning/exercises/FillGapsExercise";
import HangmanExercise from "@/components/learning/exercises/HangmanExercise";
import MatchPictureExercise from "@/components/learning/exercises/MatchPictureExercise";
import MemoryExercise from "@/components/learning/exercises/MemoryExercise";
import FlashcardExercise from "@/components/learning/exercises/FlashcardExercise";
import SentenceBuilderExercise from "@/components/learning/exercises/SentenceBuilderExercise";
import SpeedQuizExercise from "@/components/learning/exercises/SpeedQuizExercise";
import WordSearchExercise from "@/components/learning/exercises/WordSearchExercise";
import CrosswordExercise from "@/components/learning/exercises/CrosswordExercise";
import SpellingBeeExercise from "@/components/learning/exercises/SpellingBeeExercise";

// Media components
import YoutubeEmbed from "@/components/learning/media/YoutubeEmbed";
import ImageGallery from "@/components/learning/media/ImageGallery";
import AudioPlayer from "@/components/learning/media/AudioPlayer";
import PdfViewer from "@/components/learning/media/PdfViewer";

// ---------------------------------------------------------------------------
// Shared style constants
// ---------------------------------------------------------------------------

const BASE: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

const MEDIA_TYPES = new Set(["youtube", "image", "audio", "pdf"]);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExerciseRendererProps {
  block: ContentBlock;
  progress?: BlockProgress;
  onComplete: (score: number) => void; // score 0–100
  locale: "fr" | "ar";
  readOnly?: boolean; // Admin preview mode
}

// ---------------------------------------------------------------------------
// Inner renderer — picks the right component for block.type
// ---------------------------------------------------------------------------

function InnerRenderer({
  block,
  onComplete,
  locale,
}: {
  block: ContentBlock;
  onComplete: (score: number) => void;
  locale: "fr" | "ar";
}) {
  // For media blocks, call onComplete(100) once on mount
  useEffect(() => {
    if (MEDIA_TYPES.has(block.type)) {
      onComplete(100);
    }
    // We intentionally run this only when block.id changes (i.e. a new block),
    // not when onComplete reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  // ---- Exercise blocks ----

  if (block.type === "drag_drop") {
    const c = block.content as DragDropContent;
    return (
      <DragDropExercise
        sentences={c.sentences}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "qcm") {
    const c = block.content as QcmContent;
    return (
      <QcmExercise
        questions={c.questions}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        timer_seconds={c.timer_seconds ?? block.timer_seconds}
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "click_paste") {
    const c = block.content as ClickPasteContent;
    return (
      <ClickPasteExercise
        sentences={c.sentences}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "categorize") {
    const c = block.content as CategorizeContent;
    return (
      <CategorizeExercise
        categories={c.categories}
        items={c.items}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "match_arrows") {
    const c = block.content as MatchArrowsContent;
    return (
      <MatchArrowsExercise
        pairs={c.pairs}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "fill_gaps") {
    const c = block.content as FillGapsContent;
    return (
      <FillGapsExercise
        sentences={c.sentences}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "hangman") {
    const c = block.content as HangmanContent;
    return (
      <HangmanExercise
        words={c.words}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "match_picture") {
    const c = block.content as MatchPictureContent;
    return (
      <MatchPictureExercise
        pairs={c.pairs}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "memory") {
    const c = block.content as MemoryContent;
    return (
      <MemoryExercise
        pairs={c.pairs}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "flashcard") {
    const c = block.content as FlashcardContent;
    return (
      <FlashcardExercise
        cards={c.cards}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "sentence_builder") {
    const c = block.content as SentenceBuilderContent;
    return (
      <SentenceBuilderExercise
        sentences={c.sentences}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "speed_quiz") {
    const c = block.content as SpeedQuizContent;
    return (
      <SpeedQuizExercise
        questions={c.questions}
        seconds_per_question={c.seconds_per_question}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "word_search") {
    const c = block.content as WordSearchContent;
    return (
      <WordSearchExercise
        words={c.words}
        grid_size={c.grid_size}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "crossword") {
    const c = block.content as CrosswordContent;
    return (
      <CrosswordExercise
        entries={c.entries}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  if (block.type === "spelling_bee") {
    const c = block.content as SpellingBeeContent;
    return (
      <SpellingBeeExercise
        words={c.words}
        instruction_fr={
          locale === "ar" && c.instruction_ar
            ? c.instruction_ar
            : c.instruction_fr
        }
        onComplete={onComplete}
      />
    );
  }

  // ---- Media blocks ----

  if (block.type === "youtube") {
    const c = block.content as YoutubeContent;
    return (
      <YoutubeEmbed
        videoUrl={c.video_url}
        title={
          locale === "ar" && c.title_ar
            ? c.title_ar
            : c.title_fr
        }
      />
    );
  }

  if (block.type === "image") {
    const c = block.content as ImageContent;
    // Normalise to the shape ImageGallery expects (caption, not caption_fr/ar)
    const images = c.images.map((img) => ({
      url: img.url,
      caption:
        locale === "ar" && img.caption_ar
          ? img.caption_ar
          : img.caption_fr,
    }));
    return <ImageGallery images={images} />;
  }

  if (block.type === "audio") {
    const c = block.content as AudioContent;
    return (
      <AudioPlayer
        audioUrl={c.audio_url}
        title={
          locale === "ar" && c.title_ar ? c.title_ar : c.title_fr
        }
        transcript={c.transcript_de}
      />
    );
  }

  if (block.type === "pdf") {
    const c = block.content as PdfContent;
    return (
      <PdfViewer
        pdfUrl={c.pdf_url}
        title={
          locale === "ar" && c.title_ar ? c.title_ar : c.title_fr
        }
      />
    );
  }

  // ---- Fallback for unknown types ----
  return (
    <div
      style={{
        ...BASE,
        background: "#FFF8E0",
        border: "1.5px solid #FFB200",
        borderRadius: "12px",
        padding: "20px 24px",
        color: "#7A5800",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span style={{ fontSize: "18px" }}>⚠️</span>
      <span>
        Type d&apos;exercice non reconnu&nbsp;:{" "}
        <strong>{(block as ContentBlock).type}</strong>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ExerciseRenderer (exported)
// ---------------------------------------------------------------------------

export function ExerciseRenderer({
  block,
  progress,
  onComplete,
  locale,
  readOnly = false,
}: ExerciseRendererProps) {
  const isCompleted = progress?.completed === true;
  const score = isCompleted ? (progress?.best_score ?? progress?.score ?? 0) : null;

  // Wrapper for readOnly: pointer-events: none + faded + "Aperçu" badge
  const wrapperStyle: React.CSSProperties = readOnly
    ? { position: "relative", pointerEvents: "none", opacity: 0.7 }
    : { position: "relative" };

  return (
    <div style={wrapperStyle}>
      {/* ReadOnly preview badge */}
      {readOnly && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 10,
            background: "#6C4CE0",
            color: "#fff",
            borderRadius: "6px",
            padding: "2px 10px",
            ...BASE,
            fontWeight: "bold",
            letterSpacing: "0.03em",
            pointerEvents: "none",
          }}
        >
          Aperçu
        </div>
      )}

      {/* Completed badge */}
      {isCompleted && score !== null && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#ECFDF5",
            border: "1.5px solid #0FB6A3",
            borderRadius: "8px",
            padding: "3px 12px",
            marginBottom: "10px",
            ...BASE,
            color: "#0a7060",
            fontWeight: "bold",
          }}
        >
          <span style={{ fontSize: "13px" }}>✅</span>
          <span>
            {locale === "ar" ? "مكتمل" : "Complété"}&nbsp;&mdash;&nbsp;{score}%
          </span>
        </div>
      )}

      {/* The actual exercise or media */}
      <InnerRenderer block={block} onComplete={onComplete} locale={locale} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockHeader (exported)
// Renders: block icon + title (fr or ar) + type badge + score badge if done.
// Used above the exercise in the student view.
// ---------------------------------------------------------------------------

export function BlockHeader({
  block,
  progress,
  locale,
}: {
  block: ContentBlock;
  progress?: BlockProgress;
  locale: "fr" | "ar";
}) {
  const typeInfo = BLOCK_TYPES.find((t) => t.type === block.type);

  const title =
    locale === "ar" && block.title_ar ? block.title_ar : block.title_fr;

  const typeLabelFr = typeInfo?.label_fr ?? block.type;
  const typeLabelAr = typeInfo?.label_ar ?? block.type;
  const typeLabel = locale === "ar" ? typeLabelAr : typeLabelFr;
  const typeColor = typeInfo?.color ?? "#888";
  const icon = typeInfo?.icon ?? "📦";
  const isMedia = typeInfo?.category === "media";

  const isCompleted = progress?.completed === true;
  const bestScore = progress?.best_score ?? progress?.score ?? 0;

  return (
    <div
      style={{
        ...BASE,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        background: "#F9F7FF",
        borderRadius: "10px",
        borderLeft: `4px solid ${typeColor}`,
        marginBottom: "8px",
        flexWrap: "wrap",
      }}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Icon */}
      <span style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</span>

      {/* Title */}
      <span
        style={{
          ...BASE,
          fontWeight: "bold",
          color: "#1a1a1a",
          flex: "1 1 0",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={title}
      >
        {title}
      </span>

      {/* Type badge */}
      <span
        style={{
          ...BASE,
          background: `${typeColor}18`,
          color: typeColor,
          border: `1px solid ${typeColor}55`,
          borderRadius: "6px",
          padding: "1px 8px",
          flexShrink: 0,
          fontWeight: "bold",
          letterSpacing: "0.02em",
        }}
      >
        {typeLabel}
      </span>

      {/* Points badge (only for exercises with defined points) */}
      {!isMedia && block.points !== undefined && block.points > 0 && (
        <span
          style={{
            ...BASE,
            background: "#FFF8E0",
            color: "#7A5800",
            border: "1px solid #FFB20055",
            borderRadius: "6px",
            padding: "1px 8px",
            flexShrink: 0,
          }}
        >
          {block.points}&nbsp;pt{block.points > 1 ? "s" : ""}
        </span>
      )}

      {/* Score badge when completed */}
      {isCompleted && (
        <span
          style={{
            ...BASE,
            background: "#ECFDF5",
            color: "#0a7060",
            border: "1px solid #0FB6A355",
            borderRadius: "6px",
            padding: "1px 8px",
            flexShrink: 0,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "11px" }}>✅</span>
          {isMedia
            ? locale === "ar"
              ? "تمت المشاهدة"
              : "Vu"
            : `${bestScore}%`}
        </span>
      )}
    </div>
  );
}

export default ExerciseRenderer;
