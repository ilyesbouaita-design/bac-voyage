"use client";

import { useState, useEffect } from "react";
import type { ErgaenzenContent } from "@/lib/bac-types";

interface AdminErgaenzenEditorProps {
  value: ErgaenzenContent;
  onChange: (value: ErgaenzenContent) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

type SentenceMode = "input" | "selecting" | "confirmed";

interface SentenceState {
  text: string;
  blank_word: string;
  mode: SentenceMode;
  pendingWord: string; // word highlighted during selecting phase
}

const emptySentence = (): SentenceState => ({
  text: "",
  blank_word: "",
  mode: "input",
  pendingWord: "",
});

function tokenize(text: string): string[] {
  // Split on spaces while preserving punctuation attached to tokens
  return text.split(/\s+/).filter(Boolean);
}

export function AdminErgaenzenEditor({
  value,
  onChange,
}: AdminErgaenzenEditorProps) {
  const [sentences, setSentences] = useState<SentenceState[]>(() => {
    if (value.sentences.length > 0) {
      return value.sentences.map((s) => ({
        text: s.text,
        blank_word: s.blank_word,
        mode: s.blank_word ? ("confirmed" as SentenceMode) : ("input" as SentenceMode),
        pendingWord: "",
      }));
    }
    return [emptySentence()];
  });

  useEffect(() => {
    onChange({
      bac_type: "ergaenzen",
      sentences: sentences
        .filter((s) => s.mode === "confirmed" && s.text)
        .map((s) => ({ text: s.text, blank_word: s.blank_word })),
    });
  }, [sentences]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSentence = (index: number, patch: Partial<SentenceState>) => {
    setSentences((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const startSelecting = (index: number) => {
    if (!sentences[index].text.trim()) return;
    updateSentence(index, { mode: "selecting", pendingWord: "" });
  };

  const selectWord = (index: number, word: string) => {
    updateSentence(index, { pendingWord: word });
  };

  const confirmSelection = (index: number) => {
    const pending = sentences[index].pendingWord;
    if (!pending) return;
    updateSentence(index, { mode: "confirmed", blank_word: pending, pendingWord: "" });
  };

  const cancelSelection = (index: number) => {
    updateSentence(index, { mode: "input", pendingWord: "" });
  };

  const editSentence = (index: number) => {
    updateSentence(index, { mode: "input", blank_word: "", pendingWord: "" });
  };

  const removeSentence = (index: number) => {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  };

  const addSentence = () => {
    if (sentences.length >= 6) return;
    setSentences((prev) => [...prev, emptySentence()]);
  };

  // All confirmed words for the word bank
  const wordBank = sentences
    .filter((s) => s.mode === "confirmed" && s.blank_word)
    .map((s) => s.blank_word);

  return (
    <div style={FONT} className="space-y-4">
      {/* Word bank preview */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
        <p className="font-semibold text-foreground/80 mb-2" style={FONT}>
          Banque de mots
        </p>
        {wordBank.length === 0 ? (
          <p className="text-foreground/40 italic" style={FONT}>
            Aucun mot sélectionné pour l&apos;instant.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1 font-semibold text-white"
                style={{ ...FONT, background: "#0FB6A3" }}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sentence editors */}
      {sentences.map((sent, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card shadow-sm p-5"
          style={{
            borderLeftWidth: "4px",
            borderLeftColor: sent.mode === "confirmed" ? "#0FB6A3" : "#6C4CE0",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  ...FONT,
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  background: sent.mode === "confirmed" ? "#0FB6A3" : "#6C4CE0",
                  fontSize: "11px",
                }}
              >
                {i + 1}
              </span>
              <span className="font-semibold text-foreground/70" style={FONT}>
                Phrase {i + 1}
              </span>
              {sent.mode === "confirmed" && (
                <span
                  className="rounded-full px-2 py-0.5 text-white"
                  style={{ ...FONT, background: "#0FB6A3", fontSize: "10px" }}
                >
                  confirmé
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeSentence(i)}
              className="flex items-center justify-center rounded-full border border-border text-foreground/40 hover:text-[#FF5A5F] hover:border-[#FF5A5F] transition"
              style={{ width: 24, height: 24, ...FONT }}
              title="Supprimer"
            >
              ✕
            </button>
          </div>

          {/* INPUT MODE */}
          {sent.mode === "input" && (
            <div>
              <label className="block mb-1 font-semibold text-foreground/80" style={FONT}>
                Phrase complète
              </label>
              <input
                type="text"
                value={sent.text}
                onChange={(e) => updateSentence(i, { text: e.target.value })}
                placeholder="Saisir la phrase complète…"
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 mb-3"
                style={FONT}
              />
              <button
                type="button"
                onClick={() => startSelecting(i)}
                disabled={!sent.text.trim()}
                className="rounded-xl border border-[#6C4CE0] px-4 py-1.5 text-[#6C4CE0] font-semibold hover:bg-[#6C4CE0]/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={FONT}
              >
                Sélectionner le mot ✏️
              </button>
            </div>
          )}

          {/* SELECTING MODE */}
          {sent.mode === "selecting" && (
            <div>
              <p className="mb-2 text-foreground/60 italic" style={FONT}>
                Cliquez sur le mot à masquer :
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4 p-3 rounded-xl bg-secondary/30 border border-border">
                {tokenize(sent.text).map((word, wi) => {
                  const clean = word.replace(/[.,;:!?"""''()\[\]]/g, "");
                  const isSelected = sent.pendingWord === clean;
                  return (
                    <button
                      key={wi}
                      type="button"
                      onClick={() => selectWord(i, clean)}
                      className="rounded px-2 py-0.5 transition font-medium"
                      style={{
                        ...FONT,
                        background: isSelected ? "#6C4CE0" : "transparent",
                        color: isSelected ? "#fff" : undefined,
                        border: isSelected ? "1px solid #6C4CE0" : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              {sent.pendingWord && (
                <p className="mb-3 text-foreground/60" style={FONT}>
                  Mot sélectionné :{" "}
                  <strong
                    className="rounded px-2 py-0.5 text-white"
                    style={{ background: "#6C4CE0" }}
                  >
                    {sent.pendingWord}
                  </strong>
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => confirmSelection(i)}
                  disabled={!sent.pendingWord}
                  className="rounded-xl px-4 py-1.5 font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ ...FONT, background: "#22c55e" }}
                >
                  ✓ Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => cancelSelection(i)}
                  className="rounded-xl border border-border px-4 py-1.5 font-semibold text-foreground/60 hover:border-[#FF5A5F] hover:text-[#FF5A5F] transition"
                  style={FONT}
                >
                  ✕ Annuler
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMED MODE */}
          {sent.mode === "confirmed" && (
            <div>
              <p className="mb-2 text-foreground/60" style={FONT}>
                Phrase avec mot masqué :
              </p>
              <div className="flex flex-wrap gap-1 p-3 rounded-xl bg-secondary/30 border border-border mb-3">
                {tokenize(sent.text).map((word, wi) => {
                  const clean = word.replace(/[.,;:!?"""''()\[\]]/g, "");
                  const punct = word.slice(clean.length);
                  const isBlank = clean === sent.blank_word;
                  return (
                    <span
                      key={wi}
                      style={{
                        ...FONT,
                        background: isBlank ? "#0FB6A3" : "transparent",
                        color: isBlank ? "#fff" : undefined,
                        borderRadius: isBlank ? "4px" : undefined,
                        padding: isBlank ? "0 6px" : undefined,
                        fontWeight: isBlank ? 600 : undefined,
                      }}
                    >
                      {isBlank ? sent.blank_word : clean}
                      {punct}
                    </span>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => editSentence(i)}
                className="text-[#6C4CE0] underline hover:no-underline"
                style={FONT}
              >
                Modifier
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add sentence button */}
      <button
        type="button"
        onClick={addSentence}
        disabled={sentences.length >= 6}
        className="w-full rounded-2xl border-2 border-dashed border-border py-3 font-semibold text-foreground/50 hover:border-[#6C4CE0] hover:text-[#6C4CE0] transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={FONT}
      >
        + Ajouter une phrase {sentences.length >= 6 && "(max 6)"}
      </button>
    </div>
  );
}

export default AdminErgaenzenEditor;
