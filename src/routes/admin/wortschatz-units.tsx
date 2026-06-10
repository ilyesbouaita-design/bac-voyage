import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import BlockPicker from "@/components/learning/BlockPicker";
import { BlockEditor } from "@/components/learning/BlockEditor";
import { BLOCK_TYPES, type ContentBlockType } from "@/lib/learning-types";
import { LessonPlayer } from "@/components/learning/LessonPlayer";
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
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #FFB200", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
// Block type label helpers
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
          style={{ ...TM, background: "#FFB200", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}
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
// Lesson manager — bound to a grammar_topics anchor topic_id
// ---------------------------------------------------------------------------

interface LessonManagerProps {
  topicId: string;
  topicTitleFr: string;
  locale: "fr" | "ar";
}

function LessonManager({ topicId, topicTitleFr, locale }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitleFr, setNewTitleFr] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchLessons();
  }, [topicId]);

  async function fetchLessons() {
    setLoading(true);
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("topic_id", topicId)
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
      topic_id: topicId,
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
          Leçons — {topicTitleFr}
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
              placeholder="ex. Vocabulaire de base..."
              autoFocus
              style={{ ...TM, flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, outline: "none" }}
            />
            <button
              onClick={handleCreateLesson}
              disabled={creating}
              style={{
                ...TM, background: "#FFB200", color: "#fff", border: "none",
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
            background: "#FFB200", color: "#fff", border: "none",
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
// ensureWortschatzAnchor — find or create the grammar_topics anchor row
// for a given Einheit. Returns the topic id.
// ---------------------------------------------------------------------------

async function ensureWortschatzAnchor(einheit: Einheit): Promise<string> {
  const slug = `ws-${einheit.id}`; // e.g. "ws-einheit-01"

  // Try to find existing anchor
  const { data: existing } = await supabase
    .from("grammar_topics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Not found — create it
  const { data: inserted, error } = await supabase
    .from("grammar_topics")
    .insert({
      title_fr: `Wortschatz : ${einheit.title_fr}`,
      slug,
      is_published: true,
      order_index: Number(einheit.number),
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    throw new Error(`Impossible de créer l'ancre grammar_topics pour ${slug}: ${error?.message}`);
  }

  return inserted.id;
}

// ---------------------------------------------------------------------------
// Einheit card — one per the 6 preset Einheiten
// ---------------------------------------------------------------------------

interface EinheitCardProps {
  einheit: Einheit;
  lessonCount: number;
  locale: "fr" | "ar";
  onLessonCountChange: (einheitId: string, count: number) => void;
}

function EinheitCard({ einheit, lessonCount, locale, onLessonCountChange }: EinheitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [anchorTopicId, setAnchorTopicId] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorLoading, setAnchorLoading] = useState(false);
  const color = einheit.color;

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    // Lazily resolve the anchor topic_id the first time we expand
    if (next && !anchorTopicId && !anchorLoading) {
      setAnchorLoading(true);
      setAnchorError(null);
      try {
        const id = await ensureWortschatzAnchor(einheit);
        setAnchorTopicId(id);
      } catch (err: unknown) {
        setAnchorError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setAnchorLoading(false);
      }
    }
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px" }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 10, background: `${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {einheit.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...TM, fontWeight: 700, color: "#111827", fontSize: 13 }}>
              Einheit {einheit.number}: {einheit.title_de}
            </span>
            <span style={{
              ...TM,
              background: `${color}18`, color,
              padding: "2px 8px", borderRadius: 999, fontWeight: 600,
            }}>
              {locale === "ar" ? einheit.title_ar : einheit.title_fr}
            </span>
          </div>

          <div style={{ marginTop: 6 }}>
            <Badge color={color}>{lessonCount} leçon{lessonCount !== 1 ? "s" : ""}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={handleExpand}
            style={{
              ...TM, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 600,
              background: expanded ? color : `${color}22`,
              color: expanded ? "#fff" : color,
              border: "none",
            }}
          >
            {expanded ? "Fermer" : "Gérer les leçons"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          {anchorLoading ? (
            <Spinner />
          ) : anchorError ? (
            <div style={{ ...TM, color: "#FF5A5F", padding: "10px 0" }}>
              Erreur : {anchorError}
            </div>
          ) : anchorTopicId ? (
            <LessonManager
              topicId={anchorTopicId}
              topicTitleFr={`${einheit.icon} ${einheit.title_fr}`}
              locale={locale}
            />
          ) : null}
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

  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    fetchLessonCounts();
  }, [loading]);

  async function fetchLessonCounts() {
    setDataLoading(true);

    // For each einheit, look up its anchor slug and count published+unpublished lessons
    const counts: Record<string, number> = {};
    await Promise.all(
      EINHEITEN.map(async (einheit) => {
        const slug = `ws-${einheit.id}`;
        const { data: topicRow } = await supabase
          .from("grammar_topics")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (!topicRow?.id) {
          counts[einheit.id] = 0;
          return;
        }

        const { count } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("topic_id", topicRow.id);

        counts[einheit.id] = count ?? 0;
      })
    );

    setLessonCounts(counts);
    setDataLoading(false);
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
            Les 6 unités thématiques sont prédéfinies. Gérez leurs leçons ci-dessous.
          </p>
        </div>

        {/* Info bar */}
        <div style={{
          background: "#fffbf0", border: "1px solid #fde68a", borderRadius: 10,
          padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span style={{ ...TM, color: "#92400e" }}>
            Chaque Einheit possède un ancre dans grammar_topics (slug ws-einheit-XX) créée automatiquement à la première ouverture.
            Les leçons fonctionnent exactement comme en Grammaire active.
          </span>
        </div>

        {/* Einheit cards */}
        {dataLoading ? (
          <Spinner />
        ) : (
          <div>
            {EINHEITEN.map((einheit) => (
              <EinheitCard
                key={einheit.id}
                einheit={einheit}
                lessonCount={lessonCounts[einheit.id] ?? 0}
                locale={locale as "fr" | "ar"}
                onLessonCountChange={(id, count) =>
                  setLessonCounts((prev) => ({ ...prev, [id]: count }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
