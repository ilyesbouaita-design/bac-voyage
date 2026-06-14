import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import BlockPicker from "@/components/learning/BlockPicker";
import { BlockEditor } from "@/components/learning/BlockEditor";
import { BLOCK_TYPES, type ContentBlockType } from "@/lib/learning-types";
import { LessonPlayer } from "@/components/learning/LessonPlayer";

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
  slug?: string;
  is_published: boolean;
  order_index: number;
}

interface LessonBlock {
  id: string;
  type: string;
  title_fr: string;
  content: Record<string, unknown>;
  points: number;
  order_index: number;
}

interface Lesson {
  id: string;
  topic_id: string;
  title_fr: string;
  title_ar?: string | null;
  body_fr: { blocks: LessonBlock[] } | null;
  body_ar?: unknown | null;
  order_index: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

// Rotating lesson border colours
const LESSON_COLORS = ["#6C4CE0", "#0FB6A3", "#FFB200", "#FF5A5F"];

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
// Compact block row (inside an expanded lesson)
// ---------------------------------------------------------------------------

interface LessonBlockRowProps {
  block: LessonBlock;
  index: number;
  onDelete: (id: string) => void;
}

function LessonBlockRow({ block, index, onDelete }: LessonBlockRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = blockTypeColor(block.type);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      marginBottom: 4,
    }}>
      <span style={{ ...TM, color: "#9ca3af", minWidth: 18 }}>#{index + 1}</span>

      <span style={{
        ...TM,
        background: `${color}22`,
        color,
        padding: "1px 6px",
        borderRadius: 999,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontSize: 11,
      }}>
        {blockTypeLabel(block.type)}
      </span>

      <span style={{ ...TM, flex: 1, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {block.title_fr || "(sans titre)"}
      </span>

      {block.points > 0 && (
        <span style={{ ...TM, color: "#6C4CE0", fontWeight: 600, fontSize: 11 }}>{block.points} pts</span>
      )}

      {confirmDelete ? (
        <span style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onDelete(block.id)}
            style={{ ...TM, background: "#FF5A5F", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}
          >
            Confirmer
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11 }}
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{ ...TM, background: "none", border: "none", color: "#FF5A5F", cursor: "pointer", padding: "1px 5px", fontSize: 12 }}
          title="Supprimer ce bloc"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New block form for lessons (appends to lesson.body_fr.blocks)
// ---------------------------------------------------------------------------

interface NewLessonBlockFormProps {
  selectedType: ContentBlockType;
  onSave: (block: Omit<LessonBlock, "id" | "order_index">) => void;
  onCancel: () => void;
}

function NewLessonBlockForm({ selectedType, onSave, onCancel }: NewLessonBlockFormProps) {
  const [titleFr, setTitleFr] = useState("");
  const [points, setPoints] = useState(10);
  const [content, setContent] = useState<Record<string, unknown>>({});

  const color = blockTypeColor(selectedType);

  function handleSave() {
    onSave({ type: selectedType, title_fr: titleFr, content, points });
  }

  return (
    <div style={{
      background: "#f9fafb",
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    }}>
      {/* Visual block editor — proper forms for each type */}
      <BlockEditor
        type={selectedType}
        content={content}
        onChange={setContent}
        title={titleFr}
        onTitleChange={setTitleFr}
        points={points}
        onPointsChange={setPoints}
      />

      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button
          onClick={handleSave}
          style={{ ...TM, background: "#6C4CE0", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}
        >
          Enregistrer le bloc
        </button>
        <button
          onClick={onCancel}
          style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single lesson card (collapsible, shows its blocks)
// ---------------------------------------------------------------------------

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  locale: "fr" | "ar";
  onPublishToggle: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onBlocksChanged: (lessonId: string, blocks: LessonBlock[]) => void;
  onPreview: (lesson: Lesson) => void;
}

function LessonCard({ lesson, index, locale, onPublishToggle, onDelete, onBlocksChanged, onPreview }: LessonCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingType, setPendingType] = useState<ContentBlockType | null>(null);
  const [saving, setSaving] = useState(false);

  const lessonColor = LESSON_COLORS[index % LESSON_COLORS.length];
  const blocks: LessonBlock[] = lesson.body_fr?.blocks ?? [];

  async function saveBlocks(newBlocks: LessonBlock[]) {
    setSaving(true);
    await supabase
      .from("lessons")
      .update({ body_fr: { blocks: newBlocks } })
      .eq("id", lesson.id);
    setSaving(false);
    onBlocksChanged(lesson.id, newBlocks);
  }

  function handleDeleteBlock(blockId: string) {
    const updated = blocks.filter((b) => b.id !== blockId);
    saveBlocks(updated);
  }

  function handleAddBlock(partial: Omit<LessonBlock, "id" | "order_index">) {
    const newBlock: LessonBlock = {
      ...partial,
      id: crypto.randomUUID(),
      order_index: blocks.length,
    };
    const updated = [...blocks, newBlock];
    saveBlocks(updated);
    setPendingType(null);
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderLeft: `4px solid ${lessonColor}`,
      borderRadius: 8,
      marginBottom: 8,
      overflow: "hidden",
    }}>
      {/* Lesson header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        {/* Number badge */}
        <span style={{
          ...TM,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 22, height: 22, borderRadius: "50%",
          background: `${lessonColor}22`, color: lessonColor, fontWeight: 700, fontSize: 11,
          flexShrink: 0,
        }}>
          {index + 1}
        </span>

        {/* Title */}
        <span style={{ ...TM, fontWeight: 700, color: "#111827", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lesson.title_fr}
        </span>

        {/* Block count */}
        <Badge color={lessonColor}>{blocks.length} bloc{blocks.length !== 1 ? "s" : ""}</Badge>

        {/* Published badge */}
        <span style={{
          ...TM,
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 7px", borderRadius: 999,
          background: lesson.is_published ? "#dcfce7" : "#f3f4f6",
          color: lesson.is_published ? "#16a34a" : "#6b7280",
          fontWeight: 600, fontSize: 11,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: lesson.is_published ? "#16a34a" : "#9ca3af", display: "inline-block" }} />
          {lesson.is_published ? "Publié" : "Brouillon"}
        </span>

        {/* Actions */}
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => onPreview(lesson)}
            style={{
              ...TM, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
              background: "#f0f9ff",
              color: "#0369a1",
              border: "none",
            }}
            title="Tester cette leçon avant publication"
          >
            ▶ Aperçu
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              ...TM, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
              background: expanded ? lessonColor : `${lessonColor}22`,
              color: expanded ? "#fff" : lessonColor,
              border: "none",
            }}
          >
            {expanded ? "Fermer" : "Modifier"}
          </button>
          <button
            onClick={() => onPublishToggle(lesson)}
            style={{
              ...TM, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
              background: lesson.is_published ? "#fef2f2" : "#dcfce7",
              color: lesson.is_published ? "#dc2626" : "#16a34a",
              border: "none",
            }}
          >
            {lesson.is_published ? "Dépublier" : "Publier"}
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(lesson.id)}
                style={{ ...TM, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: "#FF5A5F", color: "#fff", border: "none", fontWeight: 600, fontSize: 11 }}
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ ...TM, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: "#f3f4f6", color: "#374151", border: "none", fontSize: 11 }}
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ ...TM, padding: "4px 10px", borderRadius: 6, cursor: "pointer", background: "#fef2f2", color: "#dc2626", border: "none", fontSize: 11 }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Expanded: blocks */}
      {expanded && (
        <div style={{ padding: "0 14px 14px 14px", borderTop: "1px solid #f3f4f6" }}>
          <div style={{ marginTop: 10 }}>
            {blocks.length === 0 ? (
              <p style={{ ...TM, color: "#9ca3af", marginBottom: 8 }}>Aucun bloc dans cette leçon.</p>
            ) : (
              blocks.map((block, bi) => (
                <LessonBlockRow key={block.id} block={block} index={bi} onDelete={handleDeleteBlock} />
              ))
            )}
          </div>

          {pendingType && (
            <NewLessonBlockForm
              selectedType={pendingType}
              onSave={handleAddBlock}
              onCancel={() => setPendingType(null)}
            />
          )}

          {!pendingType && (
            <button
              onClick={() => setShowPicker(true)}
              style={{
                ...TM, marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5,
                background: lessonColor, color: "#fff", border: "none",
                borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontSize: 11,
              }}
            >
              <span style={{ fontSize: 13 }}>+</span> Ajouter un bloc
            </button>
          )}

          {saving && <span style={{ ...TM, color: "#6b7280", marginLeft: 8, fontSize: 11 }}>Enregistrement…</span>}

          {showPicker && (
            <BlockPicker
              locale={locale}
              onSelect={(type) => { setShowPicker(false); setPendingType(type); }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lesson manager — replaces the old UnitContentEditor
// ---------------------------------------------------------------------------

interface LessonManagerProps {
  unit: GrammarUnit;
  locale: "fr" | "ar";
}

function LessonManager({ unit, locale }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitleFr, setNewTitleFr] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [unit.id]);

  async function fetchLessons() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("topic_id", unit.id)
      .order("order_index", { ascending: true });
    if (!error && data) setLessons(data as Lesson[]);
    setLoading(false);
  }

  async function handleCreateLesson() {
    if (!newTitleFr.trim()) { setCreateError("Le titre est requis."); return; }
    setCreating(true);
    setCreateError(null);
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order_index)) + 1 : 0;
    const { error } = await supabase.from("lessons").insert({
      topic_id: unit.id,
      title_fr: newTitleFr.trim(),
      order_index: nextOrder,
      is_published: false,
      body_fr: { blocks: [] },
    });
    if (error) { setCreateError(error.message); setCreating(false); return; }
    setNewTitleFr("");
    setShowAddForm(false);
    setCreating(false);
    fetchLessons();
  }

  async function handlePublishToggle(lesson: Lesson) {
    await supabase.from("lessons").update({ is_published: !lesson.is_published }).eq("id", lesson.id);
    setLessons((prev) => prev.map((l) => l.id === lesson.id ? { ...l, is_published: !l.is_published } : l));
  }

  async function handleDeleteLesson(id: string) {
    await supabase.from("lessons").delete().eq("id", id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }

  function handleBlocksChanged(lessonId: string, blocks: LessonBlock[]) {
    setLessons((prev) =>
      prev.map((l) => l.id === lessonId ? { ...l, body_fr: { blocks } } : l)
    );
  }

  // Fullscreen preview overlay
  if (previewLesson) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#fff", display: "flex", flexDirection: "column" }}>
        {/* Banner */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#fef3c7",
          borderBottom: "2px solid #f59e0b",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
        }}>
          <span style={{ fontWeight: 700, color: "#92400e" }}>
            Mode apercu — Vous testez cette leçon : <em>{previewLesson.title_fr}</em>
          </span>
          <button
            onClick={() => setPreviewLesson(null)}
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              background: "#92400e",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "5px 14px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Retour a l'edition
          </button>
        </div>
        {/* Player */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <LessonPlayer
            lessonTitle={previewLesson.title_fr}
            blocks={previewLesson.body_fr?.blocks ?? []}
            onComplete={() => setPreviewLesson(null)}
            onExit={() => setPreviewLesson(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, padding: "14px 16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ ...TM, fontWeight: 700, color: "#374151", margin: 0 }}>
          Leçons — {unit.title_fr}
        </p>
        <span style={{ ...TM, color: "#6b7280", fontSize: 11 }}>
          {lessons.length} leçon{lessons.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : lessons.length === 0 ? (
        <p style={{ ...TM, color: "#9ca3af", marginBottom: 10 }}>Aucune leçon pour l'instant.</p>
      ) : (
        <div>
          {lessons.map((lesson, i) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={i}
              locale={locale}
              onPublishToggle={handlePublishToggle}
              onDelete={handleDeleteLesson}
              onBlocksChanged={handleBlocksChanged}
              onPreview={setPreviewLesson}
            />
          ))}
        </div>
      )}

      {/* Add lesson inline form */}
      {showAddForm ? (
        <div style={{
          marginTop: 10,
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          padding: 12,
        }}>
          <label style={{ ...TM, display: "block", fontWeight: 600, color: "#374151", marginBottom: 4 }}>
            Titre de la leçon (FR)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newTitleFr}
              onChange={(e) => setNewTitleFr(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateLesson(); }}
              placeholder="ex. Introduction aux verbes..."
              autoFocus
              style={{ ...TM, flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none" }}
            />
            <button
              onClick={handleCreateLesson}
              disabled={creating}
              style={{
                ...TM, background: "#6C4CE0", color: "#fff", border: "none",
                borderRadius: 6, padding: "6px 14px", cursor: creating ? "not-allowed" : "pointer",
                opacity: creating ? 0.7 : 1, fontWeight: 600,
              }}
            >
              {creating ? "Création…" : "Créer"}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewTitleFr(""); setCreateError(null); }}
              style={{ ...TM, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}
            >
              Annuler
            </button>
          </div>
          {createError && <p style={{ ...TM, color: "#FF5A5F", marginTop: 6 }}>{createError}</p>}
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            ...TM, marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
            background: "#6C4CE0", color: "#fff", border: "none",
            borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 14 }}>+</span> Ajouter une leçon
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit card
// ---------------------------------------------------------------------------

interface UnitCardProps {
  unit: GrammarUnit;
  lessonCount: number;
  locale: "fr" | "ar";
  onPublishToggle: (unit: GrammarUnit) => void;
  onDelete: (id: string) => void;
  onEdit: (unit: GrammarUnit) => void;
}

function UnitCard({ unit, lessonCount, locale, onPublishToggle, onDelete, onEdit }: UnitCardProps) {
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
            <Badge color={color}>{lessonCount} leçon{lessonCount !== 1 ? "s" : ""}</Badge>
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
          <LessonManager unit={unit} locale={locale} />
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
        description_fr: descFr.trim() || null,
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
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
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
      // Exclude Wortschatz anchor topics (slug starts with "ws-")
      const fetchedUnits = (data as GrammarUnit[]).filter(
        (u) => !(u.slug && u.slug.startsWith("ws-"))
      );
      setUnits(fetchedUnits);

      // Fetch lesson counts per unit
      const counts: Record<string, number> = {};
      await Promise.all(
        fetchedUnits.map(async (u) => {
          const { count } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", u.id);
          counts[u.id] = count ?? 0;
        })
      );
      setLessonCounts(counts);
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
                lessonCount={lessonCounts[unit.id] ?? 0}
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
