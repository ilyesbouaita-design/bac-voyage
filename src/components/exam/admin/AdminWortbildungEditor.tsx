"use client";

import React, { useState } from "react";
import type {
  KompositumBildenContent,
  KompositumLoesenContent,
  WortableitungContent,
} from "@/lib/bac-types";

interface AdminWortbildungEditorProps {
  value: KompositumBildenContent | KompositumLoesenContent | WortableitungContent;
  onChange: (value: KompositumBildenContent | KompositumLoesenContent | WortableitungContent) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const inputCls =
  "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15";

const WORD_TYPES = ["Substantiv", "Verb", "Adjektiv"] as const;
type WordType = typeof WORD_TYPES[number];

// Determine which kompositum mode is active from value
function getKompositumMode(value: AdminWortbildungEditorProps["value"]): "bilden" | "loesen" | null {
  if (value.bac_type === "kompositum_bilden") return "bilden";
  if (value.bac_type === "kompositum_loesen") return "loesen";
  return null;
}

function defaultWortableitung(): WortableitungContent {
  return {
    bac_type: "wortableitung",
    source_type: "Substantiv",
    target_type: "Adjektiv",
    word: "",
    hint: "",
    accepted_answers: [],
  };
}

function defaultBilden(): KompositumBildenContent {
  return { bac_type: "kompositum_bilden", word1: "", word2: "", result: "" };
}

function defaultLoesen(): KompositumLoesenContent {
  return { bac_type: "kompositum_loesen", compound: "", word1: "", word2: "" };
}

// Extract wortableitung sub-state regardless of main type
// We keep a local parallel draft for Wortableitung since the prop value might be a Kompositum type
function useWortableitungDraft(initial: AdminWortbildungEditorProps["value"]) {
  const initWort: WortableitungContent =
    initial.bac_type === "wortableitung"
      ? (initial as WortableitungContent)
      : defaultWortableitung();
  return useState<WortableitungContent>(initWort);
}

export function AdminWortbildungEditor({
  value,
  onChange,
}: AdminWortbildungEditorProps) {
  // Kompositum type choice — null means show popup
  const [kompMode, setKompMode] = useState<"bilden" | "loesen" | null>(() =>
    getKompositumMode(value)
  );

  // Local draft for wortableitung (always present as a sub-section)
  const [wortDraft, setWortDraft] = useWortableitungDraft(value);

  // When the main value is a wortableitung, we show no kompositum section
  const isWortableitungOnly = value.bac_type === "wortableitung";

  // ---- Kompositum helpers ----
  function handleKompModeSelect(mode: "bilden" | "loesen") {
    setKompMode(mode);
    if (mode === "bilden") {
      onChange(defaultBilden());
    } else {
      onChange(defaultLoesen());
    }
  }

  function handleKompChange(field: string, val: string) {
    if (kompMode === "bilden") {
      onChange({ ...(value as KompositumBildenContent), [field]: val });
    } else {
      onChange({ ...(value as KompositumLoesenContent), [field]: val });
    }
  }

  function handleResetKomp() {
    setKompMode(null);
  }

  // ---- Wortableitung helpers ----
  function handleWortChange(updates: Partial<WortableitungContent>) {
    const updated = { ...wortDraft, ...updates };
    setWortDraft(updated);
    // If the main value is wortableitung, propagate up
    if (value.bac_type === "wortableitung") {
      onChange(updated);
    }
  }

  function handleWortAnswerChange(index: number, field: "article" | "word", val: string) {
    const updated = wortDraft.accepted_answers.map((a, i) =>
      i === index ? { ...a, [field]: val } : a
    );
    handleWortChange({ accepted_answers: updated });
  }

  function handleAddWortAnswer() {
    handleWortChange({ accepted_answers: [...wortDraft.accepted_answers, { article: "", word: "" }] });
  }

  function handleRemoveWortAnswer(index: number) {
    handleWortChange({
      accepted_answers: wortDraft.accepted_answers.filter((_, i) => i !== index),
    });
  }

  const wortInstruction = `Bilden Sie aus diesem ${wortDraft.source_type} das passende ${wortDraft.target_type}!`;

  return (
    <div style={FONT} className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#FFB200", fontFamily: FONT.fontFamily }}
        >
          Wortbildung
        </span>
      </div>

      {/* ===== KOMPOSITUM SECTION ===== */}
      {!isWortableitungOnly && (
        <section className="space-y-3">
          <h3 className="text-[12px] font-semibold" style={FONT}>
            Kompositum
          </h3>

          {/* Choice popup */}
          {kompMode === null && (
            <div className="grid grid-cols-2 gap-3">
              {/* Bilden card */}
              <button
                type="button"
                onClick={() => handleKompModeSelect("bilden")}
                className="rounded-2xl border-2 border-border bg-card p-4 text-left hover:border-[#6C4CE0] hover:shadow-md transition group"
              >
                <div
                  className="text-[13px] font-bold mb-1 group-hover:text-[#6C4CE0] transition"
                  style={FONT}
                >
                  Bilden Sie das Kompositum!
                </div>
                <div className="text-[11px] text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>
                  Deux mots → un mot composé
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ fontFamily: FONT.fontFamily, fontSize: "11px" }}>
                  <span className="px-2 py-0.5 rounded border border-border bg-secondary/40">Wort 1</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="px-2 py-0.5 rounded border border-border bg-secondary/40">Wort 2</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded bg-[#6C4CE0]/10 text-[#6C4CE0] border border-[#6C4CE0]/30">Ergebnis</span>
                </div>
              </button>

              {/* Lösen card */}
              <button
                type="button"
                onClick={() => handleKompModeSelect("loesen")}
                className="rounded-2xl border-2 border-border bg-card p-4 text-left hover:border-[#FF5A5F] hover:shadow-md transition group"
              >
                <div
                  className="text-[13px] font-bold mb-1 group-hover:text-[#FF5A5F] transition"
                  style={FONT}
                >
                  Lösen Sie das Kompositum!
                </div>
                <div className="text-[11px] text-muted-foreground" style={{ ...FONT, fontSize: "11px" }}>
                  Un mot composé → deux mots
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ fontFamily: FONT.fontFamily, fontSize: "11px" }}>
                  <span className="px-2 py-0.5 rounded bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/30">Kompositum</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded border border-border bg-secondary/40">Wort 1</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="px-2 py-0.5 rounded border border-border bg-secondary/40">Wort 2</span>
                </div>
              </button>
            </div>
          )}

          {/* Bilden editor */}
          {kompMode === "bilden" && (
            <div className="space-y-3 p-4 rounded-xl border border-[#6C4CE0]/20 bg-[#6C4CE0]/03">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#6C4CE0]" style={FONT}>
                  Bilden Sie das Kompositum!
                </span>
                <button
                  type="button"
                  onClick={handleResetKomp}
                  className="text-[11px] text-muted-foreground underline hover:no-underline"
                  style={{ ...FONT, fontSize: "11px" }}
                >
                  Changer le type
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" style={{ ...FONT, fontSize: "11px" }}>Wort 1</label>
                  <input
                    className={inputCls}
                    value={(value as KompositumBildenContent).word1 ?? ""}
                    onChange={(e) => handleKompChange("word1", e.target.value)}
                    placeholder="Wort 1"
                    style={FONT}
                  />
                </div>
                <span className="text-muted-foreground pt-5" style={FONT}>+</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" style={{ ...FONT, fontSize: "11px" }}>Wort 2</label>
                  <input
                    className={inputCls}
                    value={(value as KompositumBildenContent).word2 ?? ""}
                    onChange={(e) => handleKompChange("word2", e.target.value)}
                    placeholder="Wort 2"
                    style={FONT}
                  />
                </div>
                <span className="text-muted-foreground pt-5" style={FONT}>→</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" style={{ ...FONT, fontSize: "11px" }}>Ergebnis</label>
                  <input
                    className="w-full rounded-xl border border-[#6C4CE0]/40 bg-[#6C4CE0]/5 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
                    value={(value as KompositumBildenContent).result ?? ""}
                    onChange={(e) => handleKompChange("result", e.target.value)}
                    placeholder="Kompositum"
                    style={FONT}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lösen editor */}
          {kompMode === "loesen" && (
            <div className="space-y-3 p-4 rounded-xl border border-[#FF5A5F]/20 bg-[#FF5A5F]/03">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#FF5A5F]" style={FONT}>
                  Lösen Sie das Kompositum!
                </span>
                <button
                  type="button"
                  onClick={handleResetKomp}
                  className="text-[11px] text-muted-foreground underline hover:no-underline"
                  style={{ ...FONT, fontSize: "11px" }}
                >
                  Changer le type
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" style={{ ...FONT, fontSize: "11px" }}>Kompositum</label>
                  <input
                    className="w-full rounded-xl border border-[#FF5A5F]/40 bg-[#FF5A5F]/5 px-3 py-2 text-[12px] outline-none transition focus:border-[#FF5A5F] focus:ring-4 focus:ring-[#FF5A5F]/15"
                    value={(value as KompositumLoesenContent).compound ?? ""}
                    onChange={(e) => handleKompChange("compound", e.target.value)}
                    placeholder="Kompositum"
                    style={FONT}
                  />
                </div>
                <span className="text-muted-foreground pt-5" style={FONT}>→</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" style={{ ...FONT, fontSize: "11px" }}>Wort 1</label>
                  <input
                    className={inputCls}
                    value={(value as KompositumLoesenContent).word1 ?? ""}
                    onChange={(e) => handleKompChange("word1", e.target.value)}
                    placeholder="Wort 1"
                    style={FONT}
                  />
                </div>
                <span className="text-muted-foreground pt-5" style={FONT}>+</span>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1" style={{ ...FONT, fontSize: "11px" }}>Wort 2</label>
                  <input
                    className={inputCls}
                    value={(value as KompositumLoesenContent).word2 ?? ""}
                    onChange={(e) => handleKompChange("word2", e.target.value)}
                    placeholder="Wort 2"
                    style={FONT}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Divider between Kompositum and Wortableitung */}
      {!isWortableitungOnly && <div className="border-t border-border" />}

      {/* ===== WORTABLEITUNG SECTION ===== */}
      <section className="space-y-4">
        <h3 className="text-[12px] font-semibold" style={FONT}>
          Wortableitung
        </h3>

        {/* Auto-generated instruction from dropdowns */}
        <div className="space-y-2">
          <label className="block text-[12px] font-medium" style={FONT}>
            Consigne (auto-générée)
          </label>
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl border border-border bg-secondary/20">
            <span style={FONT}>Bilden Sie aus diesem</span>
            <select
              className="rounded-lg border border-border bg-card px-2 py-1 text-[12px] outline-none focus:border-[#6C4CE0]"
              value={wortDraft.source_type}
              onChange={(e) => handleWortChange({ source_type: e.target.value as WordType })}
              style={FONT}
            >
              {WORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span style={FONT}>das passende</span>
            <select
              className="rounded-lg border border-border bg-card px-2 py-1 text-[12px] outline-none focus:border-[#6C4CE0]"
              value={wortDraft.target_type}
              onChange={(e) => handleWortChange({ target_type: e.target.value as WordType })}
              style={FONT}
            >
              {WORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span style={FONT}>!</span>
          </div>
          {/* Live preview */}
          <p
            className="text-[11px] font-medium italic"
            style={{ color: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "11px" }}
          >
            → {wortInstruction}
          </p>
        </div>

        {/* Ausgangswort */}
        <div className="space-y-1">
          <label className="block text-[12px] font-medium" style={FONT}>
            Ausgangswort
          </label>
          <input
            className={inputCls}
            value={wortDraft.word}
            onChange={(e) => handleWortChange({ word: e.target.value })}
            placeholder="Das Ausgangswort eingeben…"
            style={FONT}
          />
        </div>

        {/* Hint */}
        <div className="space-y-1">
          <label className="block text-[12px] font-medium" style={FONT}>
            Indice{" "}
            <span className="text-muted-foreground font-normal">(optionnel)</span>
          </label>
          <input
            className={inputCls}
            value={wortDraft.hint ?? ""}
            onChange={(e) => handleWortChange({ hint: e.target.value })}
            placeholder="ex. d……"
            style={FONT}
          />
        </div>

        {/* Accepted answers */}
        <div className="space-y-2">
          <label className="block text-[12px] font-medium" style={FONT}>
            Akzeptierte Antworten
          </label>
          <div className="space-y-2">
            {wortDraft.accepted_answers.map((ans, i) => (
              <div key={i} className="flex items-center gap-2">
                {/* Article (60px) */}
                <input
                  className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
                  style={{ width: "60px", ...FONT }}
                  value={ans.article}
                  onChange={(e) => handleWortAnswerChange(i, "article", e.target.value)}
                  placeholder="Art."
                />
                {/* Word */}
                <input
                  className={inputCls + " flex-1"}
                  value={ans.word}
                  onChange={(e) => handleWortAnswerChange(i, "word", e.target.value)}
                  placeholder={`Antwort ${i + 1}`}
                  style={FONT}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveWortAnswer(i)}
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
            onClick={handleAddWortAnswer}
            className="text-[12px] font-medium transition hover:opacity-80"
            style={{ color: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "12px" }}
          >
            + Ajouter un mot
          </button>

          {/* Article note */}
          <div
            className="rounded-xl px-3 py-2 text-[11px]"
            style={{
              backgroundColor: "#0FB6A315",
              borderLeft: "3px solid #0FB6A3",
              fontFamily: FONT.fontFamily,
              fontSize: "11px",
              color: "#065f46",
            }}
          >
            Laissez l'article vide si non applicable. L'étudiant verra l'initiale comme indice.
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminWortbildungEditor;
