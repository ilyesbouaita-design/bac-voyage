"use client";

import React, { useState } from "react";
import type { SynonymContent, GegenteilContent } from "@/lib/bac-types";

interface AdminSynonymGegenteilEditorProps {
  type: "synonym" | "gegenteil";
  value: SynonymContent | GegenteilContent;
  onChange: (value: SynonymContent | GegenteilContent) => void;
}

type EditorState = "input" | "selecting" | "confirmed";

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const inputCls =
  "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15";

export function AdminSynonymGegenteilEditor({
  type,
  value,
  onChange,
}: AdminSynonymGegenteilEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>(
    value.target_word ? "confirmed" : "input"
  );
  const [draftSentence, setDraftSentence] = useState(value.sentence || "");
  const highlightColor = type === "synonym" ? "#6C4CE0" : "#FF5A5F";
  const highlightBg = type === "synonym" ? "#6C4CE0/10" : "#FF5A5F/10";

  // Tokenize sentence into words for selection
  const tokens = draftSentence.trim().split(/(\s+)/).filter(Boolean);
  const wordTokens = tokens.filter((t) => t.trim().length > 0);

  function handleSelectWord(word: string) {
    const cleanWord = word.replace(/[.,!?;:"""''«»()\[\]]/g, "");
    if (type === "synonym") {
      const updated: SynonymContent = {
        bac_type: "synonym",
        sentence: draftSentence,
        target_word: cleanWord,
        accepted_answers: (value as SynonymContent).accepted_answers ?? [],
      };
      onChange(updated);
    } else {
      // For Gegenteil: sentence already contains "………" — just record the clue word
      const updated: GegenteilContent = {
        bac_type: "gegenteil",
        sentence: draftSentence,
        target_word: cleanWord,
        gap_sentence: draftSentence,
        accepted_answers: (value as GegenteilContent).accepted_answers ?? [],
      };
      onChange(updated);
    }
    setEditorState("confirmed");
  }

  function handleReset() {
    setEditorState("input");
    if (type === "synonym") {
      onChange({ ...(value as SynonymContent), target_word: "", accepted_answers: [] });
    } else {
      onChange({ ...(value as GegenteilContent), target_word: "", gap_sentence: draftSentence, accepted_answers: [] });
    }
  }

  function handleAnswerChange(index: number, newVal: string) {
    const current = value.accepted_answers ?? [];
    const updated = current.map((a, i) => (i === index ? newVal : a));
    onChange({ ...value, accepted_answers: updated } as SynonymContent | GegenteilContent);
  }

  function handleAddAnswer() {
    const current = value.accepted_answers ?? [];
    onChange({ ...value, accepted_answers: [...current, ""] } as SynonymContent | GegenteilContent);
  }

  function handleRemoveAnswer(index: number) {
    const current = value.accepted_answers ?? [];
    onChange({
      ...value,
      accepted_answers: current.filter((_, i) => i !== index),
    } as SynonymContent | GegenteilContent);
  }

  function handleGapSentenceChange(newVal: string) {
    onChange({ ...(value as GegenteilContent), gap_sentence: newVal });
  }

  const label = type === "synonym" ? "Synonyme" : "Gegenteil";
  const typeLabel = type === "synonym" ? "Synonym" : "Gegenteil";

  return (
    <div style={FONT} className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: highlightColor, fontFamily: FONT.fontFamily }}
        >
          {label}
        </span>
        <span className="text-[12px] text-muted-foreground" style={FONT}>
          {type === "synonym"
            ? "Trouvez le synonyme du mot souligné"
            : "Trouvez le contraire du mot souligné"}
        </span>
      </div>

      {/* STEP 1: Input sentence */}
      {(editorState === "input" || editorState === "selecting" || editorState === "confirmed") && (
        <div className="space-y-2">
          <label className="block text-[12px] font-medium" style={FONT}>
            Phrase complète
          </label>
          <textarea
            className={inputCls + " resize-none"}
            rows={3}
            value={draftSentence}
            onChange={(e) => {
              setDraftSentence(e.target.value);
              if (editorState !== "input") {
                setEditorState("input");
              }
            }}
            placeholder={
              type === "gegenteil"
                ? "Tapez la phrase avec ……… pour le trou, ex: Während er Geld spart, wird Geld ………."
                : "Saisir la phrase complète ici…"
            }
            style={FONT}
            disabled={editorState === "selecting"}
          />
        </div>
      )}

      {/* STEP 2: Word selection mode trigger */}
      {editorState === "input" && (
        <div className="space-y-1">
          {type === "gegenteil" && (
            <p className="text-[11px] text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>
              Tapez la phrase avec ……… pour le trou et sélectionnez le mot de référence (le mot dont l&apos;élève doit trouver le contraire).
            </p>
          )}
          <button
            type="button"
            disabled={!draftSentence.trim()}
            onClick={() => setEditorState("selecting")}
            className="rounded-xl px-4 py-2 text-[12px] font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: highlightColor, fontFamily: FONT.fontFamily, fontSize: "12px" }}
          >
            Sélectionner le mot ✏️
          </button>
        </div>
      )}

      {/* STEP 2: Selecting mode — click a word */}
      {editorState === "selecting" && (
        <div className="space-y-2">
          <p className="text-[12px] text-muted-foreground" style={FONT}>
            Cliquez sur le mot cible :
          </p>
          <div
            className="p-3 rounded-xl border-2 border-dashed leading-relaxed"
            style={{ borderColor: highlightColor }}
          >
            {tokens.map((tok, i) => {
              const isWord = tok.trim().length > 0;
              if (!isWord) return <span key={i}>{tok}</span>;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectWord(tok)}
                  className="rounded px-0.5 transition hover:underline cursor-pointer"
                  style={{
                    ...FONT,
                    color: highlightColor,
                    fontWeight: 600,
                  }}
                >
                  {tok}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setEditorState("input")}
            className="text-[12px] text-muted-foreground underline hover:no-underline"
            style={FONT}
          >
            Annuler
          </button>
        </div>
      )}

      {/* STEP 3: Confirmed — show highlighted sentence + answers */}
      {editorState === "confirmed" && value.target_word && (
        <div className="space-y-4">
          {/* Highlighted sentence preview */}
          <div className="space-y-1">
            <label className="block text-[12px] font-medium" style={FONT}>
              Aperçu
            </label>
            <div
              className="p-3 rounded-xl border leading-relaxed"
              style={{ borderColor: highlightColor + "40", backgroundColor: highlightColor + "08" }}
            >
              {value.sentence.split(new RegExp(`(\\b${escapeRegex(value.target_word)}\\b)`, "i")).map((part, i) =>
                part.toLowerCase() === value.target_word.toLowerCase() ? (
                  <span
                    key={i}
                    className="font-semibold underline"
                    style={{ color: highlightColor, fontFamily: FONT.fontFamily, fontSize: "12px" }}
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i} style={FONT}>{part}</span>
                )
              )}
            </div>
          </div>

          {/* Gegenteil: the sentence already contains "………" — no separate gap sentence field needed */}

          {/* Accepted answers */}
          <div className="space-y-2">
            <label className="block text-[12px] font-medium" style={FONT}>
              Réponses acceptées
            </label>
            <div className="space-y-2">
              {(value.accepted_answers ?? []).map((ans, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    value={ans}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                    placeholder={`${typeLabel} ${i + 1}`}
                    style={FONT}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAnswer(i)}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddAnswer}
              className="text-[12px] font-medium transition hover:opacity-80"
              style={{ color: highlightColor, fontFamily: FONT.fontFamily, fontSize: "12px" }}
            >
              + Ajouter une réponse
            </button>
          </div>

          {/* Note */}
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
            Réponses exactes uniquement — pas de correction IA.
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="text-[12px] text-muted-foreground underline hover:no-underline"
            style={FONT}
          >
            Changer le mot cible
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminSynonymGegenteilEditor;

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
