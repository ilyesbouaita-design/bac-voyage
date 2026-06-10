"use client";

import React, { useState, useEffect, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface BlockEditorProps {
  type: string;
  content: any;
  onChange: (content: any) => void;
  title: string;
  onTitleChange: (title: string) => void;
  points: number;
  onPointsChange: (points: number) => void;
}

interface SubEditorProps {
  content: any;
  onChange: (content: any) => void;
}

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

const VIOLET = "#6C4CE0";
const CORAL = "#FF5A5F";
const GOLD = "#FFB200";
const TEAL = "#0FB6A3";

const MEDIA_TYPES = ["youtube", "image", "audio", "pdf"];

const uid = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// =============================================================================
// SHARED INLINE STYLES
// =============================================================================

const FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, serif",
  fontSize: 12,
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(0,0,0,0.72)",
  marginBottom: 4,
  display: "block",
};

const INPUT: React.CSSProperties = {
  ...FONT,
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  backgroundColor: "rgba(0,0,0,0.04)",
  padding: "8px 12px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const TEXTAREA: React.CSSProperties = {
  ...INPUT,
  minHeight: 64,
  resize: "vertical",
};

const CARD: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  padding: 12,
  marginBottom: 8,
  position: "relative",
};

const ADD_BTN: React.CSSProperties = {
  ...FONT,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  borderRadius: 12,
  border: `1.5px dashed ${TEAL}`,
  background: "transparent",
  color: TEAL,
  cursor: "pointer",
  fontWeight: 600,
  transition: "background 0.15s",
};

const REMOVE_BTN: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.45)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
  transition: "background 0.15s, color 0.15s",
};

const SECTION_TITLE: React.CSSProperties = {
  ...FONT,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: VIOLET,
  marginBottom: 8,
  marginTop: 16,
};

const ROW: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 8,
};

const HALF: React.CSSProperties = {
  flex: 1,
};

// =============================================================================
// SMALL REUSABLE UI PIECES
// =============================================================================

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...INPUT,
        ...(focused
          ? { borderColor: VIOLET, boxShadow: `0 0 0 4px ${VIOLET}26` }
          : {}),
        ...(props.style || {}),
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

function FocusTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...TEXTAREA,
        ...(focused
          ? { borderColor: VIOLET, boxShadow: `0 0 0 4px ${VIOLET}26` }
          : {}),
        ...(props.style || {}),
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <label style={{ ...LABEL, ...style }}>{children}</label>;
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={{
        ...ADD_BTN,
        background: hovered ? `${TEAL}0F` : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      + {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={{
        ...REMOVE_BTN,
        background: hovered ? `${CORAL}18` : "rgba(0,0,0,0.06)",
        color: hovered ? CORAL : "rgba(0,0,0,0.45)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      title="Supprimer"
    >
      x
    </button>
  );
}

function FieldGroup({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 10, ...style }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function InstructionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldGroup label="Instruction">
      <FocusTextarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Consigne pour cet exercice..."
        rows={2}
      />
    </FieldGroup>
  );
}

// =============================================================================
// HOOK: useListState
// Manages a list of items synced to content via onChange.
// =============================================================================

function useListState<T>(
  contentKey: string,
  content: any,
  onChange: (c: any) => void,
  defaultItem: () => T
) {
  const [items, setItems] = useState<T[]>(() => {
    const raw = content?.[contentKey];
    return Array.isArray(raw) ? raw : [];
  });

  useEffect(() => {
    const raw = content?.[contentKey];
    if (Array.isArray(raw)) {
      setItems(raw);
    }
  }, [content, contentKey]);

  const update = useCallback(
    (next: T[]) => {
      setItems(next);
      onChange({ ...content, [contentKey]: next });
    },
    [content, contentKey, onChange]
  );

  const add = useCallback(() => {
    update([...items, defaultItem()]);
  }, [items, update, defaultItem]);

  const remove = useCallback(
    (idx: number) => {
      update(items.filter((_, i) => i !== idx));
    },
    [items, update]
  );

  const patch = useCallback(
    (idx: number, partial: Partial<T>) => {
      const next = items.map((it, i) =>
        i === idx ? { ...it, ...partial } : it
      );
      update(next);
    },
    [items, update]
  );

  return { items, update, add, remove, patch };
}

// =============================================================================
// 1. QCM EDITOR — Multiple Choice
// =============================================================================

function QcmEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultQuestion = useCallback(
    () => ({
      id: uid(),
      text: "",
      options: ["", "", "", ""],
      correct: 0,
    }),
    []
  );

  const { items: questions, add, remove, patch } = useListState(
    "questions",
    c,
    onChange,
    defaultQuestion
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />

      {/* Timer toggle */}
      <div style={{ ...ROW, alignItems: "center", marginBottom: 12 }}>
        <label style={{ ...FONT, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!c.timer}
            onChange={(e) =>
              setField("timer", e.target.checked ? c.timerSeconds || 30 : null)
            }
          />
          Minuteur
        </label>
        {c.timer && (
          <FocusInput
            type="number"
            min={5}
            value={c.timerSeconds || 30}
            onChange={(e) => {
              const s = +e.target.value;
              setField("timerSeconds", s);
              setField("timer", s);
            }}
            style={{ width: 70 }}
            placeholder="sec"
          />
        )}
      </div>

      <div style={SECTION_TITLE}>Questions</div>
      {questions.map((q: any, qi: number) => (
        <div key={q.id || qi} style={CARD}>
          <RemoveButton onClick={() => remove(qi)} />
          <FieldGroup label={`Question ${qi + 1}`}>
            <FocusInput
              value={q.text || ""}
              onChange={(e) => patch(qi, { text: e.target.value })}
              placeholder="Texte de la question..."
            />
          </FieldGroup>
          <Label>Options (cochez la bonne reponse)</Label>
          {(q.options || ["", "", "", ""]).map((opt: string, oi: number) => (
            <div key={oi} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <input
                type="radio"
                name={`qcm-correct-${q.id || qi}`}
                checked={q.correct === oi}
                onChange={() => patch(qi, { correct: oi })}
                style={{ accentColor: VIOLET }}
              />
              <FocusInput
                value={opt}
                onChange={(e) => {
                  const opts = [...(q.options || ["", "", "", ""])];
                  opts[oi] = e.target.value;
                  patch(qi, { options: opts });
                }}
                placeholder={`Option ${oi + 1}`}
                style={{ flex: 1 }}
              />
            </div>
          ))}
        </div>
      ))}
      <AddButton label="Ajouter une question" onClick={add} />
    </div>
  );
}

// =============================================================================
// 2. DRAG DROP EDITOR — Word ordering
// =============================================================================

function DragDropEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultSentence = useCallback(
    () => ({ id: uid(), text: "", distractors: "" }),
    []
  );

  const { items: sentences, add, remove, patch } = useListState(
    "sentences",
    c,
    onChange,
    defaultSentence
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Phrases</div>
      {sentences.map((s: any, i: number) => (
        <div key={s.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <FieldGroup label={`Phrase correcte ${i + 1}`}>
            <FocusInput
              value={s.text || ""}
              onChange={(e) => patch(i, { text: e.target.value })}
              placeholder="Tapez la phrase dans le bon ordre..."
            />
          </FieldGroup>
          <FieldGroup label="Mots distracteurs (separes par des virgules)">
            <FocusInput
              value={s.distractors || ""}
              onChange={(e) => patch(i, { distractors: e.target.value })}
              placeholder="aussi, souvent, parfois"
            />
          </FieldGroup>
        </div>
      ))}
      <AddButton label="Ajouter une phrase" onClick={add} />
    </div>
  );
}

// =============================================================================
// 3. CLICK PASTE EDITOR — Fill gaps from word bank
// =============================================================================

function ClickPasteEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultSentence = useCallback(
    () => ({ id: uid(), text: "" }),
    []
  );

  const { items: sentences, add, remove, patch } = useListState(
    "sentences",
    c,
    onChange,
    defaultSentence
  );

  const renderPreview = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]*\])/g);
    return (
      <div
        style={{
          ...FONT,
          fontSize: 11,
          color: "rgba(0,0,0,0.55)",
          marginTop: 4,
          padding: "4px 8px",
          background: "rgba(0,0,0,0.03)",
          borderRadius: 8,
        }}
      >
        Apercu:{" "}
        {parts.map((p, i) =>
          p.startsWith("[") ? (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: 60,
                height: 16,
                borderBottom: `2px dashed ${VIOLET}`,
                marginInline: 2,
                verticalAlign: "bottom",
              }}
            />
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Phrases</div>
      <div
        style={{
          ...FONT,
          fontSize: 10,
          color: "rgba(0,0,0,0.45)",
          marginBottom: 8,
        }}
      >
        Utilisez des [crochets] pour marquer les trous. Exemple: "Ich [habe]
        einen Hund."
      </div>
      {sentences.map((s: any, i: number) => (
        <div key={s.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <FieldGroup label={`Phrase ${i + 1}`}>
            <FocusInput
              value={s.text || ""}
              onChange={(e) => patch(i, { text: e.target.value })}
              placeholder="Ich [habe] einen Hund."
            />
            {renderPreview(s.text)}
          </FieldGroup>
        </div>
      ))}
      <AddButton label="Ajouter une phrase" onClick={add} />
    </div>
  );
}

// =============================================================================
// 4. FILL GAPS EDITOR — Type in blanks
// =============================================================================

function FillGapsEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultSentence = useCallback(
    () => ({ id: uid(), text: "", hint: "" }),
    []
  );

  const { items: sentences, add, remove, patch } = useListState(
    "sentences",
    c,
    onChange,
    defaultSentence
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Phrases</div>
      <div
        style={{
          ...FONT,
          fontSize: 10,
          color: "rgba(0,0,0,0.45)",
          marginBottom: 8,
        }}
      >
        Utilisez des [crochets] pour les reponses. Exemple: "Er [geht] in die
        Schule."
      </div>
      {sentences.map((s: any, i: number) => (
        <div key={s.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <FieldGroup label={`Phrase ${i + 1}`}>
            <FocusInput
              value={s.text || ""}
              onChange={(e) => patch(i, { text: e.target.value })}
              placeholder="Er [geht] in die Schule."
            />
          </FieldGroup>
          <FieldGroup label="Indice">
            <FocusInput
              value={s.hint || ""}
              onChange={(e) => patch(i, { hint: e.target.value })}
              placeholder="Verbe de mouvement..."
            />
          </FieldGroup>
        </div>
      ))}
      <AddButton label="Ajouter une phrase" onClick={add} />
    </div>
  );
}

// =============================================================================
// 5. CATEGORIZE EDITOR — Sort into groups
// =============================================================================

const CATEGORY_COLORS = [VIOLET, CORAL, GOLD, TEAL];

function CategorizeEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultCategory = useCallback(
    () => ({
      id: uid(),
      name: "",
      color: CATEGORY_COLORS[c.categories?.length || 0] || VIOLET,
    }),
    [c.categories]
  );

  const {
    items: categories,
    add: addCat,
    remove: removeCat,
    patch: patchCat,
  } = useListState("categories", c, onChange, defaultCategory);

  const defaultItem = useCallback(
    () => ({ id: uid(), text: "", category: "" }),
    []
  );

  const {
    items,
    add: addItem,
    remove: removeItem,
    patch: patchItem,
  } = useListState("items", c, onChange, defaultItem);

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />

      <div style={SECTION_TITLE}>Categories (2-4)</div>
      {categories.map((cat: any, i: number) => (
        <div key={cat.id || i} style={{ ...CARD, borderLeft: `3px solid ${cat.color || VIOLET}` }}>
          {categories.length > 2 && (
            <RemoveButton onClick={() => removeCat(i)} />
          )}
          <div style={ROW}>
            <div style={HALF}>
              <Label>Nom</Label>
              <FocusInput
                value={cat.name || ""}
                onChange={(e) => patchCat(i, { name: e.target.value })}
                placeholder="Nom de la categorie"
              />
            </div>
            <div style={{ width: 80 }}>
              <Label>Couleur</Label>
              <input
                type="color"
                value={cat.color || VIOLET}
                onChange={(e) => patchCat(i, { color: e.target.value })}
                style={{ width: "100%", height: 34, border: "none", background: "none", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      ))}
      {categories.length < 4 && (
        <AddButton label="Ajouter une categorie" onClick={addCat} />
      )}

      <div style={{ ...SECTION_TITLE, marginTop: 20 }}>Items</div>
      {items.map((it: any, i: number) => (
        <div key={it.id || i} style={CARD}>
          <RemoveButton onClick={() => removeItem(i)} />
          <div style={ROW}>
            <div style={{ flex: 2 }}>
              <Label>Texte</Label>
              <FocusInput
                value={it.text || ""}
                onChange={(e) => patchItem(i, { text: e.target.value })}
                placeholder="Texte de l'item"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Categorie</Label>
              <select
                value={it.category || ""}
                onChange={(e) => patchItem(i, { category: e.target.value })}
                style={{ ...INPUT, cursor: "pointer" }}
              >
                <option value="">--</option>
                {categories.map((cat: any, ci: number) => (
                  <option key={ci} value={cat.name}>
                    {cat.name || `Categorie ${ci + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter un item" onClick={addItem} />
    </div>
  );
}

// =============================================================================
// 6. MATCH ARROWS EDITOR — Draw lines
// =============================================================================

function MatchArrowsEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultPair = useCallback(
    () => ({ id: uid(), left: "", right: "" }),
    []
  );

  const { items: pairs, add, remove, patch } = useListState(
    "pairs",
    c,
    onChange,
    defaultPair
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Paires</div>
      {pairs.map((p: any, i: number) => (
        <div key={p.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={HALF}>
              <Label>Gauche</Label>
              <FocusInput
                value={p.left || ""}
                onChange={(e) => patch(i, { left: e.target.value })}
                placeholder="Terme gauche"
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 4px 0",
                color: "rgba(0,0,0,0.25)",
                fontSize: 16,
              }}
            >
              &harr;
            </div>
            <div style={HALF}>
              <Label>Droite</Label>
              <FocusInput
                value={p.right || ""}
                onChange={(e) => patch(i, { right: e.target.value })}
                placeholder="Terme droit"
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter une paire" onClick={add} />
    </div>
  );
}

// =============================================================================
// 7. HANGMAN EDITOR — Guess the word
// =============================================================================

function HangmanEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultWord = useCallback(
    () => ({ id: uid(), word: "", hint: "" }),
    []
  );

  const { items: words, add, remove, patch } = useListState(
    "words",
    c,
    onChange,
    defaultWord
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Mots</div>
      {words.map((w: any, i: number) => (
        <div key={w.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={HALF}>
              <Label>Mot</Label>
              <FocusInput
                value={w.word || ""}
                onChange={(e) => patch(i, { word: e.target.value })}
                placeholder="Schmetterling"
              />
            </div>
            <div style={HALF}>
              <Label>Indice</Label>
              <FocusInput
                value={w.hint || ""}
                onChange={(e) => patch(i, { hint: e.target.value })}
                placeholder="Un insecte qui vole..."
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter un mot" onClick={add} />
    </div>
  );
}

// =============================================================================
// 8. MATCH PICTURE EDITOR — Image to word
// =============================================================================

function MatchPictureEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultPair = useCallback(
    () => ({ id: uid(), imageUrl: "", word: "" }),
    []
  );

  const { items: pairs, add, remove, patch } = useListState(
    "pairs",
    c,
    onChange,
    defaultPair
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Paires image / mot</div>
      {pairs.map((p: any, i: number) => (
        <div key={p.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={{ flex: 2 }}>
              <Label>URL de l'image</Label>
              <FocusInput
                value={p.imageUrl || ""}
                onChange={(e) => patch(i, { imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt=""
                  style={{
                    marginTop: 4,
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Label>Mot</Label>
              <FocusInput
                value={p.word || ""}
                onChange={(e) => patch(i, { word: e.target.value })}
                placeholder="der Hund"
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter une paire" onClick={add} />
    </div>
  );
}

// =============================================================================
// 9. MEMORY EDITOR — Flip card pairs
// =============================================================================

function MemoryEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultPair = useCallback(
    () => ({ id: uid(), front: "", back: "" }),
    []
  );

  const { items: pairs, add, remove, patch } = useListState(
    "pairs",
    c,
    onChange,
    defaultPair
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Paires de cartes</div>
      {pairs.map((p: any, i: number) => (
        <div key={p.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={HALF}>
              <Label>Recto</Label>
              <FocusInput
                value={p.front || ""}
                onChange={(e) => patch(i, { front: e.target.value })}
                placeholder="der Hund"
              />
            </div>
            <div style={HALF}>
              <Label>Verso</Label>
              <FocusInput
                value={p.back || ""}
                onChange={(e) => patch(i, { back: e.target.value })}
                placeholder="le chien"
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter une paire" onClick={add} />
    </div>
  );
}

// =============================================================================
// 10. FLASHCARD EDITOR — Swipe cards
// =============================================================================

function FlashcardEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultCard = useCallback(
    () => ({ id: uid(), front: "", back: "" }),
    []
  );

  const { items: cards, add, remove, patch } = useListState(
    "cards",
    c,
    onChange,
    defaultCard
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Cartes</div>
      {cards.map((card: any, i: number) => (
        <div key={card.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={HALF}>
              <Label>Recto</Label>
              <FocusInput
                value={card.front || ""}
                onChange={(e) => patch(i, { front: e.target.value })}
                placeholder="Guten Morgen"
              />
            </div>
            <div style={HALF}>
              <Label>Verso</Label>
              <FocusInput
                value={card.back || ""}
                onChange={(e) => patch(i, { back: e.target.value })}
                placeholder="Bonjour"
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter une carte" onClick={add} />
    </div>
  );
}

// =============================================================================
// 11. SENTENCE BUILDER EDITOR — Tap words in order
// =============================================================================

function SentenceBuilderEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultSentence = useCallback(
    () => ({ id: uid(), text: "", extraWords: "" }),
    []
  );

  const { items: sentences, add, remove, patch } = useListState(
    "sentences",
    c,
    onChange,
    defaultSentence
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Phrases</div>
      {sentences.map((s: any, i: number) => (
        <div key={s.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <FieldGroup label={`Phrase correcte ${i + 1}`}>
            <FocusInput
              value={s.text || ""}
              onChange={(e) => patch(i, { text: e.target.value })}
              placeholder="Ich gehe in die Schule"
            />
          </FieldGroup>
          <FieldGroup label="Mots supplementaires (separes par des virgules)">
            <FocusInput
              value={s.extraWords || ""}
              onChange={(e) => patch(i, { extraWords: e.target.value })}
              placeholder="aber, noch, dann"
            />
          </FieldGroup>
        </div>
      ))}
      <AddButton label="Ajouter une phrase" onClick={add} />
    </div>
  );
}

// =============================================================================
// 12. SPEED QUIZ EDITOR — Rapid fire
// =============================================================================

function SpeedQuizEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultQuestion = useCallback(
    () => ({
      id: uid(),
      text: "",
      correct: "",
      wrong: ["", "", ""],
    }),
    []
  );

  const { items: questions, add, remove, patch } = useListState(
    "questions",
    c,
    onChange,
    defaultQuestion
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <FieldGroup label="Secondes par question">
        <FocusInput
          type="number"
          min={3}
          max={60}
          value={c.secondsPerQuestion || 10}
          onChange={(e) => setField("secondsPerQuestion", +e.target.value)}
          style={{ width: 80 }}
        />
      </FieldGroup>

      <div style={SECTION_TITLE}>Questions</div>
      {questions.map((q: any, qi: number) => (
        <div key={q.id || qi} style={CARD}>
          <RemoveButton onClick={() => remove(qi)} />
          <FieldGroup label={`Question ${qi + 1}`}>
            <FocusInput
              value={q.text || ""}
              onChange={(e) => patch(qi, { text: e.target.value })}
              placeholder="Comment dit-on 'chien' en allemand ?"
            />
          </FieldGroup>
          <div style={ROW}>
            <div style={HALF}>
              <Label style={{ color: TEAL }}>Bonne reponse</Label>
              <FocusInput
                value={q.correct || ""}
                onChange={(e) => patch(qi, { correct: e.target.value })}
                placeholder="der Hund"
                style={{ borderColor: `${TEAL}40` }}
              />
            </div>
          </div>
          <Label>Mauvaises reponses</Label>
          {(q.wrong || ["", "", ""]).map((w: string, wi: number) => (
            <div key={wi} style={{ marginBottom: 4 }}>
              <FocusInput
                value={w}
                onChange={(e) => {
                  const wrongs = [...(q.wrong || ["", "", ""])];
                  wrongs[wi] = e.target.value;
                  patch(qi, { wrong: wrongs });
                }}
                placeholder={`Mauvaise reponse ${wi + 1}`}
              />
            </div>
          ))}
        </div>
      ))}
      <AddButton label="Ajouter une question" onClick={add} />
    </div>
  );
}

// =============================================================================
// 13. WORD SEARCH EDITOR — Find words in grid
// =============================================================================

function WordSearchEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultWord = useCallback(
    () => ({ id: uid(), word: "" }),
    []
  );

  const { items: words, add, remove, patch } = useListState(
    "words",
    c,
    onChange,
    defaultWord
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <FieldGroup label="Taille de la grille (8-15)">
        <FocusInput
          type="number"
          min={8}
          max={15}
          value={c.gridSize || 10}
          onChange={(e) => setField("gridSize", +e.target.value)}
          style={{ width: 80 }}
        />
      </FieldGroup>

      <div style={SECTION_TITLE}>Mots</div>
      {words.map((w: any, i: number) => (
        <div key={w.id || i} style={{ ...CARD, paddingRight: 36 }}>
          <RemoveButton onClick={() => remove(i)} />
          <FocusInput
            value={w.word || ""}
            onChange={(e) => patch(i, { word: e.target.value })}
            placeholder={`Mot ${i + 1}`}
          />
        </div>
      ))}
      <AddButton label="Ajouter un mot" onClick={add} />
    </div>
  );
}

// =============================================================================
// 14. CROSSWORD EDITOR — Crossword puzzle
// =============================================================================

function CrosswordEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultEntry = useCallback(
    () => ({
      id: uid(),
      word: "",
      clue: "",
      direction: "across",
      row: 0,
      col: 0,
    }),
    []
  );

  const { items: entries, add, remove, patch } = useListState(
    "entries",
    c,
    onChange,
    defaultEntry
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Mots</div>
      {entries.map((entry: any, i: number) => (
        <div key={entry.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={{ flex: 2 }}>
              <Label>Mot</Label>
              <FocusInput
                value={entry.word || ""}
                onChange={(e) => patch(i, { word: e.target.value })}
                placeholder="HUND"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Direction</Label>
              <select
                value={entry.direction || "across"}
                onChange={(e) => patch(i, { direction: e.target.value })}
                style={{ ...INPUT, cursor: "pointer" }}
              >
                <option value="across">Horizontal</option>
                <option value="down">Vertical</option>
              </select>
            </div>
          </div>
          <FieldGroup label="Indice">
            <FocusInput
              value={entry.clue || ""}
              onChange={(e) => patch(i, { clue: e.target.value })}
              placeholder="Animal domestique qui aboie"
            />
          </FieldGroup>
          <div style={ROW}>
            <div style={HALF}>
              <Label>Ligne (row)</Label>
              <FocusInput
                type="number"
                min={0}
                value={entry.row ?? 0}
                onChange={(e) => patch(i, { row: +e.target.value })}
                style={{ width: 70 }}
              />
            </div>
            <div style={HALF}>
              <Label>Colonne (col)</Label>
              <FocusInput
                type="number"
                min={0}
                value={entry.col ?? 0}
                onChange={(e) => patch(i, { col: +e.target.value })}
                style={{ width: 70 }}
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton label="Ajouter un mot" onClick={add} />
    </div>
  );
}

// =============================================================================
// 15. SPELLING BEE EDITOR — Spell correctly
// =============================================================================

function SpellingBeeEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const defaultWord = useCallback(
    () => ({ id: uid(), word: "", hint: "", audioUrl: "" }),
    []
  );

  const { items: words, add, remove, patch } = useListState(
    "words",
    c,
    onChange,
    defaultWord
  );

  return (
    <div>
      <InstructionField
        value={c.instruction}
        onChange={(v) => setField("instruction", v)}
      />
      <div style={SECTION_TITLE}>Mots</div>
      {words.map((w: any, i: number) => (
        <div key={w.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <div style={ROW}>
            <div style={HALF}>
              <Label>Mot</Label>
              <FocusInput
                value={w.word || ""}
                onChange={(e) => patch(i, { word: e.target.value })}
                placeholder="Schmetterling"
              />
            </div>
            <div style={HALF}>
              <Label>Indice</Label>
              <FocusInput
                value={w.hint || ""}
                onChange={(e) => patch(i, { hint: e.target.value })}
                placeholder="Papillon"
              />
            </div>
          </div>
          <FieldGroup label="URL audio (optionnel)">
            <FocusInput
              value={w.audioUrl || ""}
              onChange={(e) => patch(i, { audioUrl: e.target.value })}
              placeholder="https://example.com/audio.mp3"
            />
          </FieldGroup>
        </div>
      ))}
      <AddButton label="Ajouter un mot" onClick={add} />
    </div>
  );
}

// =============================================================================
// 16. YOUTUBE EDITOR — Video embed
// =============================================================================

function YoutubeEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  const extractVideoId = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(c.url || "");

  return (
    <div>
      <FieldGroup label="URL YouTube">
        <FocusInput
          value={c.url || ""}
          onChange={(e) => setField("url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </FieldGroup>
      <FieldGroup label="Titre de la video">
        <FocusInput
          value={c.videoTitle || ""}
          onChange={(e) => setField("videoTitle", e.target.value)}
          placeholder="Titre descriptif..."
        />
      </FieldGroup>
      {videoId && (
        <div
          style={{
            marginTop: 8,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.1)",
            aspectRatio: "16/9",
            maxWidth: 320,
            background: "#000",
          }}
        >
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt="Apercu"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 17. IMAGE EDITOR — Image gallery
// =============================================================================

function ImageEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const defaultImage = useCallback(
    () => ({ id: uid(), url: "", caption: "" }),
    []
  );

  const { items: images, add, remove, patch } = useListState(
    "images",
    c,
    onChange,
    defaultImage
  );

  return (
    <div>
      <div style={SECTION_TITLE}>Images</div>
      {images.map((img: any, i: number) => (
        <div key={img.id || i} style={CARD}>
          <RemoveButton onClick={() => remove(i)} />
          <FieldGroup label="URL de l'image">
            <FocusInput
              value={img.url || ""}
              onChange={(e) => patch(i, { url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FieldGroup>
          <FieldGroup label="Legende">
            <FocusInput
              value={img.caption || ""}
              onChange={(e) => patch(i, { caption: e.target.value })}
              placeholder="Description de l'image..."
            />
          </FieldGroup>
          {img.url && (
            <img
              src={img.url}
              alt={img.caption || ""}
              style={{
                marginTop: 4,
                width: 80,
                height: 60,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
        </div>
      ))}
      <AddButton label="Ajouter une image" onClick={add} />
    </div>
  );
}

// =============================================================================
// 18. AUDIO EDITOR — Audio player
// =============================================================================

function AudioEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  return (
    <div>
      <FieldGroup label="URL audio">
        <FocusInput
          value={c.url || ""}
          onChange={(e) => setField("url", e.target.value)}
          placeholder="https://example.com/audio.mp3"
        />
      </FieldGroup>
      <FieldGroup label="Titre">
        <FocusInput
          value={c.audioTitle || ""}
          onChange={(e) => setField("audioTitle", e.target.value)}
          placeholder="Titre de l'audio..."
        />
      </FieldGroup>
      <FieldGroup label="Transcription (optionnel)">
        <FocusTextarea
          value={c.transcript || ""}
          onChange={(e) => setField("transcript", e.target.value)}
          placeholder="Transcription du contenu audio..."
          rows={4}
        />
      </FieldGroup>
      {c.url && (
        <audio
          controls
          src={c.url}
          style={{ width: "100%", marginTop: 4, height: 36 }}
        />
      )}
    </div>
  );
}

// =============================================================================
// 19. PDF EDITOR — PDF viewer
// =============================================================================

function PdfEditor({ content, onChange }: SubEditorProps) {
  const c = content || {};

  const setField = (key: string, val: any) =>
    onChange({ ...c, [key]: val });

  return (
    <div>
      <FieldGroup label="URL du PDF">
        <FocusInput
          value={c.url || ""}
          onChange={(e) => setField("url", e.target.value)}
          placeholder="https://example.com/document.pdf"
        />
      </FieldGroup>
      <FieldGroup label="Titre">
        <FocusInput
          value={c.pdfTitle || ""}
          onChange={(e) => setField("pdfTitle", e.target.value)}
          placeholder="Titre du document..."
        />
      </FieldGroup>
      {c.url && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            background: "rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            ...FONT,
          }}
        >
          <span style={{ fontSize: 18 }}>&#128196;</span>
          <span style={{ color: "rgba(0,0,0,0.6)", wordBreak: "break-all" }}>
            {c.url}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FALLBACK EDITOR — Unknown type
// =============================================================================

function FallbackEditor({ content, onChange }: SubEditorProps) {
  const [raw, setRaw] = useState(() =>
    content ? JSON.stringify(content, null, 2) : "{}"
  );

  useEffect(() => {
    if (content) {
      setRaw(JSON.stringify(content, null, 2));
    }
  }, [content]);

  const handleChange = (val: string) => {
    setRaw(val);
    try {
      const parsed = JSON.parse(val);
      onChange(parsed);
    } catch {
      // invalid JSON, keep raw for editing
    }
  };

  return (
    <div>
      <div
        style={{
          ...FONT,
          fontSize: 11,
          color: CORAL,
          marginBottom: 8,
          padding: "6px 10px",
          background: `${CORAL}0D`,
          borderRadius: 8,
        }}
      >
        Type non reconnu. Edition JSON brut :
      </div>
      <FocusTextarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={10}
        style={{ fontFamily: "monospace", fontSize: 11 }}
      />
    </div>
  );
}

// =============================================================================
// TYPE LABEL MAP
// =============================================================================

const TYPE_LABELS: Record<string, string> = {
  qcm: "QCM - Choix multiples",
  drag_drop: "Glisser-deposer - Ordre des mots",
  click_paste: "Cliquer-coller - Banque de mots",
  fill_gaps: "Remplir les trous",
  categorize: "Categoriser - Trier en groupes",
  match_arrows: "Relier - Fleches",
  hangman: "Pendu",
  match_picture: "Image - Mot",
  memory: "Memory - Paires de cartes",
  flashcard: "Flashcards",
  sentence_builder: "Constructeur de phrases",
  speed_quiz: "Quiz rapide",
  word_search: "Mots meles",
  crossword: "Mots croises",
  spelling_bee: "Orthographe",
  youtube: "Video YouTube",
  image: "Galerie d'images",
  audio: "Lecteur audio",
  pdf: "Document PDF",
};

// =============================================================================
// MAIN COMPONENT: BlockEditor
// =============================================================================

export function BlockEditor({
  type,
  content,
  onChange,
  title,
  onTitleChange,
  points,
  onPointsChange,
}: BlockEditorProps) {
  const isMedia = MEDIA_TYPES.includes(type);

  return (
    <div style={{ ...FONT, maxWidth: 640 }}>
      {/* Type badge */}
      <div
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 8,
          background: isMedia ? `${GOLD}1A` : `${VIOLET}14`,
          color: isMedia ? GOLD : VIOLET,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
        }}
      >
        {TYPE_LABELS[type] || type}
      </div>

      {/* Common header: Title */}
      <FieldGroup label="Titre du bloc">
        <FocusInput
          value={title || ""}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Titre du bloc..."
        />
      </FieldGroup>

      {/* Points (exercises only) */}
      {!isMedia && (
        <FieldGroup label="Points">
          <FocusInput
            type="number"
            min={0}
            value={points ?? 0}
            onChange={(e) => onPointsChange(+e.target.value)}
            style={{ width: 80 }}
          />
        </FieldGroup>
      )}

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "rgba(0,0,0,0.08)",
          margin: "16px 0",
        }}
      />

      {/* Type-specific editor */}
      {type === "qcm" && <QcmEditor content={content} onChange={onChange} />}
      {type === "drag_drop" && (
        <DragDropEditor content={content} onChange={onChange} />
      )}
      {type === "click_paste" && (
        <ClickPasteEditor content={content} onChange={onChange} />
      )}
      {type === "fill_gaps" && (
        <FillGapsEditor content={content} onChange={onChange} />
      )}
      {type === "categorize" && (
        <CategorizeEditor content={content} onChange={onChange} />
      )}
      {type === "match_arrows" && (
        <MatchArrowsEditor content={content} onChange={onChange} />
      )}
      {type === "hangman" && (
        <HangmanEditor content={content} onChange={onChange} />
      )}
      {type === "match_picture" && (
        <MatchPictureEditor content={content} onChange={onChange} />
      )}
      {type === "memory" && (
        <MemoryEditor content={content} onChange={onChange} />
      )}
      {type === "flashcard" && (
        <FlashcardEditor content={content} onChange={onChange} />
      )}
      {type === "sentence_builder" && (
        <SentenceBuilderEditor content={content} onChange={onChange} />
      )}
      {type === "speed_quiz" && (
        <SpeedQuizEditor content={content} onChange={onChange} />
      )}
      {type === "word_search" && (
        <WordSearchEditor content={content} onChange={onChange} />
      )}
      {type === "crossword" && (
        <CrosswordEditor content={content} onChange={onChange} />
      )}
      {type === "spelling_bee" && (
        <SpellingBeeEditor content={content} onChange={onChange} />
      )}
      {type === "youtube" && (
        <YoutubeEditor content={content} onChange={onChange} />
      )}
      {type === "image" && (
        <ImageEditor content={content} onChange={onChange} />
      )}
      {type === "audio" && (
        <AudioEditor content={content} onChange={onChange} />
      )}
      {type === "pdf" && <PdfEditor content={content} onChange={onChange} />}
      {!TYPE_LABELS[type] && (
        <FallbackEditor content={content} onChange={onChange} />
      )}
    </div>
  );
}

export default BlockEditor;
