import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import BlockPicker from "@/components/learning/BlockPicker";
import { BLOCK_TYPES, type ContentBlockType } from "@/lib/learning-types";

export const Route = createFileRoute("/admin/grammatik-units")({
  component: AdminGrammatikUnits,
});

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TM: React.CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: 12,
};

const PRESET_COLORS = [
  { label: "Violet", value: "#6C4CE0" },
  { label: "Coral", value: "#FF5A5F" },
  { label: "Gold", value: "#FFB200" },
  { label: "Teal", value: "#0FB6A3" },
  { label: "Green", value: "#16a34a" },
  { label: "Purple", value: "#8B5CF6" },
];

function getT(locale: string) {
  return (
    dashboardTranslations[locale as keyof typeof dashboardTranslations] ??
    dashboardTranslations["fr"]
  );
}

const navItems = (t: ReturnType<typeof getT>) => [
  {
    label: t.sidebar_overview,
    to: "/admin",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: t.sidebar_exams,
    to: "/admin/exams",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: "Grammaire active",
    to: "/admin/grammatik-units",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    label: "Vocabulaire",
    to: "/admin/wortschatz-units",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GrammarUnit {
  id: string;
  title_fr: string;
  title_ar?: string;
  title_de?: string;
  description_fr?: string;
  color?: string;
  icon?: string;
  is_published: boolean;
  order_index: number;
}

interface Exercise {
  id: string;
  topic_id: string;
  pillar: string;
  type: string;
  title_fr?: string;
  content: Record<string, unknown>;
  points?: number;
  order_index: number;
  is_published: boolean;
}

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #6C4CE0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      ...TM,
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      background: color ? `${color}22` : "#f3f4f6",
      color: color ?? "#374151",
      fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Block type label helper
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
// Block row (inside the content editor)
// ---------------------------------------------------------------------------

interface BlockRowProps {
  block: Exercise;
  index: number;
  onDelete: (id: string) => void;
}

function BlockRow({ block, index, onDelete }: BlockRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = blockTypeColor(block.type);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      marginBottom: 6,
    }}>
      {/* Drag handle */}
      <span style={{ color: "#9ca3af", cursor: "grab", fontSize: 14 }}>⠿</span>

      {/* Order */}
      <span style={{ ...TM, color: "#9ca3af", minWidth: 18 }}>#{index + 1}</span>

      {/* Type badge */}
      <span style={{
        ...TM,
        background: `${color}22`,
        color,
        padding: "2px 7px",
        borderRadius: 999,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}>
        {blockTypeLabel(block.type)}
      </span>

      {/* Title */}
      <span style={{ ...TM, flex: 1, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {block.title_fr || "(sans titre)"}
      </span>

      {/* Points */}
      {block.points != null && (
        <span style={{ ...TM, color: "#6C4CE0", fontWeight: 600 }}>{block.points} pts</span>
      )}

      {/* Delete */}
      {confirmDelete ? (
        <span style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onDelete(block.id)}
            style={{ ...TM, background: "#FF5A5F", color: "#fff", border: "none", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}
          >
            Confirmer
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ ...TM, background: "none", border: "none", color: "#FF5A5F", cursor: "pointer", padding: "2px 6px" }}
          title="Supprimer"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New block form (shown after picking a type from BlockPicker)
// ---------------------------------------------------------------------------

interface NewBlockFormProps {
  topicId: string;
  selectedType: ContentBlockType;
  onSaved: () => void;
  onCancel: () => void;
}

function NewBlockForm({ topicId, selectedType, onSaved, onCancel }: NewBlockFormProps) {
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
      setError("JSON invalide. Vérifiez le contenu.");
      setSaving(false);
      return;
    }

    // Get max order_index
    const { data: existing } = await supabase
      .from("exercises")
      .select("order_index")
      .eq("topic_id", topicId)
      .eq("pillar", "grammatik")
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

    const { error: insertError } = await supabase.from("exercises").insert({
      topic_id: topicId,
      pillar: "grammatik",
      type: selectedType,
      title_fr: titleFr || null,
      content: parsedContent,
      points,
      order_index: nextOrder,
      is_published: false,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div style={{
      background: "#f9fafb",
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      padding: 14,
      marginTop: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...TM, background: `${color}22`, color, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
          {blockTypeLabel(selectedType)}
        </span>
        <span style={{ ...TM, color: "#6b7280" }}>Nouveau bloc</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ ...TM, display: "block", color: "#374151", marginBottom: 4, fontWeight: 600 }}>
            Titre (FR)
          </label>
          <input
            value={titleFr}
            onChange={(e) => setTitleFr(e.target.value)}
            placeholder="Titre du bloc..."
            style={{ ...TM, width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ ...TM, display: "block", color: "#374151", marginBottom: 4, fontWeight: 600 }}>
            Points
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            min={0}
            style={{ ...TM, width: 70, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none" }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ ...TM, display: "block", color: "#374151", marginBottom: 4, fontWeight: 600 }}>
          Contenu JSON
        </label>
        <textarea
          value={contentJson}
          onChange={(e) => setContentJson(e.target.value)}
          rows={6}
          spellCheck={false}
          style={{ ...TM, width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none", resize: "vertical", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }}
        />
      </div>

      {error && (
        <p style={{ ...TM, color: "#FF5A5F", marginBottom: 8 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...TM, background: "#6C4CE0", color: "#fff", border: "none",
            borderRadius: 7, padding: "6px 16px", cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1, fontWeight: 600,
          }}
        >
          {saving ? "Enregistrement…" : "Enregistrer le bloc"}
        </button>
        <button
          onClick={onCancel}
          style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer" }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit content editor (inline expansion)
// ---------------------------------------------------------------------------

interface UnitContentEditorProps {
  unit: GrammarUnit;
  locale: "fr" | "ar";
}

function UnitContentEditor({ unit, locale }: UnitContentEditorProps) {
  const [blocks, setBlocks] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingType, setPendingType] = useState<ContentBlockType | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, [unit.id]);

  async function fetchBlocks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("topic_id", unit.id)
      .eq("pillar", "grammatik")
      .order("order_index", { ascending: true });

    if (!error && data) setBlocks(data as Exercise[]);
    setLoading(false);
  }

  async function handleDeleteBlock(id: string) {
    await supabase.from("exercises").delete().eq("id", id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function handlePickerSelect(type: ContentBlockType) {
    setShowPicker(false);
    setPendingType(type);
  }

  return (
    <div style={{ marginTop: 12, padding: "14px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
      <p style={{ ...TM, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
        Blocs de contenu — {unit.title_fr}
      </p>

      {loading ? (
        <Spinner />
      ) : blocks.length === 0 ? (
        <p style={{ ...TM, color: "#9ca3af", marginBottom: 10 }}>Aucun bloc pour l'instant.</p>
      ) : (
        <div>
          {blocks.map((block, i) => (
            <BlockRow key={block.id} block={block} index={i} onDelete={handleDeleteBlock} />
          ))}
        </div>
      )}

      {pendingType && (
        <NewBlockForm
          topicId={unit.id}
          selectedType={pendingType}
          onSaved={() => { setPendingType(null); fetchBlocks(); }}
          onCancel={() => setPendingType(null)}
        />
      )}

      {!pendingType && (
        <button
          onClick={() => setShowPicker(true)}
          style={{
            ...TM, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
            background: "#6C4CE0", color: "#fff", border: "none",
            borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 14 }}>+</span> Ajouter un bloc
        </button>
      )}

      {showPicker && (
        <BlockPicker
          locale={locale}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit card
// ---------------------------------------------------------------------------

interface UnitCardProps {
  unit: GrammarUnit;
  exerciseCount: number;
  locale: "fr" | "ar";
  onPublishToggle: (unit: GrammarUnit) => void;
  onDelete: (id: string) => void;
  onEdit: (unit: GrammarUnit) => void;
}

function UnitCard({ unit, exerciseCount, locale, onPublishToggle, onDelete, onEdit }: UnitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = unit.color ?? "#6C4CE0";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 0,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.2s",
      marginBottom: 10,
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
        {/* Drag handle */}
        <span style={{ color: "#d1d5db", cursor: "grab", fontSize: 18, marginTop: 2, flexShrink: 0 }}>⠿</span>

        {/* Color dot + icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: `${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {unit.icon ?? "📚"}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>
              {unit.title_fr}
            </span>
            <span style={{
              ...TM,
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 999,
              background: unit.is_published ? "#dcfce7" : "#f3f4f6",
              color: unit.is_published ? "#16a34a" : "#6b7280",
              fontWeight: 600,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: unit.is_published ? "#16a34a" : "#9ca3af",
                display: "inline-block",
              }} />
              {unit.is_published ? "Publié" : "Brouillon"}
            </span>
          </div>

          {unit.description_fr && (
            <p style={{ ...TM, color: "#6b7280", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {unit.description_fr}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
            <Badge color={color}>{exerciseCount} exercice{exerciseCount !== 1 ? "s" : ""}</Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 600,
              background: expanded ? "#6C4CE0" : "#EEE9FD", color: expanded ? "#fff" : "#6C4CE0",
              border: "none",
            }}
          >
            {expanded ? "Fermer" : "Gérer le contenu"}
          </button>
          <button
            onClick={() => onPublishToggle(unit)}
            style={{
              ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 600,
              background: unit.is_published ? "#fef2f2" : "#dcfce7",
              color: unit.is_published ? "#dc2626" : "#16a34a",
              border: "none",
            }}
          >
            {unit.is_published ? "Dépublier" : "Publier"}
          </button>
          <button
            onClick={() => onEdit(unit)}
            style={{
              ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer",
              background: "#f3f4f6", color: "#374151", border: "none",
            }}
          >
            Modifier
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(unit.id)}
                style={{ ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#FF5A5F", color: "#fff", border: "none", fontWeight: 600 }}
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#f3f4f6", color: "#374151", border: "none" }}
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer",
                background: "#fef2f2", color: "#dc2626", border: "none",
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <UnitContentEditor unit={unit} locale={locale} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add unit dialog
// ---------------------------------------------------------------------------

interface AddUnitDialogProps {
  onClose: () => void;
  onCreated: () => void;
  nextOrder: number;
}

function AddUnitDialog({ onClose, onCreated, nextOrder }: AddUnitDialogProps) {
  const [titleFr, setTitleFr] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [descFr, setDescFr] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [icon, setIcon] = useState("📚");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  async function handleCreate() {
    if (!titleFr.trim()) { setError("Le titre en français est requis."); return; }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from("grammar_topics").insert({
      title_fr: titleFr.trim(),
      title_ar: titleAr.trim() || null,
      description_fr: descFr.trim() || null,
      slug: titleFr.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      is_published: false,
      order_index: nextOrder,
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    setSaving(false);
    onCreated();
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, backdropFilter: "blur(2px)",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        width: "100%", maxWidth: 500,
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>Ajouter une unité de grammaire</span>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Title FR */}
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titre (Français) *</label>
            <input
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              placeholder="ex. Le présent de l'indicatif"
              style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Title AR */}
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titre (العربية)</label>
            <input
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              dir="rtl"
              placeholder="العنوان بالعربية..."
              style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", direction: "rtl", boxSizing: "border-box" }}
            />
          </div>

          {/* Title DE */}
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titel (Deutsch)</label>
            <input
              value={titleDe}
              onChange={(e) => setTitleDe(e.target.value)}
              placeholder="z.B. Das Präsens"
              style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Description FR */}
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Description (Français)</label>
            <textarea
              value={descFr}
              onChange={(e) => setDescFr(e.target.value)}
              rows={3}
              placeholder="Brève description de l'unité..."
              style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {/* Color picker */}
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Couleur</label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", background: c.value,
                    border: color === c.value ? `3px solid #111` : "2px solid transparent",
                    cursor: "pointer", transition: "border 0.15s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Icône (emoji)</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
              style={{ ...TM, width: 60, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", textAlign: "center", fontSize: 18 }}
            />
          </div>

          {error && <p style={{ ...TM, color: "#FF5A5F" }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer" }}>
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            style={{
              ...TM, background: "#6C4CE0", color: "#fff", border: "none",
              borderRadius: 7, padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1, fontWeight: 600,
            }}
          >
            {saving ? "Création…" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit unit dialog
// ---------------------------------------------------------------------------

interface EditUnitDialogProps {
  unit: GrammarUnit;
  onClose: () => void;
  onSaved: () => void;
}

function EditUnitDialog({ unit, onClose, onSaved }: EditUnitDialogProps) {
  const [titleFr, setTitleFr] = useState(unit.title_fr);
  const [titleAr, setTitleAr] = useState(unit.title_ar ?? "");
  const [titleDe, setTitleDe] = useState(unit.title_de ?? "");
  const [descFr, setDescFr] = useState(unit.description_fr ?? "");
  const [color, setColor] = useState(unit.color ?? PRESET_COLORS[0].value);
  const [icon, setIcon] = useState(unit.icon ?? "📚");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  async function handleSave() {
    if (!titleFr.trim()) { setError("Le titre est requis."); return; }
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("grammar_topics")
      .update({
        title_fr: titleFr.trim(),
        title_ar: titleAr.trim() || null,
        title_de: titleDe.trim() || null,
        description_fr: descFr.trim() || null,
        color,
        icon,
      })
      .eq("id", unit.id);

    if (updateError) { setError(updateError.message); setSaving(false); return; }
    setSaving(false);
    onSaved();
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, backdropFilter: "blur(2px)",
      }}
    >
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 500 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>Modifier l'unité</span>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titre (Français) *</label>
            <input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titre (العربية)</label>
            <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", direction: "rtl", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Titel (Deutsch)</label>
            <input value={titleDe} onChange={(e) => setTitleDe(e.target.value)} style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Description (Français)</label>
            <textarea value={descFr} onChange={(e) => setDescFr(e.target.value)} rows={3} style={{ ...TM, width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Couleur</label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRESET_COLORS.map((c) => (
                <button key={c.value} title={c.label} onClick={() => setColor(c.value)} style={{ width: 26, height: 26, borderRadius: "50%", background: c.value, border: color === c.value ? "3px solid #111" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>Icône (emoji)</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} style={{ ...TM, width: 60, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", textAlign: "center", fontSize: 18 }} />
          </div>
          {error && <p style={{ ...TM, color: "#FF5A5F" }}>{error}</p>}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ ...TM, background: "#6C4CE0", color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontWeight: 600 }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function AdminGrammatikUnits() {
  const { loading } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  const [units, setUnits] = useState<GrammarUnit[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<GrammarUnit | null>(null);

  useEffect(() => {
    if (loading) return;
    fetchData();
  }, [loading]);

  async function fetchData() {
    setDataLoading(true);

    const { data, error } = await supabase
      .from("grammar_topics")
      .select("*")
      .order("order_index", { ascending: true });

    if (!error && data) {
      const fetchedUnits = data as GrammarUnit[];
      setUnits(fetchedUnits);

      // Fetch exercise counts per unit
      const counts: Record<string, number> = {};
      await Promise.all(
        fetchedUnits.map(async (u) => {
          const { count } = await supabase
            .from("exercises")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", u.id)
            .eq("pillar", "grammatik");
          counts[u.id] = count ?? 0;
        })
      );
      setExerciseCounts(counts);
    }

    setDataLoading(false);
  }

  async function handlePublishToggle(unit: GrammarUnit) {
    await supabase
      .from("grammar_topics")
      .update({ is_published: !unit.is_published })
      .eq("id", unit.id);
    setUnits((prev) =>
      prev.map((u) => u.id === unit.id ? { ...u, is_published: !u.is_published } : u)
    );
  }

  async function handleDelete(id: string) {
    await supabase.from("grammar_topics").delete().eq("id", id);
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  if (loading) return <Spinner />;

  const nextOrder = units.length > 0 ? Math.max(...units.map((u) => u.order_index)) + 1 : 1;

  return (
    <DashboardLayout navItems={navItems(t)} role="admin">
      <div style={TM}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ ...TM, fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
              Gestion de la grammaire
            </h1>
            <p style={{ ...TM, color: "#6b7280", marginTop: 4 }}>
              Créez et gérez les unités Grammatik et leurs exercices.
            </p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            style={{
              ...TM, display: "inline-flex", alignItems: "center", gap: 6,
              background: "#6C4CE0", color: "#fff", border: "none",
              borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontWeight: 700,
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Ajouter une unité
          </button>
        </div>

        {/* Unit list */}
        {dataLoading ? (
          <Spinner />
        ) : units.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>📚</span>
            <p style={{ ...TM, fontWeight: 600, color: "#6b7280" }}>Aucune unité de grammaire.</p>
            <p style={{ ...TM, color: "#9ca3af", marginTop: 4 }}>Créez votre première unité !</p>
          </div>
        ) : (
          <div>
            {units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                exerciseCount={exerciseCounts[unit.id] ?? 0}
                locale={locale as "fr" | "ar"}
                onPublishToggle={handlePublishToggle}
                onDelete={handleDelete}
                onEdit={setEditingUnit}
              />
            ))}
          </div>
        )}

        {/* Add dialog */}
        {showAddDialog && (
          <AddUnitDialog
            nextOrder={nextOrder}
            onClose={() => setShowAddDialog(false)}
            onCreated={() => { setShowAddDialog(false); fetchData(); }}
          />
        )}

        {/* Edit dialog */}
        {editingUnit && (
          <EditUnitDialog
            unit={editingUnit}
            onClose={() => setEditingUnit(null)}
            onSaved={() => { setEditingUnit(null); fetchData(); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
