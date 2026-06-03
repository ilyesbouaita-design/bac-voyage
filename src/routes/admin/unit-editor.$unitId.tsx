import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import BlockPicker from "@/components/learning/BlockPicker";
import { BLOCK_TYPES, type ContentBlockType } from "@/lib/learning-types";

export const Route = createFileRoute("/admin/unit-editor/$unitId")({
  component: AdminUnitEditor,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TM: React.CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: 12,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnitMeta {
  id: string;
  title_fr: string;
  title_ar?: string;
  title_de?: string;
  description_fr?: string;
  color?: string;
  icon?: string;
  is_published: boolean;
  // We don't know yet if it's from grammar_topics or vocab_sets at fetch time.
  // We'll try grammar_topics first, then vocab_sets.
  _source?: "grammar" | "vocab";
}

interface Exercise {
  id: string;
  topic_id?: string;
  set_id?: string;
  pillar: string;
  type: string;
  title_fr?: string;
  content: Record<string, unknown>;
  points?: number;
  order_index: number;
  is_published: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function blockTypeLabel(type: string): string {
  const info = BLOCK_TYPES.find((b) => b.type === type);
  return info ? `${info.icon} ${info.label_fr}` : type;
}

function blockTypeColor(type: string): string {
  const info = BLOCK_TYPES.find((b) => b.type === type);
  return info?.color ?? "#6b7280";
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner({ color = "#6C4CE0" }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block card — expandable for editing
// ---------------------------------------------------------------------------

interface BlockCardProps {
  block: Exercise;
  index: number;
  onDelete: (id: string) => void;
  onSaveEdit: (id: string, updates: Partial<Exercise>) => void;
}

function BlockCard({ block, index, onDelete, onSaveEdit }: BlockCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTitleFr, setEditTitleFr] = useState(block.title_fr ?? "");
  const [editPoints, setEditPoints] = useState(block.points ?? 0);
  const [editJson, setEditJson] = useState(JSON.stringify(block.content, null, 2));
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const color = blockTypeColor(block.type);

  async function handleSave() {
    setSaving(true);
    setJsonError(null);

    let parsedContent: Record<string, unknown> = {};
    try {
      parsedContent = JSON.parse(editJson);
    } catch {
      setJsonError("JSON invalide.");
      setSaving(false);
      return;
    }

    await onSaveEdit(block.id, {
      title_fr: editTitleFr || undefined,
      points: editPoints,
      content: parsedContent,
    });

    setSaving(false);
    setExpanded(false);
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderLeft: `4px solid ${color}`,
      borderRadius: 10,
      marginBottom: 8,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.09)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)")}
    >
      {/* Compact header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        {/* Drag handle */}
        <span style={{ color: "#d1d5db", cursor: "grab", fontSize: 16, flexShrink: 0 }}>⠿</span>

        {/* Order */}
        <span style={{ ...TM, color: "#9ca3af", minWidth: 22, flexShrink: 0 }}>#{index + 1}</span>

        {/* Type badge */}
        <span style={{ ...TM, background: `${color}22`, color, padding: "2px 8px", borderRadius: 999, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
          {blockTypeLabel(block.type)}
        </span>

        {/* Title */}
        <span style={{ ...TM, flex: 1, color: "#111827", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {block.title_fr || "(sans titre)"}
        </span>

        {/* Points */}
        {block.points != null && (
          <span style={{ ...TM, color, fontWeight: 700, flexShrink: 0 }}>
            {block.points} pts
          </span>
        )}

        {/* Published badge */}
        <span style={{
          ...TM, flexShrink: 0,
          background: block.is_published ? "#dcfce7" : "#f3f4f6",
          color: block.is_published ? "#16a34a" : "#9ca3af",
          padding: "2px 7px", borderRadius: 999, fontWeight: 600,
        }}>
          {block.is_published ? "Publié" : "Brouillon"}
        </span>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ ...TM, background: expanded ? "#f3f4f6" : "#EEE9FD", color: expanded ? "#374151" : "#6C4CE0", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}
        >
          {expanded ? "Fermer" : "Modifier"}
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <span style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <button onClick={() => onDelete(block.id)} style={{ ...TM, background: "#FF5A5F", color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
              Confirmer
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>
              Annuler
            </button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ ...TM, background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}>
            Supprimer
          </button>
        )}
      </div>

      {/* Expanded edit form */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f3f4f6" }}>
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Title */}
            <div>
              <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titre (FR)</label>
              <input
                value={editTitleFr}
                onChange={(e) => setEditTitleFr(e.target.value)}
                style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Points */}
            <div>
              <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Points</label>
              <input
                type="number"
                value={editPoints}
                onChange={(e) => setEditPoints(Number(e.target.value))}
                min={0}
                style={{ ...TM, width: 80, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none" }}
              />
            </div>

            {/* Content JSON */}
            <div>
              <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Contenu JSON</label>
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                rows={8}
                spellCheck={false}
                style={{ ...TM, width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", resize: "vertical", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }}
              />
            </div>

            {jsonError && <p style={{ ...TM, color: "#FF5A5F" }}>{jsonError}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...TM, background: "#6C4CE0", color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontWeight: 600 }}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                onClick={() => setExpanded(false)}
                style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "7px 14px", cursor: "pointer" }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New block form
// ---------------------------------------------------------------------------

interface NewBlockFormProps {
  unit: UnitMeta;
  selectedType: ContentBlockType;
  onSaved: () => void;
  onCancel: () => void;
}

function NewBlockForm({ unit, selectedType, onSaved, onCancel }: NewBlockFormProps) {
  const [titleFr, setTitleFr] = useState("");
  const [points, setPoints] = useState(10);
  const [contentJson, setContentJson] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = blockTypeColor(selectedType);

  async function handleSave() {
    setSaving(true);
    setError(null);

    let parsedContent: Record<string, unknown> = {};
    try {
      parsedContent = JSON.parse(contentJson);
    } catch {
      setError("JSON invalide.");
      setSaving(false);
      return;
    }

    // Determine FK and pillar from unit source
    const isGrammar = unit._source === "grammar";
    const pillar = isGrammar ? "grammatik" : "wortschatz";
    const fkField = isGrammar ? "topic_id" : "set_id";

    // Find next order_index
    const { data: existing } = await supabase
      .from("exercises")
      .select("order_index")
      .eq(fkField, unit.id)
      .eq("pillar", pillar)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

    const insertPayload: Record<string, unknown> = {
      [fkField]: unit.id,
      pillar,
      type: selectedType,
      title_fr: titleFr || null,
      content: parsedContent,
      points,
      order_index: nextOrder,
      is_published: false,
    };

    const { error: insertError } = await supabase.from("exercises").insert(insertPayload);

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    setSaving(false);
    onSaved();
  }

  return (
    <div style={{ background: "#f9fafb", border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: 16, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...TM, background: `${color}22`, color, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
          {blockTypeLabel(selectedType)}
        </span>
        <span style={{ ...TM, color: "#6b7280" }}>Nouveau bloc</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titre (FR)</label>
          <input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="Titre du bloc..." style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Points</label>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={0} style={{ ...TM, width: 70, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none" }} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Contenu JSON</label>
        <textarea value={contentJson} onChange={(e) => setContentJson(e.target.value)} rows={7} spellCheck={false} style={{ ...TM, width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", resize: "vertical", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }} />
      </div>

      {error && <p style={{ ...TM, color: "#FF5A5F", marginBottom: 8 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...TM, background: "#6C4CE0", color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontWeight: 600 }}>
          {saving ? "Enregistrement…" : "Enregistrer le bloc"}
        </button>
        <button onClick={onCancel} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "7px 14px", cursor: "pointer" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function AdminUnitEditor() {
  const { unitId } = useParams({ from: "/admin/unit-editor/$unitId" });
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth("admin");
  const { locale } = useLocale();

  const [unit, setUnit] = useState<UnitMeta | null>(null);
  const [blocks, setBlocks] = useState<Exercise[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingType, setPendingType] = useState<ContentBlockType | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchUnitAndBlocks();
  }, [authLoading, unitId]);

  async function fetchUnitAndBlocks() {
    setPageLoading(true);
    setNotFound(false);

    // Try grammar_topics first
    const { data: grammarData } = await supabase
      .from("grammar_topics")
      .select("*")
      .eq("id", unitId)
      .single();

    if (grammarData) {
      const u: UnitMeta = { ...grammarData, _source: "grammar" };
      setUnit(u);
      await fetchBlocks(unitId, "grammar");
      setPageLoading(false);
      return;
    }

    // Try vocab_sets
    const { data: vocabData } = await supabase
      .from("vocab_sets")
      .select("*")
      .eq("id", unitId)
      .single();

    if (vocabData) {
      const u: UnitMeta = { ...vocabData, _source: "vocab" };
      setUnit(u);
      await fetchBlocks(unitId, "vocab");
      setPageLoading(false);
      return;
    }

    setNotFound(true);
    setPageLoading(false);
  }

  async function fetchBlocks(id: string, source: "grammar" | "vocab") {
    const fkField = source === "grammar" ? "topic_id" : "set_id";
    const pillar = source === "grammar" ? "grammatik" : "wortschatz";

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq(fkField, id)
      .eq("pillar", pillar)
      .order("order_index", { ascending: true });

    if (!error && data) setBlocks(data as Exercise[]);
  }

  async function handleDeleteBlock(id: string) {
    await supabase.from("exercises").delete().eq("id", id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleSaveEdit(id: string, updates: Partial<Exercise>) {
    const { error } = await supabase
      .from("exercises")
      .update({
        title_fr: updates.title_fr ?? null,
        points: updates.points,
        content: updates.content,
      })
      .eq("id", id);

    if (!error) {
      setBlocks((prev) =>
        prev.map((b) => b.id === id ? { ...b, ...updates } : b)
      );
    }
  }

  function handlePickerSelect(type: ContentBlockType) {
    setShowPicker(false);
    setPendingType(type);
  }

  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (notFound || !unit) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <p style={{ ...TM, color: "#374151", fontWeight: 700, fontSize: 16 }}>Unité introuvable</p>
        <p style={{ ...TM, color: "#6b7280" }}>L'identifiant "{unitId}" ne correspond à aucune unité.</p>
        <button
          onClick={() => navigate({ to: "/admin/grammatik-units" })}
          style={{ ...TM, background: "#6C4CE0", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600, marginTop: 8 }}
        >
          ← Retour aux unités
        </button>
      </div>
    );
  }

  const color = unit.color ?? "#6C4CE0";
  const isGrammar = unit._source === "grammar";
  const backRoute = isGrammar ? "/admin/grammatik-units" : "/admin/wortschatz-units";

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", ...TM }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 30 }}>
        <button
          onClick={() => navigate({ to: backRoute })}
          style={{ ...TM, background: "none", border: "none", color: "#6C4CE0", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, padding: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
        <span style={{ width: 1, height: 20, background: "#e5e7eb" }} />
        <span style={{ ...TM, color: "#6b7280" }}>
          {isGrammar ? "Grammatik" : "Wortschatz"} — Éditeur d'unité
        </span>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>
        {/* Unit header card */}
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb",
          borderLeft: `5px solid ${color}`, borderRadius: 12,
          padding: "18px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
            {unit.icon ?? "📚"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ ...TM, fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
                {unit.title_fr}
              </h1>
              {unit.title_de && (
                <span style={{ ...TM, color: "#6b7280", fontStyle: "italic" }}>{unit.title_de}</span>
              )}
              {/* Color badge */}
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block" }} />
              {/* Published status */}
              <span style={{
                ...TM, display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 9px", borderRadius: 999,
                background: unit.is_published ? "#dcfce7" : "#f3f4f6",
                color: unit.is_published ? "#16a34a" : "#6b7280", fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: unit.is_published ? "#16a34a" : "#9ca3af", display: "inline-block" }} />
                {unit.is_published ? "Publié" : "Brouillon"}
              </span>
            </div>
            {unit.description_fr && (
              <p style={{ ...TM, color: "#6b7280", marginTop: 4 }}>{unit.description_fr}</p>
            )}
            <div style={{ marginTop: 6 }}>
              <span style={{ ...TM, background: `${color}18`, color, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                {blocks.length} bloc{blocks.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Blocks section */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ ...TM, fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>
            Blocs de contenu
          </h2>
          <span style={{ ...TM, color: "#9ca3af" }}>
            {blocks.length} bloc{blocks.length !== 1 ? "s" : ""}
          </span>
        </div>

        {blocks.length === 0 ? (
          <div style={{ background: "#fff", border: "1px dashed #d1d5db", borderRadius: 12, padding: "40px 20px", textAlign: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 10 }}>📭</span>
            <p style={{ ...TM, color: "#6b7280", fontWeight: 600 }}>Aucun bloc de contenu.</p>
            <p style={{ ...TM, color: "#9ca3af", marginTop: 4 }}>Ajoutez votre premier bloc ci-dessous.</p>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {blocks.map((block, i) => (
              <BlockCard
                key={block.id}
                block={block}
                index={i}
                onDelete={handleDeleteBlock}
                onSaveEdit={handleSaveEdit}
              />
            ))}
          </div>
        )}

        {/* New block form (after picking type) */}
        {pendingType && (
          <NewBlockForm
            unit={unit}
            selectedType={pendingType}
            onSaved={() => {
              setPendingType(null);
              fetchBlocks(unitId, unit._source ?? "grammar");
            }}
            onCancel={() => setPendingType(null)}
          />
        )}

        {/* Add block button */}
        {!pendingType && (
          <button
            onClick={() => setShowPicker(true)}
            style={{
              ...TM, display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "12px 16px",
              background: "#fff", border: "2px dashed #6C4CE0",
              borderRadius: 10, cursor: "pointer",
              color: "#6C4CE0", fontWeight: 700, justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#EEE9FD")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Ajouter un bloc
          </button>
        )}

        {/* BlockPicker modal */}
        {showPicker && (
          <BlockPicker
            locale={locale as "fr" | "ar"}
            onSelect={handlePickerSelect}
            onClose={() => setShowPicker(false)}
          />
        )}

        {/* Bottom back button */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
          <button
            onClick={() => navigate({ to: backRoute })}
            style={{
              ...TM, background: "#f3f4f6", color: "#374151",
              border: "none", borderRadius: 8, padding: "8px 18px",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour aux unités
          </button>
        </div>
      </div>
    </div>
  );
}
