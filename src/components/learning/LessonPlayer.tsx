import React, { useState, useEffect, useCallback } from "react";
import { Confetti } from "./Confetti";

// Dynamic imports for exercise components
import DragDropExercise from "./exercises/DragDropExercise";
import QcmExercise from "./exercises/QcmExercise";
import ClickPasteExercise from "./exercises/ClickPasteExercise";
import FillGapsExercise from "./exercises/FillGapsExercise";
import CategorizeExercise from "./exercises/CategorizeExercise";
import MatchArrowsExercise from "./exercises/MatchArrowsExercise";
import HangmanExercise from "./exercises/HangmanExercise";
import MatchPictureExercise from "./exercises/MatchPictureExercise";
import MemoryExercise from "./exercises/MemoryExercise";
import FlashcardExercise from "./exercises/FlashcardExercise";
import SentenceBuilderExercise from "./exercises/SentenceBuilderExercise";
import SpeedQuizExercise from "./exercises/SpeedQuizExercise";
import WordSearchExercise from "./exercises/WordSearchExercise";
import CrosswordExercise from "./exercises/CrosswordExercise";
import SpellingBeeExercise from "./exercises/SpellingBeeExercise";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonBlock {
  id: string;
  type: string;
  title_fr: string;
  content: any;
  points: number;
  order_index: number;
}

interface LessonPlayerProps {
  lessonTitle: string;
  blocks: LessonBlock[];
  onComplete: (results: { totalStars: number; totalXp: number; scores: Record<string, number> }) => void;
  onExit: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT = { fontFamily: "Times New Roman, Times, serif", fontSize: "12px" } as const;
const VIOLET = "#6C4CE0";
const CORAL = "#FF5A5F";
const GOLD = "#FFB200";
const TEAL = "#0FB6A3";
const GRAY = "#94a3b8";
const MEDIA_TYPES = ["image", "video", "youtube", "audio", "pdf"];
const MOTIVATIONAL = ["Gut gemacht!", "Weiter so!", "Sehr gut!", "Ausgezeichnet!", "Super!"];

function randomMotivational() {
  return MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];
}

function starsFromScore(score: number): number {
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

function xpFromStars(stars: number): number {
  if (stars === 3) return 25;
  if (stars === 2) return 20;
  return 15;
}

function renderStarIcons(earned: number, total: number = 3) {
  return Array.from({ length: total }, (_, i) => (
    <span
      key={i}
      style={{
        fontSize: "20px",
        display: "inline-block",
        animation: i < earned ? `starPop 0.4s ease ${i * 0.15}s both` : undefined,
      }}
    >
      {i < earned ? "⭐" : "☆"}
    </span>
  ));
}

// ---------------------------------------------------------------------------
// MediaBlock
// ---------------------------------------------------------------------------

function MediaBlock({ block }: { block: LessonBlock }) {
  const { type, content, title_fr } = block;

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "640px",
    margin: "0 auto",
    ...FONT,
  };

  if (type === "youtube") {
    // BlockEditor's YoutubeEditor saves the URL under `content.url`.
    // Also tolerate `videoUrl` / `videoId` for already-normalized content.
    const rawUrl = content?.videoUrl || content?.url || "";
    const videoId =
      content?.videoId ||
      (rawUrl
        ? rawUrl.replace(/.*(?:youtu\.be\/|shorts\/|embed\/|v=)/, "").split(/[&?]/)[0]
        : null);
    return (
      <div style={containerStyle}>
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>{title_fr}</p>
        {videoId ? (
          <iframe
            width="100%"
            height="320"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: "8px", maxWidth: "560px" }}
            title={title_fr}
          />
        ) : (
          <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
            YouTube: {rawUrl || "URL manquante"}
          </div>
        )}
      </div>
    );
  }

  if (type === "image") {
    const url = content?.images?.[0]?.url || content?.url;
    return (
      <div style={containerStyle}>
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>{title_fr}</p>
        {url ? (
          <img
            src={url}
            alt={title_fr}
            style={{ maxWidth: "100%", borderRadius: "8px", maxHeight: "400px", objectFit: "contain" }}
          />
        ) : (
          <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
            [Image non disponible]
          </div>
        )}
      </div>
    );
  }

  if (type === "audio") {
    const url = content?.audioUrl || content?.url;
    return (
      <div style={containerStyle}>
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>{title_fr}</p>
        {url ? (
          <audio controls src={url} style={{ width: "100%", maxWidth: "480px" }} />
        ) : (
          <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
            [Audio non disponible]
          </div>
        )}
      </div>
    );
  }

  if (type === "pdf") {
    const url = content?.pdfUrl || content?.url;
    return (
      <div style={containerStyle}>
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>{title_fr}</p>
        {url ? (
          <iframe
            src={url}
            width="100%"
            height="400"
            style={{ border: "none", borderRadius: "8px" }}
            title={title_fr}
          />
        ) : (
          <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
            [PDF non disponible]
          </div>
        )}
      </div>
    );
  }

  // Generic video
  if (type === "video") {
    const url = content?.videoUrl || content?.url;
    return (
      <div style={containerStyle}>
        <p style={{ fontWeight: "bold", marginBottom: "8px" }}>{title_fr}</p>
        {url ? (
          <video controls src={url} style={{ maxWidth: "100%", borderRadius: "8px", maxHeight: "360px" }} />
        ) : (
          <div style={{ padding: "16px", background: "#f1f5f9", borderRadius: "8px" }}>
            [Vidéo non disponible]
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// ExerciseBlock — renders the real exercise component based on block type
// Wraps in error boundary to prevent crashes from missing/malformed content
function ExerciseBlock({ block, onComplete }: { block: LessonBlock; onComplete: (score: number) => void }) {
  const c = (block.content && typeof block.content === "object") ? block.content as any : {};
  const inst = c.instruction_fr || c.instruction || block.title_fr || "";

  // Ensure arrays exist — prevent .map() on undefined
  const safe = (arr: any) => (Array.isArray(arr) ? arr : []);

  // ----------------------------------------------------------------------
  // Normalization helpers
  // The admin BlockEditor saves content under one set of field names; the
  // student exercise components expect a different shape. These helpers
  // transform the saved `content` into the props each component expects,
  // tolerating both the editor shape and the already-normalized shape.
  // ----------------------------------------------------------------------

  // Split a comma-separated string (or pass through an existing array).
  const toList = (v: any): string[] => {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === "string") return v.split(",").map((x) => x.trim()).filter(Boolean);
    return [];
  };

  // drag_drop: editor saves { text, distractors } -> component wants { words_correct_order: string[], hint_fr }
  const normDragDrop = (sentences: any[]) =>
    sentences.map((s) => ({
      words_correct_order: Array.isArray(s.words_correct_order)
        ? s.words_correct_order
        : (s.text || s.correct_sentence || "").trim().split(/\s+/).filter(Boolean),
      hint_fr: s.hint_fr ?? s.hint ?? undefined,
      // distractors are stored but not consumed by the current component
    }));

  // click_paste: editor saves { text: "Ich [habe] ..." } -> component wants { text (no brackets), blank_word }
  const normClickPaste = (sentences: any[]) =>
    sentences.map((s) => {
      if (s.blank_word) {
        return { text: s.text || "", blank_word: s.blank_word };
      }
      const raw = s.text || "";
      const match = raw.match(/\[([^\]]*)\]/);
      const blank_word = match ? match[1] : "";
      const text = raw.replace(/\[([^\]]*)\]/, blank_word);
      return { text, blank_word };
    });

  // fill_gaps: editor saves { text, hint } -> component wants { template, hint }
  const normFillGaps = (sentences: any[]) =>
    sentences.map((s) => ({
      template: s.template ?? s.text ?? "",
      hint: s.hint ?? s.hint_fr ?? undefined,
    }));

  // qcm: editor saves { text, options: string[], correct: idx } ->
  // component wants { question_fr, options: [{ text, is_correct }], explanation_fr }
  const normQcm = (questions: any[]) =>
    questions.map((q) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      const alreadyShaped =
        opts.length > 0 && typeof opts[0] === "object" && opts[0] !== null && "text" in opts[0];
      return {
        question_fr: q.question_fr ?? q.text ?? "",
        question_de: q.question_de ?? undefined,
        explanation_fr: q.explanation_fr ?? undefined,
        options: alreadyShaped
          ? opts
          : opts.map((opt: string, i: number) => ({
              text: opt,
              is_correct: i === (typeof q.correct === "number" ? q.correct : -1),
            })),
      };
    });

  // qcm timer: editor saves `timer` / `timerSeconds`; component wants `timer_seconds`
  const qcmTimer =
    c.timer_seconds ?? (c.timer ? (typeof c.timer === "number" ? c.timer : c.timerSeconds) : undefined);

  // speed_quiz: editor saves { text, correct, wrong: [] } ->
  // component wants { question, correct_answer, wrong_answers: [] }
  const normSpeedQuiz = (questions: any[]) =>
    questions.map((q) => ({
      question: q.question ?? q.text ?? "",
      correct_answer: q.correct_answer ?? q.correct ?? "",
      wrong_answers: Array.isArray(q.wrong_answers)
        ? q.wrong_answers
        : toList(q.wrong),
    }));

  // word_search: editor saves words as [{ word }] and `gridSize`; component wants string[] and `grid_size`
  const normWords = (words: any[]) =>
    words
      .map((w) => (typeof w === "string" ? w : w?.word ?? ""))
      .filter((w) => w && String(w).trim().length > 0);

  // spelling_bee: editor saves { word, hint, audioUrl } -> component wants { word, hint_fr, audio_url }
  const normSpellingBee = (words: any[]) =>
    words.map((w) => ({
      word: w.word ?? "",
      hint_fr: w.hint_fr ?? w.hint ?? undefined,
      audio_url: w.audio_url ?? w.audioUrl ?? undefined,
    }));

  // memory: editor saves { front, back } -> component wants { card_a, card_b }
  const normMemory = (pairs: any[]) =>
    pairs.map((p) => ({
      card_a: p.card_a ?? p.front ?? "",
      card_b: p.card_b ?? p.back ?? "",
    }));

  // match_picture: editor saves { imageUrl, word } -> component wants { image_url, word }
  const normMatchPicture = (pairs: any[]) =>
    pairs.map((p) => ({
      image_url: p.image_url ?? p.imageUrl ?? "",
      word: p.word ?? "",
    }));

  try {
    switch (block.type) {
      case "drag_drop": {
        const sentences = normDragDrop(safe(c.sentences));
        return sentences.length > 0
          ? <DragDropExercise sentences={sentences} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "qcm": {
        const questions = normQcm(safe(c.questions));
        return questions.length > 0
          ? <QcmExercise questions={questions} instruction_fr={inst} timer_seconds={qcmTimer} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "click_paste": {
        const sentences = normClickPaste(safe(c.sentences));
        return sentences.length > 0
          ? <ClickPasteExercise sentences={sentences} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "fill_gaps": {
        const sentences = normFillGaps(safe(c.sentences));
        return sentences.length > 0
          ? <FillGapsExercise sentences={sentences} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "categorize":
        return safe(c.categories).length > 0
          ? <CategorizeExercise categories={safe(c.categories)} items={safe(c.items)} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      case "match_arrows":
        return safe(c.pairs).length > 0
          ? <MatchArrowsExercise pairs={safe(c.pairs)} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      case "hangman":
        return safe(c.words).length > 0
          ? <HangmanExercise words={safe(c.words)} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      case "match_picture": {
        const pairs = normMatchPicture(safe(c.pairs));
        return pairs.length > 0
          ? <MatchPictureExercise pairs={pairs} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "memory": {
        const pairs = normMemory(safe(c.pairs));
        return pairs.length > 0
          ? <MemoryExercise pairs={pairs} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "flashcard":
        return safe(c.cards).length > 0
          ? <FlashcardExercise cards={safe(c.cards)} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      case "sentence_builder":
        return safe(c.sentences).length > 0
          ? <SentenceBuilderExercise sentences={safe(c.sentences)} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      case "speed_quiz": {
        const questions = normSpeedQuiz(safe(c.questions));
        const spq = c.seconds_per_question ?? c.secondsPerQuestion ?? 10;
        return questions.length > 0
          ? <SpeedQuizExercise questions={questions} seconds_per_question={spq} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "word_search": {
        const words = normWords(safe(c.words));
        const gridSize = c.grid_size ?? c.gridSize ?? 10;
        return words.length > 0
          ? <WordSearchExercise words={words} grid_size={gridSize} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      case "crossword":
        return safe(c.entries).length > 0
          ? <CrosswordExercise entries={safe(c.entries)} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      case "spelling_bee": {
        const beeWords = normSpellingBee(safe(c.words));
        return beeWords.length > 0
          ? <SpellingBeeExercise words={beeWords} instruction_fr={inst} onComplete={onComplete} />
          : <ExercisePlaceholder block={block} onComplete={onComplete} />;
      }
      default:
        return <ExercisePlaceholder block={block} onComplete={onComplete} />;
    }
  } catch (err) {
    console.error("ExerciseBlock render error:", err, block);
    return <ExercisePlaceholder block={block} onComplete={onComplete} />;
  }
}

// ExercisePlaceholder — fallback for unknown types
// ---------------------------------------------------------------------------

function ExercisePlaceholder({
  block,
  onComplete,
}: {
  block: LessonBlock;
  onComplete: (score: number) => void;
}) {
  const [score, setScore] = useState(80);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(score);
  };

  return (
    <div
      style={{
        ...FONT,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "32px 24px",
        maxWidth: "560px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${VIOLET}30`,
        }}
      >
        <div style={{ color: VIOLET, fontWeight: "bold", marginBottom: "6px", fontSize: "11px" }}>
          TYPE D'EXERCICE
        </div>
        <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
          {block.type.replace(/_/g, " ").toUpperCase()}
        </div>
        <div style={{ color: "#475569" }}>{block.title_fr}</div>
      </div>

      <div
        style={{
          background: "#f8fafc",
          borderRadius: "10px",
          padding: "16px",
          border: "1px solid #e2e8f0",
        }}
      >
        <p style={{ marginBottom: "10px", color: "#64748b" }}>
          Les vrais composants d'exercice seront connectés ici. Simulez un score :
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontWeight: "bold" }}>
            Score simulé : <span style={{ color: VIOLET }}>{score}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            disabled={submitted}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ accentColor: VIOLET, cursor: submitted ? "default" : "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: GRAY }}>
            <span>0% (1 ⭐)</span>
            <span>50% (2 ⭐)</span>
            <span>80%+ (3 ⭐)</span>
          </div>
        </label>
      </div>

      <button
        disabled={submitted}
        onClick={handleSubmit}
        style={{
          padding: "12px 24px",
          background: submitted
            ? GRAY
            : `linear-gradient(135deg, ${VIOLET} 0%, ${TEAL} 100%)`,
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: submitted ? "default" : "pointer",
          fontWeight: "bold",
          ...FONT,
          fontSize: "13px",
          transition: "opacity 0.2s",
        }}
      >
        {submitted ? "Soumis ✓" : "Marquer comme complété"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeedbackPanel
// ---------------------------------------------------------------------------

function FeedbackPanel({
  score,
  stars,
  xp,
  correctCount,
  totalCount,
  onDismiss,
}: {
  score: number;
  stars: number;
  xp: number;
  correctCount: number;
  totalCount: number;
  onDismiss: () => void;
}) {
  const motivational = randomMotivational();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          background: "#fff",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          padding: "28px 24px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          ...FONT,
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
          @keyframes starPop {
            0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
            60%  { transform: scale(1.35) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes xpBounce {
            0%, 100% { transform: translateY(0); }
            40%       { transform: translateY(-10px); }
          }
        `}</style>

        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b" }}>
          {motivational}
        </div>

        <div style={{ display: "flex", gap: "6px" }}>{renderStarIcons(stars)}</div>

        <div style={{ color: "#475569", fontSize: "12px" }}>
          {correctCount} / {totalCount} correct{totalCount !== 1 ? "s" : ""}
        </div>

        <div
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: GOLD,
            animation: "xpBounce 0.7s ease 0.4s both",
          }}
        >
          +{xp} XP
        </div>

        <button
          onClick={onDismiss}
          style={{
            marginTop: "8px",
            padding: "12px 40px",
            background: `linear-gradient(135deg, ${VIOLET} 0%, ${TEAL} 100%)`,
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
            ...FONT,
          }}
        >
          Suivant →
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// CompletionScreen
// ---------------------------------------------------------------------------

function CompletionScreen({
  totalStars,
  maxStars,
  totalXp,
  scorePercent,
  onNext,
  onBackToUnit,
}: {
  totalStars: number;
  maxStars: number;
  totalXp: number;
  scorePercent: number;
  onNext: () => void;
  onBackToUnit: () => void;
}) {
  const streak = (() => {
    try {
      return Number(localStorage.getItem("bac_streak") || "1");
    } catch {
      return 1;
    }
  })();

  return (
    <>
      <Confetti />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(160deg, #ede9fe 0%, #dbeafe 50%, #ccfbf1 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          zIndex: 300,
          ...FONT,
          padding: "24px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center" }}>
          🎉 Leçon terminée !
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: "280px",
            maxWidth: "380px",
            width: "100%",
            boxShadow: "0 8px 32px rgba(108,76,224,0.12)",
          }}
        >
          {/* Stars */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>⭐</span>
            <span style={{ flex: 1, fontWeight: "bold" }}>Étoiles totales</span>
            <span style={{ color: VIOLET, fontWeight: "bold" }}>
              {totalStars} / {maxStars}
            </span>
          </div>

          <div
            style={{ height: "1px", background: "#f1f5f9" }}
          />

          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>📊</span>
            <span style={{ flex: 1, fontWeight: "bold" }}>Score</span>
            <span style={{ color: TEAL, fontWeight: "bold" }}>{scorePercent}%</span>
          </div>

          <div style={{ height: "1px", background: "#f1f5f9" }} />

          {/* XP */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>💎</span>
            <span style={{ flex: 1, fontWeight: "bold" }}>XP gagné</span>
            <span style={{ color: GOLD, fontWeight: "bold" }}>+{totalXp} XP</span>
          </div>

          <div style={{ height: "1px", background: "#f1f5f9" }} />

          {/* Streak */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "18px" }}>🔥</span>
            <span style={{ flex: 1, fontWeight: "bold" }}>Streak</span>
            <span style={{ color: CORAL, fontWeight: "bold" }}>{streak} jour{streak !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          style={{
            padding: "14px 48px",
            background: `linear-gradient(135deg, ${VIOLET} 0%, ${TEAL} 100%)`,
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            ...FONT,
            boxShadow: `0 4px 16px ${VIOLET}40`,
          }}
        >
          Leçon suivante →
        </button>

        <button
          onClick={onBackToUnit}
          style={{
            background: "none",
            border: "none",
            color: GRAY,
            cursor: "pointer",
            textDecoration: "underline",
            ...FONT,
          }}
        >
          Retour à l'unité
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// LessonPlayer (main export)
// ---------------------------------------------------------------------------

export function LessonPlayer({ lessonTitle, blocks: rawBlocks, onComplete, onExit }: LessonPlayerProps) {
  // Safety: ensure blocks is always a valid array
  const blocks = Array.isArray(rawBlocks) ? rawBlocks : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [blockScores, setBlockScores] = useState<Record<string, number>>({});
  const [blockStars, setBlockStars] = useState<Record<string, number>>({});
  const [totalXp, setTotalXp] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  const totalBlocks = blocks.length;
  const currentBlock = totalBlocks > 0 ? blocks[currentIndex] : null;

  // Empty lesson — nothing to play
  if (totalBlocks === 0) {
    return (
      <div style={{ ...FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", background: "#fafaf8" }}>
        <span style={{ fontSize: "48px" }}>📭</span>
        <p style={{ fontWeight: "bold", fontSize: "14px" }}>Cette leçon est vide.</p>
        <p style={{ color: GRAY }}>Aucun bloc n'a été ajouté à cette leçon.</p>
        <button onClick={onExit} style={{ ...FONT, background: VIOLET, color: "#fff", border: "none", borderRadius: "12px", padding: "10px 24px", cursor: "pointer", fontWeight: "bold" }}>
          ← Retour
        </button>
      </div>
    );
  }
  const isCurrentCompleted = completedBlocks.has(currentIndex);
  const isLastBlock = currentIndex === totalBlocks - 1;

  // Media auto-complete after 2 seconds
  useEffect(() => {
    if (!currentBlock) return;
    if (MEDIA_TYPES.includes(currentBlock.type) && !completedBlocks.has(currentIndex)) {
      const timer = setTimeout(() => {
        setCompletedBlocks((prev) => new Set([...prev, currentIndex]));
        setTotalXp((prev) => prev + 10);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentBlock?.type]);

  // Exercise completion
  const handleBlockComplete = useCallback(
    (score: number) => {
      if (!currentBlock) return;
      const stars = starsFromScore(score);
      const xp = xpFromStars(stars);
      setBlockScores((prev) => ({ ...prev, [currentBlock.id]: score }));
      setBlockStars((prev) => ({ ...prev, [currentBlock.id]: stars }));
      setTotalXp((prev) => prev + xp);
      setCompletedBlocks((prev) => new Set([...prev, currentIndex]));
      setLastScore(score);
      setShowFeedback(true);
    },
    [currentBlock, currentIndex]
  );

  const dismissFeedback = useCallback(() => {
    setShowFeedback(false);
    if (isLastBlock) {
      setShowCompletion(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLastBlock]);

  const goNext = useCallback(() => {
    if (!isCurrentCompleted) return;
    if (isLastBlock) {
      setShowCompletion(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isCurrentCompleted, isLastBlock]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  }, [currentIndex]);

  const jumpTo = useCallback(
    (idx: number) => {
      if (completedBlocks.has(idx) || idx === currentIndex) setCurrentIndex(idx);
    },
    [completedBlocks, currentIndex]
  );

  // Derived stats for completion screen
  const totalStars = Object.values(blockStars).reduce((a, b) => a + b, 0);
  const maxStars = totalBlocks * 3;
  const allScores = Object.values(blockScores);
  const scorePercent =
    allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 100;

  // Feedback data
  const lastStars = starsFromScore(lastScore);
  const lastXp = xpFromStars(lastStars);
  // crude correct/total from score percentage (assume 10 items)
  const correctCount = Math.round((lastScore / 100) * 10);

  // --- Completion screen ---
  if (showCompletion) {
    return (
      <CompletionScreen
        totalStars={totalStars}
        maxStars={maxStars}
        totalXp={totalXp}
        scorePercent={scorePercent}
        onNext={() =>
          onComplete({
            totalStars,
            totalXp,
            scores: blockScores,
          })
        }
        onBackToUnit={onExit}
      />
    );
  }

  const progressPercent =
    totalBlocks > 0 ? Math.round((completedBlocks.size / totalBlocks) * 100) : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        ...FONT,
        overflowY: "hidden",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* TOP BAR                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          height: "48px",
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "8px",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Back */}
        <button
          onClick={onExit}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: VIOLET,
            fontWeight: "bold",
            ...FONT,
            whiteSpace: "nowrap",
          }}
        >
          ← Retour
        </button>

        {/* Title */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontWeight: "bold",
            ...FONT,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lessonTitle}
        </div>

        {/* Stars + XP */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span style={{ color: GOLD }}>⭐ {totalStars}</span>
          <span
            style={{
              background: `linear-gradient(135deg, ${VIOLET}, ${TEAL})`,
              color: "#fff",
              borderRadius: "20px",
              padding: "2px 8px",
              fontWeight: "bold",
            }}
          >
            +{totalXp} XP
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PROGRESS BAR                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          height: "4px",
          background: "#e2e8f0",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${VIOLET}, ${TEAL})`,
            transition: "width 0.5s ease",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* STEP INDICATORS                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          height: "48px",
          background: "#fff",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "8px",
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
          @keyframes pulseRing {
            0%, 100% { box-shadow: 0 0 0 0 ${VIOLET}60; }
            50%       { box-shadow: 0 0 0 4px ${VIOLET}30; }
          }
          @keyframes starPop {
            0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
            60%  { transform: scale(1.35) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes xpBounce {
            0%, 100% { transform: translateY(0); }
            40%       { transform: translateY(-10px); }
          }
        `}</style>

        {blocks.map((block, idx) => {
          const isDone = completedBlocks.has(idx);
          const isCurrent = idx === currentIndex;
          const isLocked = !isDone && !isCurrent;

          return (
            <button
              key={block.id}
              onClick={() => jumpTo(idx)}
              disabled={isLocked}
              title={block.title_fr}
              style={{
                flexShrink: 0,
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: isDone
                  ? `2px solid ${TEAL}`
                  : isCurrent
                  ? `2px solid ${VIOLET}`
                  : `2px solid ${GRAY}`,
                background: isDone ? TEAL : isCurrent ? "#ede9fe" : "#f8fafc",
                color: isDone ? "#fff" : isCurrent ? VIOLET : GRAY,
                cursor: isLocked ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                animation: isCurrent ? "pulseRing 2s infinite" : undefined,
                transition: "background 0.3s, border-color 0.3s",
                ...FONT,
              }}
            >
              {isDone ? "✓" : isLocked ? "🔒" : idx + 1}
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "24px 16px 16px",
        }}
      >
        {currentBlock ? (
          MEDIA_TYPES.includes(currentBlock.type) ? (
            <MediaBlock block={currentBlock} />
          ) : (
            <ExerciseBlock block={currentBlock} onComplete={handleBlockComplete} />
          )
        ) : (
          <div style={{ color: GRAY, marginTop: "32px" }}>Aucun bloc disponible.</div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM NAV BAR                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          height: "56px",
          background: "#fff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "8px",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Précédent */}
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            padding: "8px 14px",
            background: currentIndex === 0 ? "#f1f5f9" : "#fff",
            color: currentIndex === 0 ? GRAY : VIOLET,
            border: `1px solid ${currentIndex === 0 ? "#e2e8f0" : VIOLET}`,
            borderRadius: "8px",
            cursor: currentIndex === 0 ? "default" : "pointer",
            fontWeight: "bold",
            ...FONT,
            opacity: currentIndex === 0 ? 0.5 : 1,
          }}
        >
          ← Précédent
        </button>

        {/* Counter */}
        <div style={{ flex: 1, textAlign: "center", color: GRAY }}>
          Bloc {currentIndex + 1} / {totalBlocks}
        </div>

        {/* Suivant / Terminer */}
        <button
          onClick={goNext}
          disabled={!isCurrentCompleted}
          style={{
            padding: "8px 16px",
            background: isCurrentCompleted
              ? `linear-gradient(135deg, ${VIOLET} 0%, ${TEAL} 100%)`
              : "#f1f5f9",
            color: isCurrentCompleted ? "#fff" : GRAY,
            border: "none",
            borderRadius: "8px",
            cursor: isCurrentCompleted ? "pointer" : "default",
            fontWeight: "bold",
            ...FONT,
            opacity: isCurrentCompleted ? 1 : 0.5,
            transition: "all 0.2s",
          }}
        >
          {isLastBlock ? "Terminer ✓" : "Suivant →"}
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FEEDBACK PANEL                                                      */}
      {/* ------------------------------------------------------------------ */}
      {showFeedback && (
        <FeedbackPanel
          score={lastScore}
          stars={lastStars}
          xp={lastXp}
          correctCount={correctCount}
          totalCount={10}
          onDismiss={dismissFeedback}
        />
      )}
    </div>
  );
}

export default LessonPlayer;
