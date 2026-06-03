import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import BlockPicker from "@/components/learning/BlockPicker";
import { BLOCK_TYPES, type ContentBlockType } from "@/lib/learning-types";
import { EINHEITEN, type Einheit } from "@/lib/einheiten";

export const Route = createFileRoute("/admin/wortschatz-units")({
  component: AdminWortschatzUnits,
});

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const TM: React.CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: 12,
};

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

interface VocabSet {
  id: string;
  einheit_id: string; // "einheit-01" ... "einheit-06"
  title_fr: string;
  description_fr?: string;
  is_published: boolean;
  order_index: number;
}

interface Exercise {
  id: string;
  set_id: string;
  pillar: string;
  type: string;
  title_fr?: string;
  content: Record<string, unknown>;
  points?: number;
  order_index: number;
  is_published: boolean;
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #FFB200", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block type helpers
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
// Block row
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
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px", background: "#fff",
      border: "1px solid #e5e7eb", borderLeft: `3px solid ${color}`,
      borderRadius: 8, marginBottom: 6,
    }}>
      <span style={{ color: "#9ca3af", cursor: "grab", fontSize: 14 }}>⠿</span>
      <span style={{ ...TM, color: "#9ca3af", minWidth: 18 }}>#{index + 1}</span>
      <span style={{ ...TM, background: `${color}22`, color, padding: "2px 7px", borderRadius: 999, fontWeight: 600, whiteSpace: "nowrap" }}>
        {blockTypeLabel(block.type)}
      </span>
      <span style={{ ...TM, flex: 1, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {block.title_fr || "(sans titre)"}
      </span>
      {block.points != null && (
        <span style={{ ...TM, color: "#FFB200", fontWeight: 600 }}>{block.points} pts</span>
      )}
      {confirmDelete ? (
        <span style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onDelete(block.id)} style={{ ...TM, background: "#FF5A5F", color: "#fff", border: "none", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>
            Confirmer
          </button>
          <button onClick={() => setConfirmDelete(false)} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>
            Annuler
          </button>
        </span>
      ) : (
        <button onClick={() => setConfirmDelete(true)} style={{ ...TM, background: "none", border: "none", color: "#FF5A5F", cursor: "pointer", padding: "2px 6px" }} title="Supprimer">
          ✕
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New block form
// ---------------------------------------------------------------------------

interface NewBlockFormProps {
  setId: string;
  selectedType: ContentBlockType;
  onSaved: () => void;
  onCancel: () => void;
}

function NewBlockForm({ setId, selectedType, onSaved, onCancel }: NewBlockFormProps) {
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

    const { data: existing } = await supabase
      .from("exercises")
      .select("order_index")
      .eq("set_id", setId)
      .eq("pillar", "wortschatz")
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;

    const { error: insertError } = await supabase.from("exercises").insert({
      set_id: setId,
      pillar: "wortschatz",
      type: selectedType,
      title_fr: titleFr || null,
      content: parsedContent,
      points,
      order_index: nextOrder,
      is_published: false,
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    setSaving(false);
    onSaved();
  }

  return (
    <div style={{ background: "#f9fafb", border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: 14, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...TM, background: `${color}22`, color, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
          {blockTypeLabel(selectedType)}
        </span>
        <span style={{ ...TM, color: "#6b7280" }}>Nouveau bloc</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ ...TM, display: "block", color: "#374151", marginBottom: 4, fontWeight: 600 }}>Titre (FR)</label>
          <input value={titleFr} onChange={(e) => setTitleFr(e.target.value)} placeholder="Titre du bloc..." style={{ ...TM, width: "100%", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ ...TM, display: "block", color: "#374151", marginBottom: 4, fontWeight: 600 }}>Points</label>
          <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} min={0} style={{ ...TM, width: 70, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none" }} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ ...TM, display: "block", color: "#374151", marginBottom: 4, fontWeight: 600 }}>Contenu JSON</label>
        <textarea value={contentJson} onChange={(e) => setContentJson(e.target.value)} rows={6} spellCheck={false} style={{ ...TM, width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none", resize: "vertical", fontFamily: "monospace", fontSize: 11, boxSizing: "border-box" }} />
      </div>

      {error && <p style={{ ...TM, color: "#FF5A5F", marginBottom: 8 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...TM, background: "#FFB200", color: "#fff", border: "none", borderRadius: 7, padding: "6px 16px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontWeight: 600 }}>
          {saving ? "Enregistrement…" : "Enregistrer le bloc"}
        </button>
        <button onClick={onCancel} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit content editor — for a specific vocab_set linked to an Einheit
// ---------------------------------------------------------------------------

interface UnitContentEditorProps {
  setId: string;
  einheit: Einheit;
  locale: "fr" | "ar";
}

function UnitContentEditor({ setId, einheit, locale }: UnitContentEditorProps) {
  const [blocks, setBlocks] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingType, setPendingType] = useState<ContentBlockType | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, [setId]);

  async function fetchBlocks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("set_id", setId)
      .eq("pillar", "wortschatz")
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
    <div style={{ marginTop: 12, padding: "14px 16px", background: "#fffbf0", borderRadius: 10, border: "1px solid #fde68a" }}>
      <p style={{ ...TM, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
        Blocs de contenu — {einheit.icon} {einheit.title_de}
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
          setId={setId}
          selectedType={pendingType}
          onSaved={() => { setPendingType(null); fetchBlocks(); }}
          onCancel={() => setPendingType(null)}
        />
      )}

      {!pendingType && (
        <button
          onClick={() => setShowPicker(true)}
          style={{ ...TM, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "#FFB200", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}
        >
          <span style={{ fontSize: 14 }}>+</span> Ajouter un bloc
        </button>
      )}

      {showPicker && (
        <BlockPicker locale={locale} onSelect={handlePickerSelect} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit description dialog
// ---------------------------------------------------------------------------

interface EditDescDialogProps {
  vocabSet: VocabSet;
  onClose: () => void;
  onSaved: () => void;
}

function EditDescDialog({ vocabSet, onClose, onSaved }: EditDescDialogProps) {
  const [descFr, setDescFr] = useState(vocabSet.description_fr ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("vocab_sets")
      .update({ description_fr: descFr.trim() || null })
      .eq("id", vocabSet.id);

    if (updateError) { setError(updateError.message); setSaving(false); return; }
    setSaving(false);
    onSaved();
  }

  return (
    <div
      onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(2px)" }}
    >
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>Modifier la description</span>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description (Français)</label>
          <textarea value={descFr} onChange={(e) => setDescFr(e.target.value)} rows={4} style={{ ...TM, width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          {error && <p style={{ ...TM, color: "#FF5A5F", marginTop: 6 }}>{error}</p>}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ ...TM, background: "#FFB200", color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontWeight: 600 }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Einheit card — one per the 6 preset Einheiten
// ---------------------------------------------------------------------------

interface EinheitCardProps {
  einheit: Einheit;
  vocabSet: VocabSet | null;
  exerciseCount: number;
  locale: "fr" | "ar";
  onPublishToggle: (vs: VocabSet) => void;
  onEditDesc: (vs: VocabSet) => void;
}

function EinheitCard({ einheit, vocabSet, exerciseCount, locale, onPublishToggle, onEditDesc }: EinheitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = einheit.color;

  // If there's no vocab_set for this Einheit yet, show a placeholder
  if (!vocabSet) {
    return (
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "14px 16px", marginBottom: 10,
        borderLeft: `4px solid ${color}`,
        opacity: 0.6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{einheit.icon}</span>
          <div>
            <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>
              Einheit {einheit.number}: {einheit.title_de}
            </span>
            <p style={{ ...TM, color: "#9ca3af", marginTop: 2 }}>
              Aucun vocab_set lié à cet Einheit. Vérifiez la base de données.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderLeft: `4px solid ${color}`, borderRadius: 12,
      overflow: "hidden", marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
        {/* Icon */}
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {einheit.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>
              Einheit {einheit.number}: {einheit.title_de}
            </span>
            <span style={{ ...TM, color: `${color}`, background: `${color}18`, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
              {locale === "ar" ? einheit.title_ar : einheit.title_fr}
            </span>
            <span style={{
              ...TM, display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 999,
              background: vocabSet.is_published ? "#dcfce7" : "#f3f4f6",
              color: vocabSet.is_published ? "#16a34a" : "#6b7280", fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: vocabSet.is_published ? "#16a34a" : "#9ca3af", display: "inline-block" }} />
              {vocabSet.is_published ? "Publié" : "Brouillon"}
            </span>
          </div>

          {vocabSet.description_fr && (
            <p style={{ ...TM, color: "#6b7280", marginTop: 3 }}>{vocabSet.description_fr}</p>
          )}

          <div style={{ marginTop: 6 }}>
            <span style={{ ...TM, background: `${color}18`, color, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
              {exerciseCount} exercice{exerciseCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 600, background: expanded ? color : `${color}22`, color: expanded ? "#fff" : color, border: "none" }}
          >
            {expanded ? "Fermer" : "Gérer le contenu"}
          </button>
          <button
            onClick={() => onPublishToggle(vocabSet)}
            style={{ ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 600, background: vocabSet.is_published ? "#fef2f2" : "#dcfce7", color: vocabSet.is_published ? "#dc2626" : "#16a34a", border: "none" }}
          >
            {vocabSet.is_published ? "Dépublier" : "Publier"}
          </button>
          <button
            onClick={() => onEditDesc(vocabSet)}
            style={{ ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#f3f4f6", color: "#374151", border: "none" }}
          >
            Modifier desc.
          </button>
        </div>
      </div>

      {expanded && vocabSet && (
        <div style={{ padding: "0 16px 16px" }}>
          <UnitContentEditor setId={vocabSet.id} einheit={einheit} locale={locale} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function AdminWortschatzUnits() {
  const { loading } = useAuth("admin");
  const { locale } = useLocale();
  const t = getT(locale);

  // Map einheit_id → vocab_set
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [editingSet, setEditingSet] = useState<VocabSet | null>(null);

  useEffect(() => {
    if (loading) return;
    fetchData();
  }, [loading]);

  async function fetchData() {
    setDataLoading(true);

    // Fetch vocab_sets that map to the 6 einheiten (by einheit_id)
    const { data, error } = await supabase
      .from("vocab_sets")
      .select("*")
      .order("order_index", { ascending: true });

    if (!error && data) {
      const sets = data as VocabSet[];
      setVocabSets(sets);

      // Exercise counts per set
      const counts: Record<string, number> = {};
      await Promise.all(
        sets.map(async (s) => {
          const { count } = await supabase
            .from("exercises")
            .select("*", { count: "exact", head: true })
            .eq("set_id", s.id)
            .eq("pillar", "wortschatz");
          counts[s.id] = count ?? 0;
        })
      );
      setExerciseCounts(counts);
    }

    setDataLoading(false);
  }

  async function handlePublishToggle(vs: VocabSet) {
    await supabase
      .from("vocab_sets")
      .update({ is_published: !vs.is_published })
      .eq("id", vs.id);
    setVocabSets((prev) =>
      prev.map((s) => s.id === vs.id ? { ...s, is_published: !s.is_published } : s)
    );
  }

  function getVocabSetForEinheit(einheitId: string): VocabSet | null {
    return vocabSets.find((s) => s.einheit_id === einheitId) ?? null;
  }

  if (loading) return <Spinner />;

  return (
    <DashboardLayout navItems={navItems(t)} role="admin">
      <div style={TM}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ ...TM, fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
            Gestion du vocabulaire
          </h1>
          <p style={{ ...TM, color: "#6b7280", marginTop: 4 }}>
            Les 6 unités thématiques sont prédéfinies. Gérez leur contenu ci-dessous.
          </p>
        </div>

        {/* Einheit info bar */}
        <div style={{ background: "#fffbf0", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span style={{ ...TM, color: "#92400e" }}>
            Les titres des 6 Einheiten sont fixes et ne peuvent pas être modifiés. Vous pouvez modifier leur description et gérer leurs blocs de contenu.
          </span>
        </div>

        {/* Content */}
        {dataLoading ? (
          <Spinner />
        ) : (
          <div>
            {EINHEITEN.map((einheit) => {
              const vocabSet = getVocabSetForEinheit(einheit.id);
              return (
                <EinheitCard
                  key={einheit.id}
                  einheit={einheit}
                  vocabSet={vocabSet}
                  exerciseCount={vocabSet ? (exerciseCounts[vocabSet.id] ?? 0) : 0}
                  locale={locale as "fr" | "ar"}
                  onPublishToggle={handlePublishToggle}
                  onEditDesc={setEditingSet}
                />
              );
            })}
          </div>
        )}

        {/* Edit description dialog */}
        {editingSet && (
          <EditDescDialog
            vocabSet={editingSet}
            onClose={() => setEditingSet(null)}
            onSaved={() => { setEditingSet(null); fetchData(); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
