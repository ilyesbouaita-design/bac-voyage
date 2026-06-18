import { useState, useCallback, useMemo } from "react";
import { parseDeklinationTemplate } from "@/lib/bac-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KonnektorSentence {
  text_with_gaps: string;
  connectors: string[];
  connector_display: string;
}

interface GrammatikCardProps {
  variant:
    | "tempus"
    | "aktiv_passiv"
    | "satzbau"
    | "modalverb"
    | "konnektoren"
    | "deklination"
    | "fragen_stellen";
  // tempus
  tense?: string;
  // aktiv_passiv
  direction?: "aktiv" | "passiv";
  // satzbau
  clause_type?: string;
  sentence2?: string;
  // modalverb / fragen_stellen
  underlined_words?: string[];
  // konnektoren
  konnektor_sentences?: KonnektorSentence[];
  // deklination
  template?: string;
  // common
  original_sentence: string;
  correct_answer: string;
  points: number;
  onAnswerChange: (answer: string | Record<string, string>) => void;
  showResults?: boolean;
  result?: {
    is_correct: boolean;
    is_partial: boolean;
    feedback: string;
    correct_answer: string;
    score: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FONT = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

type FeedbackLevel = "correct" | "partial" | "incorrect";

function getLevel(
  result: GrammatikCardProps["result"],
  fallback?: boolean
): FeedbackLevel {
  if (result) {
    if (result.is_correct) return "correct";
    if (result.is_partial) return "partial";
    return "incorrect";
  }
  if (fallback === true) return "correct";
  if (fallback === false) return "incorrect";
  return "incorrect";
}

const LEVEL_STYLES: Record<
  FeedbackLevel,
  { container: string; icon: string; label: string }
> = {
  correct: {
    container: "bg-green-50 border-green-200 text-green-700",
    icon: "✓",
    label: "Richtig",
  },
  partial: {
    container: "bg-[#FFB200]/10 border-[#FFB200]/30 text-[#7a5700]",
    icon: "◑",
    label: "Teilweise richtig",
  },
  incorrect: {
    container: "bg-[#FF5A5F]/10 border-[#FF5A5F]/25 text-[#FF5A5F]",
    icon: "✗",
    label: "Falsch",
  },
};

/** Renders a sentence with certain words highlighted with underline */
function SentenceWithUnderline({
  sentence,
  underlinedWords,
}: {
  sentence: string;
  underlinedWords: string[];
}) {
  if (!underlinedWords || underlinedWords.length === 0) {
    return <span>{sentence}</span>;
  }
  // Build regex that matches any of the underlined words (longest first to avoid partial matches)
  const sorted = [...underlinedWords].sort((a, b) => b.length - a.length);
  const pattern = sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${pattern})`, "g");
  const parts = sentence.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        underlinedWords.includes(part) ? (
          <span key={i} className="underline underline-offset-2 font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** Shared textarea for simple answer variants */
function AnswerTextarea({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={3}
      placeholder={placeholder ?? "Ihre Antwort…"}
      className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 resize-none leading-relaxed disabled:cursor-default disabled:opacity-80"
      style={FONT}
    />
  );
}

/** Tinted source sentence box */
function SourceBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#6C4CE0]/20 bg-[#6C4CE0]/5 px-4 py-2.5 text-[12px] leading-relaxed">
      {children}
    </div>
  );
}

/** Result feedback block */
function ResultFeedback({
  level,
  result,
  points,
}: {
  level: FeedbackLevel;
  result: GrammatikCardProps["result"];
  points: number;
}) {
  const fb = LEVEL_STYLES[level];
  return (
    <div
      className={`rounded-xl px-3 py-2.5 text-[12px] border flex flex-col gap-1.5 ${fb.container}`}
    >
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-[14px]">{fb.icon}</span>
        <span>{fb.label}</span>
        {result?.score !== undefined && (
          <span className="ml-auto tabular-nums text-[11px] font-normal opacity-80">
            {result.score} / {points}
          </span>
        )}
      </div>
      {result?.feedback && (
        <p className="leading-relaxed opacity-90">{result.feedback}</p>
      )}
      {level !== "correct" && result?.correct_answer && (
        <p>
          Richtige Antwort: <strong>{result.correct_answer}</strong>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Tempus
// ---------------------------------------------------------------------------

function TempusVariant({
  tense,
  original_sentence,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const [answer, setAnswer] = useState("");
  const isCorrect =
    result?.is_correct ?? normalize(answer) === normalize(correct_answer);
  const level = getLevel(result, isCorrect);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#6C4CE0]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C4CE0]">
          Tempus
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">
        Setzen Sie den folgenden Satz ins{" "}
        <span className="not-italic font-medium text-foreground">{tense}</span>!
      </p>
      <SourceBox>{original_sentence}</SourceBox>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Im {tense}:
        </label>
        <AnswerTextarea
          value={answer}
          onChange={(val) => {
            setAnswer(val);
            onAnswerChange(val);
          }}
          disabled={showResults}
          placeholder={`Satz im ${tense}…`}
        />
      </div>
      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Aktiv / Passiv
// ---------------------------------------------------------------------------

function AktivPassivVariant({
  direction,
  original_sentence,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const [answer, setAnswer] = useState("");
  const isCorrect =
    result?.is_correct ?? normalize(answer) === normalize(correct_answer);
  const level = getLevel(result, isCorrect);

  const instruction =
    direction === "aktiv"
      ? "Bilden Sie den folgenden Satz ins Aktiv um!"
      : "Setzen Sie den folgenden Satz ins Passiv!";

  const label = direction === "aktiv" ? "Aktivsatz:" : "Passivsatz:";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#FF5A5F]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF5A5F]">
          {direction === "aktiv" ? "Aktiv" : "Passiv"}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">{instruction}</p>
      <SourceBox>{original_sentence}</SourceBox>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">{label}</label>
        <AnswerTextarea
          value={answer}
          onChange={(val) => {
            setAnswer(val);
            onAnswerChange(val);
          }}
          disabled={showResults}
          placeholder={`${direction === "aktiv" ? "Aktiv" : "Passiv"}satz…`}
        />
      </div>
      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Satzbau
// ---------------------------------------------------------------------------

function SatzbauVariant({
  clause_type,
  original_sentence,
  sentence2,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const [answer, setAnswer] = useState("");
  const isCorrect =
    result?.is_correct ?? normalize(answer) === normalize(correct_answer);
  const level = getLevel(result, isCorrect);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#FFB200]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#7a5700]">
          Satzbau
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">
        Bilden Sie einen{" "}
        <span className="not-italic font-medium text-foreground">
          {clause_type}
        </span>{" "}
        aus den folgenden Sätzen!
      </p>
      {/* Two numbered sentence boxes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#6C4CE0]/10 text-[10px] font-bold text-[#6C4CE0] flex items-center justify-center">
            1
          </span>
          <div className="flex-1 rounded-xl border border-[#6C4CE0]/20 bg-[#6C4CE0]/5 px-3 py-2 text-[12px] leading-relaxed">
            {original_sentence}
          </div>
        </div>
        {sentence2 && (
          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#6C4CE0]/10 text-[10px] font-bold text-[#6C4CE0] flex items-center justify-center">
              2
            </span>
            <div className="flex-1 rounded-xl border border-[#6C4CE0]/20 bg-[#6C4CE0]/5 px-3 py-2 text-[12px] leading-relaxed">
              {sentence2}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          {clause_type}:
        </label>
        <AnswerTextarea
          value={answer}
          onChange={(val) => {
            setAnswer(val);
            onAnswerChange(val);
          }}
          disabled={showResults}
          placeholder={`${clause_type}…`}
        />
      </div>
      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Modalverb
// ---------------------------------------------------------------------------

function ModalverbVariant({
  original_sentence,
  underlined_words,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const [answer, setAnswer] = useState("");
  const isCorrect =
    result?.is_correct ?? normalize(answer) === normalize(correct_answer);
  const level = getLevel(result, isCorrect);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#0FB6A3]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0FB6A3]">
          Modalverb
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">
        Ersetzen Sie den unterstrichenen Ausdruck durch ein passendes Modalverb!
      </p>
      <SourceBox>
        <SentenceWithUnderline
          sentence={original_sentence}
          underlinedWords={underlined_words ?? []}
        />
      </SourceBox>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Mit Modalverb:
        </label>
        <AnswerTextarea
          value={answer}
          onChange={(val) => {
            setAnswer(val);
            onAnswerChange(val);
          }}
          disabled={showResults}
          placeholder="Umformulierter Satz…"
        />
      </div>
      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Fragen stellen
// ---------------------------------------------------------------------------

function FragenStellenVariant({
  original_sentence,
  underlined_words,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const [answer, setAnswer] = useState("");
  const isCorrect =
    result?.is_correct ?? normalize(answer) === normalize(correct_answer);
  const level = getLevel(result, isCorrect);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#FF5A5F]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF5A5F]">
          Fragen stellen
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">
        Stellen Sie eine Frage nach dem unterstrichenen Satzteil!
      </p>
      <SourceBox>
        <SentenceWithUnderline
          sentence={original_sentence}
          underlinedWords={underlined_words ?? []}
        />
      </SourceBox>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Ihre Frage:
        </label>
        <AnswerTextarea
          value={answer}
          onChange={(val) => {
            setAnswer(val);
            onAnswerChange(val);
          }}
          disabled={showResults}
          placeholder="Frage…"
        />
      </div>
      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Deklination – inline mini-inputs
// ---------------------------------------------------------------------------

function DeklinationVariant({
  template,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const parts = useMemo(
    () => parseDeklinationTemplate(template ?? ""),
    [template]
  );

  // Build initial state: one entry per gap index
  const gapCount = parts.filter((p) => p.type === "gap").length;
  const [gapValues, setGapValues] = useState<string[]>(
    Array(gapCount).fill("")
  );

  const handleGapChange = useCallback(
    (gapIdx: number, val: string) => {
      setGapValues((prev) => {
        const next = [...prev];
        next[gapIdx] = val;
        // Emit as Record<string, string>
        const record: Record<string, string> = {};
        next.forEach((v, i) => {
          record[`gap_${i}`] = v;
        });
        onAnswerChange(record);
        return next;
      });
    },
    [onAnswerChange]
  );

  // Per-gap correct answers extracted from the template (part.value = the answer for that gap)
  const gapAnswers = useMemo(
    () => parts.filter((p) => p.type === "gap").map((p) => p.value),
    [parts]
  );

  // Per-gap correctness: case-insensitive trim comparison
  const gapResults = useMemo(
    () => gapAnswers.map((ans, i) =>
      normalize(gapValues[i] ?? "") === normalize(ans)
    ),
    [gapAnswers, gapValues]
  );

  const correctCount = gapResults.filter(Boolean).length;
  const totalGaps = gapAnswers.length || 4;
  // Score: 0.25 per correct gap (total 1 pt for 4 gaps)
  const perGapPoint = points / totalGaps;
  const localScore = correctCount * perGapPoint;
  const isCorrect = result?.is_correct ?? correctCount === totalGaps;
  const level = getLevel(result, isCorrect);

  let runningGapIdx = 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#FFB200]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#7a5700]">
          Deklination
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {showResults
            ? `${localScore.toFixed(2)} / ${points} Punkt${points !== 1 ? "e" : ""}`
            : `${points} Punkt${points !== 1 ? "e" : ""}`}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">
        Ergänzen Sie die fehlenden Endungen!
      </p>

      {/* Inline template with per-gap color feedback */}
      <div className="rounded-xl border border-[#6C4CE0]/20 bg-[#6C4CE0]/5 px-4 py-3 text-[12px] leading-loose flex flex-wrap items-baseline gap-0">
        {parts.map((part, idx) => {
          if (part.type === "text") {
            return <span key={idx}>{part.value}</span>;
          }
          const gapIdx = runningGapIdx++;
          // Per-gap color when showing results
          const borderColor = showResults
            ? gapResults[gapIdx]
              ? "border-green-400 bg-green-50"
              : "border-[#FF5A5F] bg-[#FF5A5F]/5"
            : "border-[#6C4CE0]/40 bg-white/80 focus:border-[#6C4CE0] focus:ring-2 focus:ring-[#6C4CE0]/20";

          return (
            <span key={idx} className="relative inline-flex flex-col items-center mx-0.5">
              <input
                type="text"
                value={gapValues[gapIdx]}
                onChange={(e) => handleGapChange(gapIdx, e.target.value)}
                disabled={showResults}
                placeholder="…"
                className={`rounded-md border px-1 py-0 text-[12px] outline-none transition text-center disabled:cursor-default disabled:opacity-80 ${borderColor}`}
                style={{ ...FONT, width: 40, minWidth: 40 }}
              />
              {/* Show correct answer below wrong gap */}
              {showResults && !gapResults[gapIdx] && (
                <span className="text-[10px] text-green-600 font-semibold leading-tight">
                  {gapAnswers[gapIdx]}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant: Konnektoren – click-to-place word bank
// ---------------------------------------------------------------------------

type GapState = string | null; // null = empty, string = filled connector part

interface KonnektorenState {
  // gaps[sentenceIdx][gapIdx] = placed connector part or null
  gaps: GapState[][];
  // bank: map from connector_display → remaining count
  bankCounts: Record<string, number>;
  // which pill is selected (connector_display)
  selected: string | null;
}

function parseGapSentence(text: string): string[] {
  // Split on "___" markers, returning alternating text/gap segments
  return text.split("___");
}

function KonnektorenVariant({
  konnektor_sentences,
  correct_answer,
  points,
  onAnswerChange,
  showResults,
  result,
}: GrammatikCardProps) {
  const sentences = konnektor_sentences ?? [];

  // Build initial gap state
  const initialGaps: GapState[][] = sentences.map((s) => {
    const segCount = parseGapSentence(s.text_with_gaps).length - 1;
    return Array(segCount).fill(null);
  });

  // Build initial bank: count unique connector_display entries
  const initialBankCounts: Record<string, number> = {};
  for (const s of sentences) {
    initialBankCounts[s.connector_display] =
      (initialBankCounts[s.connector_display] ?? 0) + 1;
  }

  const [state, setState] = useState<KonnektorenState>({
    gaps: initialGaps,
    bankCounts: initialBankCounts,
    selected: null,
  });

  // Emit full answer string when state changes
  const emitAnswer = useCallback(
    (gaps: GapState[][]) => {
      const parts: string[] = [];
      gaps.forEach((sentenceGaps, sIdx) => {
        const segs = parseGapSentence(sentences[sIdx].text_with_gaps);
        segs.forEach((seg, i) => {
          parts.push(seg);
          if (i < sentenceGaps.length) {
            parts.push(sentenceGaps[i] ?? "___");
          }
        });
        parts.push(" ");
      });
      onAnswerChange(parts.join("").trim());
    },
    [sentences, onAnswerChange]
  );

  const handlePillClick = (display: string) => {
    if (showResults) return;
    setState((prev) => ({
      ...prev,
      selected: prev.selected === display ? null : display,
    }));
  };

  const handleGapClick = (sentenceIdx: number, gapIdx: number) => {
    if (showResults) return;
    setState((prev) => {
      const newGaps = prev.gaps.map((row) => [...row]);
      const sentence = sentences[sentenceIdx];
      const currentFill = newGaps[sentenceIdx][gapIdx];

      // If gap is filled → return to bank
      if (currentFill !== null) {
        // Find the connector_display for the fill
        // currentFill is one part of a connector; find which sentence it came from
        const matchingSentence = sentences.find((s) =>
          s.connectors.includes(currentFill)
        );
        const display = matchingSentence?.connector_display ?? currentFill;
        const newBankCounts = { ...prev.bankCounts };
        newBankCounts[display] = (newBankCounts[display] ?? 0) + 1;
        // Clear all gaps for this connector's sentence (multi-part connectors)
        // Since each sentence maps to one connector, clear all gaps in this sentence
        // that are filled with parts of the same connector
        const connectorParts = sentence.connectors;
        for (let i = 0; i < newGaps[sentenceIdx].length; i++) {
          if (
            newGaps[sentenceIdx][i] !== null &&
            connectorParts.includes(newGaps[sentenceIdx][i]!)
          ) {
            newGaps[sentenceIdx][i] = null;
          }
        }
        const next = { ...prev, gaps: newGaps, bankCounts: newBankCounts };
        emitAnswer(newGaps);
        return next;
      }

      // If no pill selected, do nothing
      if (!prev.selected) return prev;

      const selectedDisplay = prev.selected;
      // Find the sentence definition whose connector_display matches
      const sentenceDef = sentences[sentenceIdx];
      if (sentenceDef.connector_display !== selectedDisplay) {
        // Wrong connector for this sentence – still allow placement (student might be trying)
        // Place the first connector part in this gap from the bank
      }

      // Find a sentence definition with this display to get its connector parts
      const defWithDisplay = sentences.find(
        (s) => s.connector_display === selectedDisplay
      );
      if (!defWithDisplay) return prev;

      const connectorParts = defWithDisplay.connectors;
      const gapCount = newGaps[sentenceIdx].length;

      // Place connector parts starting at gapIdx
      if (gapIdx + connectorParts.length > gapCount) return prev; // not enough gaps

      // Check those gaps are empty
      for (let i = 0; i < connectorParts.length; i++) {
        if (newGaps[sentenceIdx][gapIdx + i] !== null) return prev;
      }

      // Place
      for (let i = 0; i < connectorParts.length; i++) {
        newGaps[sentenceIdx][gapIdx + i] = connectorParts[i];
      }

      const newBankCounts = { ...prev.bankCounts };
      newBankCounts[selectedDisplay] = Math.max(
        0,
        (newBankCounts[selectedDisplay] ?? 1) - 1
      );

      const next = {
        ...prev,
        gaps: newGaps,
        bankCounts: newBankCounts,
        selected: null,
      };
      emitAnswer(newGaps);
      return next;
    });
  };

  // Determine overall correctness
  const isCorrect =
    result?.is_correct ??
    (() => {
      // Build answer string from gaps and compare
      const parts: string[] = [];
      state.gaps.forEach((sentenceGaps, sIdx) => {
        const segs = parseGapSentence(sentences[sIdx].text_with_gaps);
        segs.forEach((seg, i) => {
          parts.push(seg);
          if (i < sentenceGaps.length)
            parts.push(sentenceGaps[i] ?? "");
        });
      });
      return normalize(parts.join("")) === normalize(correct_answer);
    })();

  const level = getLevel(result, isCorrect);

  // Available bank pills (those with count > 0)
  const bankPills = Object.entries(state.bankCounts).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-[#0FB6A3]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0FB6A3]">
          Konnektoren
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>
      <p className="text-[12px] italic text-muted-foreground">
        Verbinden Sie die Sätze mit den passenden Konnektoren!
      </p>

      {/* Word bank */}
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-secondary/30 px-3 py-2.5">
        <span className="text-[10px] text-muted-foreground self-center mr-1 shrink-0">
          Wortbank:
        </span>
        {bankPills.length === 0 && (
          <span className="text-[11px] text-muted-foreground italic">
            alle verwendet
          </span>
        )}
        {bankPills.map(([display, count]) => (
          <button
            key={display}
            type="button"
            onClick={() => handlePillClick(display)}
            disabled={showResults}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition select-none
              ${
                state.selected === display
                  ? "bg-[#0FB6A3] text-white border-[#0FB6A3] shadow-sm"
                  : "bg-[#0FB6A3]/10 text-[#0FB6A3] border-[#0FB6A3]/20 hover:bg-[#0FB6A3]/20"
              } disabled:cursor-default`}
            style={FONT}
          >
            {display}
            {count > 1 && (
              <span className="text-[10px] opacity-70">×{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Sentences with gap slots */}
      <div className="flex flex-col gap-2">
        {sentences.map((sent, sIdx) => {
          const segments = parseGapSentence(sent.text_with_gaps);
          return (
            <div
              key={sIdx}
              className="rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-[12px] leading-loose flex flex-wrap items-baseline gap-0"
            >
              {segments.map((seg, segIdx) => (
                <>
                  <span key={`seg-${segIdx}`}>{seg}</span>
                  {segIdx < state.gaps[sIdx].length && (
                    <button
                      key={`gap-${segIdx}`}
                      type="button"
                      onClick={() => handleGapClick(sIdx, segIdx)}
                      disabled={showResults}
                      className={`inline-flex items-center justify-center mx-1 rounded-md px-2 py-0 text-[12px] font-medium border transition min-w-[48px]
                        ${
                          state.gaps[sIdx][segIdx] !== null
                            ? "bg-[#0FB6A3]/15 text-[#0FB6A3] border-[#0FB6A3]/40 hover:bg-[#0FB6A3]/25"
                            : state.selected
                            ? "border-dashed border-[#0FB6A3]/60 text-[#0FB6A3]/50 hover:bg-[#0FB6A3]/10 cursor-pointer"
                            : "border-dashed border-border text-muted-foreground/50"
                        } disabled:cursor-default`}
                      style={FONT}
                    >
                      {state.gaps[sIdx][segIdx] ?? "…"}
                    </button>
                  )}
                </>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hint: click instructions */}
      {!showResults && (
        <p className="text-[11px] text-muted-foreground italic">
          Klicken Sie auf einen Konnektor, dann auf die Lücke — oder klicken
          Sie auf eine Lücke, um das Wort zurückzugeben.
        </p>
      )}

      {showResults && (
        <ResultFeedback level={level} result={result} points={points} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GrammatikCard(props: GrammatikCardProps) {
  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm p-5"
      style={FONT}
    >
      {props.variant === "tempus" && <TempusVariant {...props} />}
      {props.variant === "aktiv_passiv" && <AktivPassivVariant {...props} />}
      {props.variant === "satzbau" && <SatzbauVariant {...props} />}
      {props.variant === "modalverb" && <ModalverbVariant {...props} />}
      {props.variant === "fragen_stellen" && (
        <FragenStellenVariant {...props} />
      )}
      {props.variant === "deklination" && <DeklinationVariant {...props} />}
      {props.variant === "konnektoren" && <KonnektorenVariant {...props} />}
    </div>
  );
}

export default GrammatikCard;
