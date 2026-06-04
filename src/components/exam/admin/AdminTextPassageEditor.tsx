import { useState } from "react";
import type { VocabEntry } from "@/lib/bac-types";

const tmr: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

const inputCls =
  "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15";

interface AdminTextPassageEditorProps {
  passage: string;
  onPassageChange: (passage: string) => void;
  vocab: VocabEntry[];
  onVocabChange: (vocab: VocabEntry[]) => void;
}

export function AdminTextPassageEditor({
  passage,
  onPassageChange,
  vocab,
  onVocabChange,
}: AdminTextPassageEditorProps) {
  function updateVocab(index: number, field: keyof VocabEntry, value: string) {
    const updated = [...vocab];
    updated[index] = { ...updated[index], [field]: value };
    onVocabChange(updated);
  }

  function addVocab() {
    onVocabChange([...vocab, { german: "", arabic: "", french: "" }]);
  }

  function removeVocab(index: number) {
    onVocabChange(vocab.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5" style={tmr}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0FB6A3]/10 text-[#0FB6A3]"
        >
          DE
        </span>
        <h3 className="font-bold" style={{ fontSize: "13px", ...tmr }}>
          Texte de l'examen
        </h3>
      </div>

      {/* Passage textarea */}
      <label className="block mb-1 text-[12px] font-semibold text-foreground/80" style={tmr}>
        Passage en allemand
      </label>
      <textarea
        className={`${inputCls} min-h-[180px] leading-[1.75]`}
        style={{ ...tmr, background: "color-mix(in srgb, #0FB6A3 4%, var(--card))" }}
        value={passage}
        onChange={(e) => onPassageChange(e.target.value)}
        placeholder="Schreiben Sie den deutschen Text hier..."
      />

      {/* Vocabulary section */}
      <div className="mt-5 pt-4 border-t border-dashed border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-[12px]" style={tmr}>
            Vocabulaire / Glossaire
          </h4>
          <span className="text-[10px] text-muted-foreground">
            {vocab.length} mot{vocab.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Column headers */}
        {vocab.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground" style={tmr}>
              Deutsch
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground text-right" style={{ ...tmr, direction: "rtl", textAlign: "right" }}>
              العربية
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground" style={tmr}>
              Français
            </span>
            <span />
          </div>
        )}

        {/* Vocab rows */}
        {vocab.map((entry, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 mb-2">
            <input
              className={inputCls}
              style={tmr}
              value={entry.german}
              onChange={(e) => updateVocab(i, "german", e.target.value)}
              placeholder="Wort..."
            />
            <input
              className={inputCls}
              style={{ ...tmr, direction: "rtl", textAlign: "right" }}
              value={entry.arabic}
              onChange={(e) => updateVocab(i, "arabic", e.target.value)}
              placeholder="...الترجمة"
              dir="rtl"
            />
            <input
              className={inputCls}
              style={tmr}
              value={entry.french}
              onChange={(e) => updateVocab(i, "french", e.target.value)}
              placeholder="Traduction..."
            />
            <button
              onClick={() => removeVocab(i)}
              className="w-7 h-7 grid place-items-center rounded-lg text-muted-foreground hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/10 transition-colors"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={addVocab}
          className="w-full py-2 rounded-xl border border-dashed border-[#0FB6A3]/40 text-[#0FB6A3] text-[11px] font-medium hover:bg-[#0FB6A3]/5 transition-colors mt-1"
          style={tmr}
        >
          + Ajouter un mot de vocabulaire
        </button>
      </div>
    </div>
  );
}
