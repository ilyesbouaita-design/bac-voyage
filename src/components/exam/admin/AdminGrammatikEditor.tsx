"use client";

import React, { useState } from "react";
import type {
  GrammatikTempusContent,
  GrammatikAktivPassivContent,
  GrammatikSatzbauContent,
  GrammatikModalverbContent,
  GrammatikKonnektorenContent,
  GrammatikDeklinationContent,
  GrammatikFragenStellenContent,
} from "@/lib/bac-types";

interface AdminGrammatikEditorProps {
  value: any;
  onChange: (value: any) => void;
  grammarType: string;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const inputCls =
  "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const TENSES = ["Präsens", "Präteritum", "Perfekt", "Futur"] as const;
type Tense = typeof TENSES[number];

const SATZBAU_TYPES = [
  "Finalsatz",
  "Konditionalsatz",
  "Konzessivsatz",
  "Temporalsatz",
  "Relativsatz",
] as const;
type SatzbauType = typeof SATZBAU_TYPES[number];

const FREE_CHOICE_TYPES = [
  { key: "Finalsatz", label: "Finalsatz", sub: "damit / um...zu", color: "#6C4CE0" },
  { key: "Konditionalsatz", label: "Irrealer Konditionalsatz", sub: "wenn...würde", color: "#6C4CE0" },
  { key: "Konzessivsatz", label: "Konzessivsatz", sub: "obwohl / trotzdem", color: "#6C4CE0" },
  { key: "Temporalsatz", label: "Temporalsatz", sub: "nachdem / bevor", color: "#6C4CE0" },
  { key: "Relativsatz", label: "Relativsatz", sub: "der/die/das + Verb", color: "#6C4CE0" },
  { key: "Modalverb", label: "Modalverb", sub: "müssen / können / dürfen…", color: "#FFB200" },
  { key: "Konnektoren", label: "Konnektoren", sub: "Drag & drop", color: "#0FB6A3" },
  { key: "Deklination", label: "Deklination", sub: "D[er] groß[e] Hund", color: "#FF5A5F" },
  { key: "FragenStellen", label: "Fragen stellen", sub: "Unterstreiche → Frage", color: "#FF5A5F" },
] as const;
type FreeChoiceKey = typeof FREE_CHOICE_TYPES[number]["key"];

// Satzbau instruction labels
const SATZBAU_INSTRUCTIONS: Record<string, string> = {
  Finalsatz: "Verbinden Sie die Sätze mit einem Finalsatz (damit / um...zu)!",
  Konditionalsatz: "Bilden Sie einen irrealen Konditionalsatz!",
  Konzessivsatz: "Verbinden Sie die Sätze mit einem Konzessivsatz (obwohl / trotzdem)!",
  Temporalsatz: "Verbinden Sie die Sätze mit einem Temporalsatz (nachdem / bevor)!",
  Relativsatz: "Verbinden Sie die Sätze mit einem Relativsatz!",
};

// ─────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────

function PointsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[12px] font-medium shrink-0" style={FONT}>
        Points
      </label>
      <input
        type="number"
        min={0}
        step={0.5}
        className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 w-20"
        value={value ?? 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={FONT}
      />
    </div>
  );
}

function CaseNote({ text }: { text: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2 text-[11px]"
      style={{
        backgroundColor: "#FFB20015",
        borderLeft: "3px solid #FFB200",
        fontFamily: FONT.fontFamily,
        fontSize: "11px",
        color: "#92400e",
      }}
    >
      {text}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-medium" style={FONT}>
      {children}
    </label>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] text-muted-foreground underline hover:no-underline"
      style={FONT}
    >
      ← Changer le type
    </button>
  );
}

// ─────────────────────────────────────────────
// Sub-editors
// ─────────────────────────────────────────────

// ---- Tempus editor ----
function TempusEditor({
  value,
  onChange,
}: {
  value: GrammatikTempusContent & { points?: number };
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Tense dropdown */}
      <div className="space-y-1">
        <SectionLabel>Temps</SectionLabel>
        <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-secondary/20 flex-wrap">
          <span style={FONT}>Setzen Sie ins</span>
          <select
            className="rounded-lg border border-border bg-card px-2 py-1 text-[12px] outline-none focus:border-[#6C4CE0]"
            value={value.tense}
            onChange={(e) => onChange({ ...value, tense: e.target.value as Tense })}
            style={FONT}
          >
            {TENSES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span style={FONT}>!</span>
        </div>
        <p className="text-[11px] italic" style={{ color: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "11px" }}>
          → Setzen Sie ins {value.tense}!
        </p>
      </div>

      {/* Original sentence */}
      <div className="space-y-1">
        <SectionLabel>Satz (Original)</SectionLabel>
        <input
          className={inputCls}
          value={value.original_sentence}
          onChange={(e) => onChange({ ...value, original_sentence: e.target.value })}
          placeholder="Originalsatz eingeben…"
          style={FONT}
        />
      </div>

      {/* Correct answer */}
      <div className="space-y-1">
        <SectionLabel>Korrekte Antwort</SectionLabel>
        <input
          className={inputCls}
          value={value.correct_answer}
          onChange={(e) => onChange({ ...value, correct_answer: e.target.value })}
          placeholder="Korrekte Antwort eingeben…"
          style={FONT}
        />
      </div>

      <CaseNote text="La comparaison ignore les majuscules/minuscules." />

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ---- Aktiv/Passiv editor ----
function AktivPassivEditor({
  value,
  onChange,
}: {
  value: GrammatikAktivPassivContent & { points?: number };
  onChange: (v: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Direction dropdown */}
      <div className="space-y-1">
        <SectionLabel>Direction</SectionLabel>
        <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-secondary/20">
          <select
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] outline-none focus:border-[#6C4CE0]"
            value={value.direction}
            onChange={(e) =>
              onChange({ ...value, direction: e.target.value as "aktiv" | "passiv" })
            }
            style={FONT}
          >
            <option value="aktiv">Bilden Sie Aktiv!</option>
            <option value="passiv">Setzen Sie ins Passiv!</option>
          </select>
        </div>
        <p className="text-[11px] italic" style={{ color: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "11px" }}>
          → {value.direction === "aktiv" ? "Bilden Sie Aktiv!" : "Setzen Sie ins Passiv!"}
        </p>
      </div>

      {/* Original sentence */}
      <div className="space-y-1">
        <SectionLabel>Satz (Original)</SectionLabel>
        <input
          className={inputCls}
          value={value.original_sentence}
          onChange={(e) => onChange({ ...value, original_sentence: e.target.value })}
          placeholder="Originalsatz eingeben…"
          style={FONT}
        />
      </div>

      {/* Correct answer */}
      <div className="space-y-1">
        <SectionLabel>Korrekte Antwort</SectionLabel>
        <input
          className={inputCls}
          value={value.correct_answer}
          onChange={(e) => onChange({ ...value, correct_answer: e.target.value })}
          placeholder="Korrekte Antwort eingeben…"
          style={FONT}
        />
      </div>

      <CaseNote text="La comparaison ignore les majuscules/minuscules." />

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ---- Satzbau editor ----
function SatzbauEditor({
  value,
  onChange,
  onBack,
}: {
  value: GrammatikSatzbauContent & { points?: number };
  onChange: (v: any) => void;
  onBack: () => void;
}) {
  const instruction = SATZBAU_INSTRUCTIONS[value.clause_type] ?? "Verbinden Sie die Sätze!";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#6C4CE0", fontFamily: FONT.fontFamily }}
        >
          {value.clause_type}
        </span>
        <BackLink onClick={onBack} />
      </div>

      {/* Auto-instruction */}
      <div className="p-3 rounded-xl bg-[#6C4CE0]/05 border border-[#6C4CE0]/20">
        <p className="text-[12px] italic font-medium" style={{ color: "#6C4CE0", ...FONT }}>
          {instruction}
        </p>
      </div>

      <div className="space-y-1">
        <SectionLabel>Satz 1</SectionLabel>
        <input
          className={inputCls}
          value={value.sentence1}
          onChange={(e) => onChange({ ...value, sentence1: e.target.value })}
          placeholder="Erster Satz…"
          style={FONT}
        />
      </div>

      <div className="space-y-1">
        <SectionLabel>Satz 2</SectionLabel>
        <input
          className={inputCls}
          value={value.sentence2}
          onChange={(e) => onChange({ ...value, sentence2: e.target.value })}
          placeholder="Zweiter Satz…"
          style={FONT}
        />
      </div>

      <div className="space-y-1">
        <SectionLabel>Korrekte Antwort</SectionLabel>
        <input
          className={inputCls}
          value={value.correct_answer}
          onChange={(e) => onChange({ ...value, correct_answer: e.target.value })}
          placeholder="Korrekte kombinierte Antwort…"
          style={FONT}
        />
      </div>

      <CaseNote text="La comparaison ignore les majuscules/minuscules." />

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ---- Multi-word selection (Modalverb / FragenStellen) ----
function MultiWordSelector({
  sentence,
  selectedWords,
  onSelectWord,
  highlightColor,
}: {
  sentence: string;
  selectedWords: string[];
  onSelectWord: (word: string) => void;
  highlightColor: string;
}) {
  const tokens = sentence.trim().split(/(\s+)/).filter(Boolean);

  return (
    <div
      className="p-3 rounded-xl border-2 border-dashed leading-relaxed select-none"
      style={{ borderColor: highlightColor }}
    >
      {tokens.map((tok, i) => {
        const isSpace = tok.trim().length === 0;
        if (isSpace) return <span key={i}>{tok}</span>;
        const clean = tok.replace(/[.,!?;:"""''«»()\[\]]/g, "");
        const isSelected = selectedWords.includes(clean);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelectWord(clean)}
            className="rounded px-0.5 transition cursor-pointer"
            style={{
              ...FONT,
              color: isSelected ? "#fff" : highlightColor,
              backgroundColor: isSelected ? highlightColor : "transparent",
              fontWeight: isSelected ? 700 : 400,
              textDecoration: isSelected ? "none" : "underline",
              textDecorationStyle: "dotted",
            }}
          >
            {tok}
          </button>
        );
      })}
    </div>
  );
}

// ---- Modalverb editor ----
function ModalverbEditor({
  value,
  onChange,
  onBack,
}: {
  value: GrammatikModalverbContent & { points?: number };
  onChange: (v: any) => void;
  onBack: () => void;
}) {
  const [selectMode, setSelectMode] = useState(false);

  function handleToggleWord(word: string) {
    const current = value.underlined_words ?? [];
    const updated = current.includes(word)
      ? current.filter((w) => w !== word)
      : [...current, word];
    onChange({ ...value, underlined_words: updated });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#FFB200", fontFamily: FONT.fontFamily }}
        >
          Modalverb
        </span>
        <BackLink onClick={onBack} />
      </div>

      {/* Sentence */}
      <div className="space-y-1">
        <SectionLabel>Satz</SectionLabel>
        <input
          className={inputCls}
          value={value.sentence}
          onChange={(e) => {
            onChange({ ...value, sentence: e.target.value, underlined_words: [] });
            setSelectMode(false);
          }}
          placeholder="Satz mit Modalverb eingeben…"
          style={FONT}
        />
      </div>

      {/* Selection trigger */}
      {!selectMode && (
        <button
          type="button"
          disabled={!value.sentence.trim()}
          onClick={() => setSelectMode(true)}
          className="rounded-xl px-4 py-2 text-[12px] font-medium text-white transition disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: "#FFB200", fontFamily: FONT.fontFamily, fontSize: "12px" }}
        >
          Sélectionner les mots ✏️
        </button>
      )}

      {/* Selection mode */}
      {selectMode && (
        <div className="space-y-2">
          <p className="text-[12px] text-muted-foreground" style={FONT}>
            Cliquez sur les mots à souligner (plusieurs sélections possibles) :
          </p>
          <MultiWordSelector
            sentence={value.sentence}
            selectedWords={value.underlined_words ?? []}
            onSelectWord={handleToggleWord}
            highlightColor="#FFB200"
          />
          {(value.underlined_words ?? []).length > 0 && (
            <p className="text-[11px]" style={{ color: "#FFB200", fontFamily: FONT.fontFamily, fontSize: "11px" }}>
              Sélectionnés : {value.underlined_words.join(", ")}
            </p>
          )}
          <button
            type="button"
            onClick={() => setSelectMode(false)}
            className="text-[12px] text-muted-foreground underline hover:no-underline"
            style={FONT}
          >
            Confirmer la sélection
          </button>
        </div>
      )}

      {/* Correct answer */}
      <div className="space-y-1">
        <SectionLabel>Korrekte Antwort</SectionLabel>
        <input
          className={inputCls}
          value={value.correct_answer}
          onChange={(e) => onChange({ ...value, correct_answer: e.target.value })}
          placeholder="Korrekte Antwort…"
          style={FONT}
        />
      </div>

      <CaseNote text="La comparaison ignore les majuscules/minuscules." />

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ---- Konnektoren editor ----
// Each sentence: admin types text, marks the connector words.
// Multiple connector words in same sentence are grouped with "…"

interface KonnektorSentenceDraft {
  rawText: string;
  connectorIndices: number[]; // indices into word tokens that are connectors
}

function KonnektorenSentenceRow({
  draft,
  onChange,
  onRemove,
  index,
}: {
  draft: KonnektorSentenceDraft;
  onChange: (d: KonnektorSentenceDraft) => void;
  onRemove: () => void;
  index: number;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const tokens = draft.rawText.trim().split(/(\s+)/).filter(Boolean);
  const wordOnlyTokens = tokens.filter((t) => t.trim().length > 0);

  function handleToggleToken(wordIdx: number) {
    const current = draft.connectorIndices;
    const updated = current.includes(wordIdx)
      ? current.filter((i) => i !== wordIdx)
      : [...current, wordIdx].sort((a, b) => a - b);
    onChange({ ...draft, connectorIndices: updated });
  }

  // Build connector display label: selected words joined by "…"
  const connectorWords = draft.connectorIndices.map((i) =>
    (wordOnlyTokens[i] ?? "").replace(/[.,!?;:"""''«»()\[\]]/g, "")
  );
  const connectorDisplay =
    connectorWords.length > 1 ? connectorWords.join("…") : connectorWords[0] ?? "";

  return (
    <div className="rounded-xl border border-border p-3 space-y-2 bg-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>
          Phrase {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] text-muted-foreground hover:text-destructive transition"
          style={{ fontFamily: FONT.fontFamily, fontSize: "11px" }}
        >
          ✕ Supprimer
        </button>
      </div>

      <input
        className={inputCls}
        value={draft.rawText}
        onChange={(e) => {
          onChange({ rawText: e.target.value, connectorIndices: [] });
          setSelectMode(false);
        }}
        placeholder="Saisir la phrase complète…"
        style={FONT}
      />

      {!selectMode && (
        <button
          type="button"
          disabled={!draft.rawText.trim()}
          onClick={() => setSelectMode(true)}
          className="rounded-lg px-3 py-1 text-[11px] font-medium text-white transition disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: "#0FB6A3", fontFamily: FONT.fontFamily, fontSize: "11px" }}
        >
          Marquer les connecteurs ✏️
        </button>
      )}

      {selectMode && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>
            Cliquez sur les mots connecteurs :
          </p>
          <div
            className="p-2 rounded-lg border-2 border-dashed leading-relaxed"
            style={{ borderColor: "#0FB6A3" }}
          >
            {(() => {
              let wordCount = 0;
              return tokens.map((tok, i) => {
                const isSpace = tok.trim().length === 0;
                if (isSpace) return <span key={i}>{tok}</span>;
                const currentWordIdx = wordCount++;
                const isSelected = draft.connectorIndices.includes(currentWordIdx);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleToggleToken(currentWordIdx)}
                    className="rounded px-0.5 transition cursor-pointer"
                    style={{
                      ...FONT,
                      fontSize: "11px",
                      color: isSelected ? "#fff" : "#0FB6A3",
                      backgroundColor: isSelected ? "#0FB6A3" : "transparent",
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    {tok}
                  </button>
                );
              });
            })()}
          </div>
          <button
            type="button"
            onClick={() => setSelectMode(false)}
            className="text-[11px] text-muted-foreground underline hover:no-underline"
            style={{ ...FONT, fontSize: "11px" }}
          >
            Confirmer
          </button>
        </div>
      )}

      {connectorDisplay && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>Connecteur :</span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: "#0FB6A3", fontFamily: FONT.fontFamily, fontSize: "11px" }}
          >
            {connectorDisplay}
          </span>
        </div>
      )}
    </div>
  );
}

function KonnektorenEditor({
  value,
  onChange,
  onBack,
}: {
  value: GrammatikKonnektorenContent & { points?: number };
  onChange: (v: any) => void;
  onBack: () => void;
}) {
  // Convert stored content into draft format
  const [drafts, setDrafts] = useState<KonnektorSentenceDraft[]>(() => {
    if (value.sentences && value.sentences.length > 0) {
      return value.sentences.map((s) => ({
        rawText: s.text_with_gaps.replace(/___/g, s.connector_display),
        connectorIndices: [],
      }));
    }
    return [{ rawText: "", connectorIndices: [] }];
  });

  function syncToValue(newDrafts: KonnektorSentenceDraft[]) {
    const sentences = newDrafts.map((d) => {
      const tokens = d.rawText.trim().split(/(\s+)/).filter(Boolean);
      const wordOnlyTokens = tokens.filter((t) => t.trim().length > 0);
      const connectorWords = d.connectorIndices.map((i) =>
        (wordOnlyTokens[i] ?? "").replace(/[.,!?;:"""''«»()\[\]]/g, "")
      );
      const connectorDisplay =
        connectorWords.length > 1 ? connectorWords.join("…") : connectorWords[0] ?? "";

      let gapText = d.rawText;
      connectorWords.forEach((cw) => {
        if (cw) {
          gapText = gapText.replace(new RegExp(`\\b${escapeRegex(cw)}\\b`, "gi"), "___");
        }
      });

      return {
        text_with_gaps: gapText,
        connectors: connectorWords,
        connector_display: connectorDisplay,
      };
    });
    onChange({ ...value, sentences });
  }

  function handleDraftChange(index: number, newDraft: KonnektorSentenceDraft) {
    const updated = drafts.map((d, i) => (i === index ? newDraft : d));
    setDrafts(updated);
    syncToValue(updated);
  }

  function handleAddSentence() {
    const updated = [...drafts, { rawText: "", connectorIndices: [] }];
    setDrafts(updated);
    syncToValue(updated);
  }

  function handleRemoveSentence(index: number) {
    const updated = drafts.filter((_, i) => i !== index);
    setDrafts(updated);
    syncToValue(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#0FB6A3", fontFamily: FONT.fontFamily }}
        >
          Konnektoren
        </span>
        <BackLink onClick={onBack} />
      </div>

      <div className="space-y-3">
        {drafts.map((draft, i) => (
          <KonnektorenSentenceRow
            key={i}
            index={i}
            draft={draft}
            onChange={(d) => handleDraftChange(i, d)}
            onRemove={() => handleRemoveSentence(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddSentence}
        className="text-[12px] font-medium transition hover:opacity-80"
        style={{ color: "#0FB6A3", fontFamily: FONT.fontFamily, fontSize: "12px" }}
      >
        + Ajouter une phrase
      </button>

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ---- Deklination editor ----
// Admin types "D[er] groß[e] Hund" with brackets marking gaps

function DeklinationEditor({
  value,
  onChange,
  onBack,
}: {
  value: GrammatikDeklinationContent & { points?: number };
  onChange: (v: any) => void;
  onBack: () => void;
}) {
  // Parse template for preview: replace [xxx] with ___
  function buildPreview(template: string): string {
    return template.replace(/\[([^\]]*)\]/g, "___");
  }

  // Parse template to show rich preview with gaps highlighted
  function buildRichPreview(template: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]*)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{template.slice(lastIndex, match.index)}</span>);
      }
      parts.push(
        <span
          key={key++}
          className="inline-block font-bold underline"
          style={{ color: "#FF5A5F", fontFamily: FONT.fontFamily, fontSize: "12px" }}
        >
          ___
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < template.length) {
      parts.push(<span key={key++}>{template.slice(lastIndex)}</span>);
    }
    return parts;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#FF5A5F", fontFamily: FONT.fontFamily }}
        >
          Deklination
        </span>
        <BackLink onClick={onBack} />
      </div>

      {/* Template input */}
      <div className="space-y-1">
        <SectionLabel>Phrase avec déclinaisons</SectionLabel>
        <p className="text-[11px] text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>
          Mettez les terminaisons entre crochets : <code className="bg-secondary/60 px-1 rounded">D[er] groß[e] Hund</code>
        </p>
        <input
          className={inputCls}
          value={value.template}
          onChange={(e) => onChange({ ...value, template: e.target.value })}
          placeholder='ex. "D[er] groß[e] Hund läuft schnell."'
          style={FONT}
        />
      </div>

      {/* Live preview */}
      {value.template && (
        <div className="space-y-1">
          <SectionLabel>Aperçu étudiant</SectionLabel>
          <div
            className="p-3 rounded-xl border leading-relaxed"
            style={{ borderColor: "#FF5A5F40", backgroundColor: "#FF5A5F08" }}
          >
            <span style={FONT}>{buildRichPreview(value.template)}</span>
          </div>
        </div>
      )}

      <div
        className="rounded-xl px-3 py-2 text-[11px]"
        style={{
          backgroundColor: "#FF5A5F15",
          borderLeft: "3px solid #FF5A5F",
          fontFamily: FONT.fontFamily,
          fontSize: "11px",
          color: "#7f1d1d",
        }}
      >
        Les crochets définissent les lacunes. L'étudiant remplit chaque blanc.
      </div>

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ---- Fragen stellen editor ----
function FragenStellenEditor({
  value,
  onChange,
  onBack,
}: {
  value: GrammatikFragenStellenContent & { points?: number };
  onChange: (v: any) => void;
  onBack: () => void;
}) {
  const [selectMode, setSelectMode] = useState(false);

  function handleToggleWord(word: string) {
    const current = value.underlined_words ?? [];
    const updated = current.includes(word)
      ? current.filter((w: string) => w !== word)
      : [...current, word];
    onChange({ ...value, underlined_words: updated });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#FF5A5F", fontFamily: FONT.fontFamily }}
        >
          Fragen stellen
        </span>
        <BackLink onClick={onBack} />
      </div>

      {/* Sentence */}
      <div className="space-y-1">
        <SectionLabel>Satz</SectionLabel>
        <input
          className={inputCls}
          value={value.sentence}
          onChange={(e) => {
            onChange({ ...value, sentence: e.target.value, underlined_words: [] });
            setSelectMode(false);
          }}
          placeholder="Satz eingeben…"
          style={FONT}
        />
      </div>

      {/* Selection trigger */}
      {!selectMode && (
        <button
          type="button"
          disabled={!value.sentence.trim()}
          onClick={() => setSelectMode(true)}
          className="rounded-xl px-4 py-2 text-[12px] font-medium text-white transition disabled:opacity-40 hover:opacity-90"
          style={{ backgroundColor: "#FF5A5F", fontFamily: FONT.fontFamily, fontSize: "12px" }}
        >
          Sélectionner les mots ✏️
        </button>
      )}

      {/* Selection mode */}
      {selectMode && (
        <div className="space-y-2">
          <p className="text-[12px] text-muted-foreground" style={FONT}>
            Cliquez sur les mots soulignés (la question portera sur eux) :
          </p>
          <MultiWordSelector
            sentence={value.sentence}
            selectedWords={value.underlined_words ?? []}
            onSelectWord={handleToggleWord}
            highlightColor="#FF5A5F"
          />
          {(value.underlined_words ?? []).length > 0 && (
            <p className="text-[11px]" style={{ color: "#FF5A5F", fontFamily: FONT.fontFamily, fontSize: "11px" }}>
              Sélectionnés : {value.underlined_words.join(", ")}
            </p>
          )}
          <button
            type="button"
            onClick={() => setSelectMode(false)}
            className="text-[12px] text-muted-foreground underline hover:no-underline"
            style={FONT}
          >
            Confirmer la sélection
          </button>
        </div>
      )}

      {/* Correct question */}
      <div className="space-y-1">
        <SectionLabel>Korrekte Frage</SectionLabel>
        <input
          className={inputCls}
          value={value.correct_question}
          onChange={(e) => onChange({ ...value, correct_question: e.target.value })}
          placeholder="Korrekte Frage eingeben…"
          style={FONT}
        />
      </div>

      <CaseNote text="La comparaison ignore les majuscules/minuscules." />

      <PointsInput value={value.points ?? 0} onChange={(p) => onChange({ ...value, points: p })} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Choice popup (for questions 4, 5, 6)
// ─────────────────────────────────────────────

function GrammarChoicePopup({ onSelect }: { onSelect: (key: FreeChoiceKey) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] font-medium" style={FONT}>
        Choisissez le type d'exercice grammatical :
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FREE_CHOICE_TYPES.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key as FreeChoiceKey)}
            className="rounded-2xl border-2 border-border bg-card p-3 text-left hover:shadow-md transition group"
            style={{ borderColor: opt.color + "30" }}
          >
            <div
              className="text-[12px] font-bold mb-0.5 transition"
              style={{ ...FONT, color: opt.color }}
            >
              {opt.label}
            </div>
            <div
              className="text-[11px] text-muted-foreground"
              style={{ fontFamily: FONT.fontFamily, fontSize: "11px" }}
            >
              {opt.sub}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Default content factories
// ─────────────────────────────────────────────

function defaultForType(key: FreeChoiceKey): any {
  switch (key) {
    case "Finalsatz":
    case "Konditionalsatz":
    case "Konzessivsatz":
    case "Temporalsatz":
    case "Relativsatz":
      return {
        bac_type: "grammatik_satzbau",
        clause_type: key,
        sentence1: "",
        sentence2: "",
        correct_answer: "",
        points: 0,
      };
    case "Modalverb":
      return {
        bac_type: "grammatik_modalverb",
        sentence: "",
        underlined_words: [],
        correct_answer: "",
        points: 0,
      };
    case "Konnektoren":
      return {
        bac_type: "grammatik_konnektoren",
        sentences: [],
        points: 0,
      };
    case "Deklination":
      return {
        bac_type: "grammatik_deklination",
        template: "",
        points: 0,
      };
    case "FragenStellen":
      return {
        bac_type: "grammatik_fragen_stellen",
        sentence: "",
        underlined_words: [],
        correct_question: "",
        points: 0,
      };
  }
}

function freeChoiceKeyFromBacType(bac_type: string): FreeChoiceKey | null {
  switch (bac_type) {
    case "grammatik_satzbau": return null; // need clause_type
    case "grammatik_modalverb": return "Modalverb";
    case "grammatik_konnektoren": return "Konnektoren";
    case "grammatik_deklination": return "Deklination";
    case "grammatik_fragen_stellen": return "FragenStellen";
    default: return null;
  }
}

function satzbauClauseToFreeKey(clause_type: string): FreeChoiceKey | null {
  const map: Record<string, FreeChoiceKey> = {
    Finalsatz: "Finalsatz",
    Konditionalsatz: "Konditionalsatz",
    Konzessivsatz: "Konzessivsatz",
    Temporalsatz: "Temporalsatz",
    Relativsatz: "Relativsatz",
  };
  return map[clause_type] ?? null;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function AdminGrammatikEditor({
  value,
  onChange,
  grammarType,
}: AdminGrammatikEditorProps) {
  // For "free" slots (questions 4/5/6), track which sub-type is chosen
  const [freeKey, setFreeKey] = useState<FreeChoiceKey | null>(() => {
    if (!value?.bac_type) return null;
    if (value.bac_type === "grammatik_satzbau") {
      return satzbauClauseToFreeKey(value.clause_type);
    }
    return freeChoiceKeyFromBacType(value.bac_type);
  });

  const isFreeSlot =
    grammarType !== "grammatik_tempus" && grammarType !== "grammatik_aktiv_passiv";

  function handleFreeSelect(key: FreeChoiceKey) {
    setFreeKey(key);
    onChange(defaultForType(key));
  }

  function handleFreeBack() {
    setFreeKey(null);
    onChange({});
  }

  return (
    <div style={FONT} className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#6C4CE0", fontFamily: FONT.fontFamily }}
        >
          Grammatik
        </span>
        {grammarType && (
          <span className="text-[12px] text-muted-foreground" style={FONT}>
            {grammarType.replace("grammatik_", "").replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* ---- TEMPUS (Q1 & Q2) ---- */}
      {grammarType === "grammatik_tempus" && (
        <TempusEditor
          value={
            value?.bac_type === "grammatik_tempus"
              ? value
              : { bac_type: "grammatik_tempus", tense: "Präteritum", original_sentence: "", correct_answer: "", points: 0 }
          }
          onChange={onChange}
        />
      )}

      {/* ---- AKTIV/PASSIV (Q3) ---- */}
      {grammarType === "grammatik_aktiv_passiv" && (
        <AktivPassivEditor
          value={
            value?.bac_type === "grammatik_aktiv_passiv"
              ? value
              : { bac_type: "grammatik_aktiv_passiv", direction: "passiv", original_sentence: "", correct_answer: "", points: 0 }
          }
          onChange={onChange}
        />
      )}

      {/* ---- FREE CHOICE (Q4, Q5, Q6) ---- */}
      {isFreeSlot && (
        <>
          {/* Show choice popup */}
          {freeKey === null && (
            <GrammarChoicePopup onSelect={handleFreeSelect} />
          )}

          {/* Show sub-editor based on chosen key */}
          {freeKey !== null && (
            <>
              {/* Satzbau types */}
              {["Finalsatz", "Konditionalsatz", "Konzessivsatz", "Temporalsatz", "Relativsatz"].includes(freeKey) && (
                <SatzbauEditor
                  value={
                    value?.bac_type === "grammatik_satzbau"
                      ? value
                      : { bac_type: "grammatik_satzbau", clause_type: freeKey as SatzbauType, sentence1: "", sentence2: "", correct_answer: "", points: 0 }
                  }
                  onChange={onChange}
                  onBack={handleFreeBack}
                />
              )}

              {freeKey === "Modalverb" && (
                <ModalverbEditor
                  value={
                    value?.bac_type === "grammatik_modalverb"
                      ? value
                      : { bac_type: "grammatik_modalverb", sentence: "", underlined_words: [], correct_answer: "", points: 0 }
                  }
                  onChange={onChange}
                  onBack={handleFreeBack}
                />
              )}

              {freeKey === "Konnektoren" && (
                <KonnektorenEditor
                  value={
                    value?.bac_type === "grammatik_konnektoren"
                      ? value
                      : { bac_type: "grammatik_konnektoren", sentences: [], points: 0 }
                  }
                  onChange={onChange}
                  onBack={handleFreeBack}
                />
              )}

              {freeKey === "Deklination" && (
                <DeklinationEditor
                  value={
                    value?.bac_type === "grammatik_deklination"
                      ? value
                      : { bac_type: "grammatik_deklination", template: "", points: 0 }
                  }
                  onChange={onChange}
                  onBack={handleFreeBack}
                />
              )}

              {freeKey === "FragenStellen" && (
                <FragenStellenEditor
                  value={
                    value?.bac_type === "grammatik_fragen_stellen"
                      ? value
                      : { bac_type: "grammatik_fragen_stellen", sentence: "", underlined_words: [], correct_question: "", points: 0 }
                  }
                  onChange={onChange}
                  onBack={handleFreeBack}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AdminGrammatikEditor;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
