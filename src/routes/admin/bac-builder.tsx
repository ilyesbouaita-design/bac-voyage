import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { EINHEITEN } from "@/lib/einheiten";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminTextPassageEditor } from "@/components/exam/admin/AdminTextPassageEditor";
import { ExamTextPanel } from "@/components/exam/ExamTextPanel";
import { SectionNav } from "@/components/exam/SectionNav";
import { LandscapeLock } from "@/components/exam/LandscapeLock";
import type {
  VocabEntry,
  BacContent,
  RichtigFalschContent,
  FragenZumTextContent,
  KombinierenContent,
  ErgaenzenContent,
  TitelContent,
  SynonymContent,
  GegenteilContent,
  UebersetzungContent,
  KompositumBildenContent,
  KompositumLoesenContent,
  WortableitungContent,
  GrammatikTempusContent,
  GrammatikAktivPassivContent,
  GrammatikSatzbauContent,
  GrammatikModalverbContent,
  GrammatikKonnektorenContent,
  GrammatikDeklinationContent,
  GrammatikFragenStellenContent,
} from "@/lib/bac-types";

// Lazy import admin editors (they will be loaded when available)
import { AdminRichtigFalschEditor } from "@/components/exam/admin/AdminRichtigFalschEditor";
import { AdminFragenEditor } from "@/components/exam/admin/AdminFragenEditor";
import { AdminKombinierenEditor } from "@/components/exam/admin/AdminKombinierenEditor";
import { AdminErgaenzenEditor } from "@/components/exam/admin/AdminErgaenzenEditor";
import { AdminTitelEditor } from "@/components/exam/admin/AdminTitelEditor";
import { AdminSynonymGegenteilEditor } from "@/components/exam/admin/AdminSynonymGegenteilEditor";
import { AdminUebersetzungEditor } from "@/components/exam/admin/AdminUebersetzungEditor";
import { AdminWortbildungEditor } from "@/components/exam/admin/AdminWortbildungEditor";
import { AdminGrammatikEditor } from "@/components/exam/admin/AdminGrammatikEditor";

// Student preview components
import { RichtigFalschCard } from "@/components/exam/student/RichtigFalschCard";
import { FragenZumTextCard } from "@/components/exam/student/FragenZumTextCard";
import { KombinierenCard } from "@/components/exam/student/KombinierenCard";
import { ErgaenzenCard } from "@/components/exam/student/ErgaenzenCard";
import { TitelCard } from "@/components/exam/student/TitelCard";
import { SynonymGegenteilCard } from "@/components/exam/student/SynonymGegenteilCard";
import { UebersetzungCard } from "@/components/exam/student/UebersetzungCard";
import { WortbildungCard } from "@/components/exam/student/WortbildungCard";
import { GrammatikCard } from "@/components/exam/student/GrammatikCard";

export const Route = createFileRoute("/admin/bac-builder")({
  component: BacBuilderPage,
});

const tmr: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

/* ---------- Sidebar nav (same as other admin pages) ---------- */
function getNavItems(t: any) {
  return [
    {
      label: t.sidebar_overview,
      to: "/admin",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      label: t.sidebar_exams,
      to: "/admin/exams",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    {
      label: t.sidebar_grammar,
      to: "/admin/grammatik-units",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      ),
    },
    {
      label: t.sidebar_vocabulary,
      to: "/admin/wortschatz-units",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
  ];
}

/* ---------- Types for exam state ---------- */
interface ExamMetadata {
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
  einheit: string;
  cefr_level: string;
  duration_minutes: number;
}

interface QuestionSlot {
  id: string;
  bac_type: string;
  content: any;
  points: number;
  prompt_fr: string;
}

/* ---------- Main Component ---------- */
function BacBuilderPage() {
  const { loading: authLoading, userId, displayName } = useAuth("admin");
  const { locale } = useLocale();
  const t = dashboardTranslations[locale as keyof typeof dashboardTranslations] ?? dashboardTranslations.fr;
  const navigate = useNavigate();

  // Mode: edit or preview
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  // Exam metadata
  const [meta, setMeta] = useState<ExamMetadata>({
    title_fr: "",
    title_ar: "",
    description_fr: "",
    description_ar: "",
    einheit: "einheit-01",
    cefr_level: "",
    duration_minutes: 90,
  });

  // Text passage
  const [passage, setPassage] = useState("");
  const [vocab, setVocab] = useState<VocabEntry[]>([]);

  // Textverständnis questions
  const [richtigFalsch, setRichtigFalsch] = useState<RichtigFalschContent>({
    bac_type: "richtig_falsch_zitat",
    statements: [
      { text: "", is_richtig: true, zitat: "", points: 1.75 },
      { text: "", is_richtig: true, zitat: "", points: 1.75 },
      { text: "", is_richtig: false, zitat: "", points: 1.75 },
      { text: "", is_richtig: true, zitat: "", points: 1.75 },
    ],
  });

  const [fragen, setFragen] = useState<Array<{ id: string; content: FragenZumTextContent; points: number }>>([
    { id: "fq1", content: { bac_type: "fragen_zum_text", question: "", reference_answer: "" }, points: 2 },
    { id: "fq2", content: { bac_type: "fragen_zum_text", question: "", reference_answer: "" }, points: 2 },
    { id: "fq3", content: { bac_type: "fragen_zum_text", question: "", reference_answer: "" }, points: 2 },
  ]);

  const [kombinieren, setKombinieren] = useState<KombinierenContent>({
    bac_type: "kombinieren",
    left_items: [
      { label: "a", text: "" }, { label: "b", text: "" },
      { label: "c", text: "" }, { label: "d", text: "" },
    ],
    right_items: [
      { label: "1", text: "" }, { label: "2", text: "" },
      { label: "3", text: "" }, { label: "4", text: "" },
    ],
    answer_key: { a: "", b: "", c: "", d: "" },
  });

  const [ergaenzen, setErgaenzen] = useState<ErgaenzenContent>({
    bac_type: "ergaenzen",
    sentences: [
      { text: "", blank_word: "" },
      { text: "", blank_word: "" },
      { text: "", blank_word: "" },
      { text: "", blank_word: "" },
    ],
  });

  const [titel, setTitel] = useState<TitelContent>({
    bac_type: "titel",
    accepted_titles: [""],
  });

  // Q3 type choice: "kombinieren" or "ergaenzen"
  const [q3Type, setQ3Type] = useState<"kombinieren" | "ergaenzen" | null>(null);

  // Sprachfähigkeit — Wortschatz
  const [synonym, setSynonym] = useState<SynonymContent>({
    bac_type: "synonym", sentence: "", target_word: "", accepted_answers: [""],
  });
  const [gegenteil, setGegenteil] = useState<GegenteilContent>({
    bac_type: "gegenteil", sentence: "", target_word: "", gap_sentence: "", accepted_answers: [""],
  });
  const [uebersetzung, setUebersetzung] = useState<UebersetzungContent>({
    bac_type: "uebersetzung", german_sentence: "", accepted_translations: [""],
  });
  const [wortbildung, setWortbildung] = useState<any>({
    bac_type: "kompositum_bilden", word1: "", word2: "", result: "",
  });
  const [wortableitung, setWortableitung] = useState<WortableitungContent>({
    bac_type: "wortableitung", source_type: "Adjektiv", target_type: "Substantiv",
    word: "", hint: "", accepted_answers: [{ article: "", word: "" }],
  });

  // Sprachfähigkeit — Grammatik
  const [gramm1, setGramm1] = useState<GrammatikTempusContent>({
    bac_type: "grammatik_tempus", tense: "Präteritum", original_sentence: "", correct_answer: "",
  });
  const [gramm2, setGramm2] = useState<GrammatikTempusContent>({
    bac_type: "grammatik_tempus", tense: "Präsens", original_sentence: "", correct_answer: "",
  });
  const [gramm3, setGramm3] = useState<GrammatikAktivPassivContent>({
    bac_type: "grammatik_aktiv_passiv", direction: "aktiv", original_sentence: "", correct_answer: "",
  });
  const [gramm4, setGramm4] = useState<any>(null); // admin chooses type
  const [gramm5, setGramm5] = useState<any>(null);
  const [gramm6, setGramm6] = useState<any>(null);

  // Preview panel state
  const [previewTextCollapsed, setPreviewTextCollapsed] = useState(false);
  const [previewTextMode, setPreviewTextMode] = useState<"docked" | "floating">("docked");

  // Calculate total points
  const totalPoints =
    richtigFalsch.statements.reduce((s, st) => s + st.points, 0) +
    fragen.reduce((s, f) => s + f.points, 0) +
    2 + // kombinieren/ergaenzen
    1 + // titel
    1 + // synonym
    1 + // gegenteil
    1.5 + // uebersetzung
    1 + // wortbildung
    1 + 1 + 1 + // gramm 1,2,3
    (gramm4 ? 1 : 0) + (gramm5 ? 1 : 0) + (gramm6 ? 1 : 0);

  // Save exam
  async function handleSave() {
    if (!meta.title_fr.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    setSaving(true);
    try {
      // 1. Create exam
      const { data: exam, error: examErr } = await supabase
        .from("exams")
        .insert({
          title_fr: meta.title_fr,
          title_ar: meta.title_ar || null,
          description_fr: meta.description_fr || null,
          description_ar: meta.description_ar || null,
          slug: meta.einheit || null,
          cefr_level: meta.cefr_level || null,
          duration_minutes: meta.duration_minutes || null,
          total_points: totalPoints,
          created_by: userId,
          is_published: false,
        })
        .select()
        .single();

      if (examErr || !exam) throw examErr || new Error("Failed to create exam");

      // 2. Create Textverständnis section
      const { data: tvSec } = await supabase
        .from("exam_sections")
        .insert({
          exam_id: exam.id,
          title_fr: "Textverständnis",
          title_ar: "فهم النص",
          kind: "textverstaendnis",
          order_index: 0,
          passage_de: passage,
          instructions_fr: "Lisez le texte et répondez aux questions.",
        })
        .select()
        .single();

      if (tvSec) {
        // R/F question
        await supabase.from("exam_questions").insert({
          section_id: tvSec.id,
          type: "true_false",
          content: richtigFalsch,
          prompt_fr: "Richtig oder falsch?",
          points: richtigFalsch.statements.reduce((s, st) => s + st.points, 0),
          grade_method: "ai",
          order_index: 0,
        });

        // Fragen
        for (let i = 0; i < fragen.length; i++) {
          await supabase.from("exam_questions").insert({
            section_id: tvSec.id,
            type: "short_text",
            content: fragen[i].content,
            prompt_fr: fragen[i].content.question,
            points: fragen[i].points,
            grade_method: "ai",
            order_index: i + 1,
          });
        }

        // Q3 — only save the selected type
        if (q3Type === "kombinieren") {
          await supabase.from("exam_questions").insert({
            section_id: tvSec.id,
            type: "matching",
            content: kombinieren,
            prompt_fr: "Was passt zusammen?",
            points: 2,
            grade_method: "auto",
            order_index: fragen.length + 1,
          });
        } else if (q3Type === "ergaenzen") {
          await supabase.from("exam_questions").insert({
            section_id: tvSec.id,
            type: "fill_blank",
            content: ergaenzen,
            prompt_fr: "Ergänzen Sie mit den passenden Wörtern!",
            points: 2,
            grade_method: "auto",
            order_index: fragen.length + 1,
          });
        }

        // Titel
        await supabase.from("exam_questions").insert({
          section_id: tvSec.id,
          type: "short_text",
          content: titel,
          prompt_fr: "Geben Sie dem Text einen Titel!",
          points: 1,
          grade_method: "ai",
          order_index: fragen.length + 2,
        });
      }

      // 3. Create Sprachfähigkeit section
      const { data: sfSec } = await supabase
        .from("exam_sections")
        .insert({
          exam_id: exam.id,
          title_fr: "Sprachfähigkeit",
          title_ar: "الكفاءة اللغوية",
          kind: "sprachfaehigkeit",
          order_index: 1,
          instructions_fr: "Wortschatz und Grammatik.",
        })
        .select()
        .single();

      if (sfSec) {
        let idx = 0;
        // Wortschatz
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "fill_blank", content: synonym,
          prompt_fr: "Synonym", points: 1, grade_method: "auto", order_index: idx++,
        });
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "fill_blank", content: gegenteil,
          prompt_fr: "Gegenteil", points: 1, grade_method: "auto", order_index: idx++,
        });
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "fill_blank", content: wortbildung,
          prompt_fr: "Wortbildung", points: 0.5, grade_method: "auto", order_index: idx++,
        });
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "fill_blank", content: wortableitung,
          prompt_fr: "Wortableitung", points: 0.5, grade_method: "auto", order_index: idx++,
        });
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "short_text", content: uebersetzung,
          prompt_fr: "Übersetzung", points: 1.5, grade_method: "ai", order_index: idx++,
        });

        // Grammatik 1-3
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "short_text", content: gramm1,
          prompt_fr: `Setzen Sie ins ${gramm1.tense}!`, points: 1, grade_method: "auto", order_index: idx++,
        });
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "short_text", content: gramm2,
          prompt_fr: `Setzen Sie ins ${gramm2.tense}!`, points: 1, grade_method: "auto", order_index: idx++,
        });
        await supabase.from("exam_questions").insert({
          section_id: sfSec.id, type: "short_text", content: gramm3,
          prompt_fr: gramm3.direction === "aktiv" ? "Bilden Sie Aktiv!" : "Setzen Sie ins Passiv!",
          points: 1, grade_method: "auto", order_index: idx++,
        });

        // Grammatik 4-6 (if set)
        for (const g of [gramm4, gramm5, gramm6]) {
          if (g) {
            await supabase.from("exam_questions").insert({
              section_id: sfSec.id, type: "short_text", content: g,
              prompt_fr: "Grammatik", points: 1, grade_method: "auto", order_index: idx++,
            });
          }
        }
      }

      toast.success("Examen enregistré avec succès !");
      navigate({ to: "/admin/exams" });
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Toggle theme
  function toggleTheme() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-[#6C4CE0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ============ PREVIEW MODE ============ */
  if (mode === "preview") {
    return (
      <LandscapeLock>
        <div className="h-screen flex flex-col bg-background" style={tmr}>
          {/* Preview banner */}
          <div
            className="h-8 flex items-center justify-between px-4 text-white shrink-0"
            style={{ background: "#6C4CE0", fontSize: "11px", ...tmr }}
          >
            <span>
              👁 Vous &ecirc;tes en mode aper&ccedil;u &mdash; Les &eacute;tudiants verront cette interface
            </span>
            <button
              onClick={() => setMode("edit")}
              className="px-3 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-[11px] font-medium"
              style={tmr}
            >
              Retour &agrave; l'&eacute;dition &rarr;
            </button>
          </div>

          {/* Top bar */}
          <header className="h-12 flex items-center justify-between border-b border-border bg-card px-4 shrink-0" style={tmr}>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ fontSize: "13px" }}>
                {meta.title_fr || "Nouvel examen"}
              </span>
              {meta.einheit && (() => {
                const e = EINHEITEN.find((u) => u.id === meta.einheit);
                return e ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C4CE0]/10 text-[#6C4CE0]">
                    {e.icon} Einheit {e.number}: {e.title_de}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
                ⏱ {meta.duration_minutes} min
              </span>
              <button onClick={toggleTheme} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-accent transition-colors">
                <span className="dark:hidden">🌙</span>
                <span className="hidden dark:inline">☀️</span>
              </button>
            </div>
          </header>

          {/* Split view */}
          <div className="flex flex-1 min-h-0">
            {previewTextMode === "docked" && (
              <div className={`border-e border-border transition-all duration-300 ${previewTextCollapsed ? "w-[48px]" : "w-1/2"} shrink-0`}>
                <ExamTextPanel
                  passage={passage}
                  vocab={vocab}
                  collapsed={previewTextCollapsed}
                  onToggleCollapse={() => setPreviewTextCollapsed((c) => !c)}
                  mode="docked"
                  onToggleMode={() => { setPreviewTextMode("floating"); setPreviewTextCollapsed(false); }}
                />
              </div>
            )}
            {previewTextMode === "floating" && (
              <ExamTextPanel
                passage={passage}
                vocab={vocab}
                collapsed={false}
                onToggleCollapse={() => {}}
                mode="floating"
                onToggleMode={() => setPreviewTextMode("docked")}
              />
            )}

            {/* Student questions preview */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ ...tmr, overscrollBehavior: "contain" }}>
              {/* Textverständnis */}
              <div>
                <div className="mb-3 pb-2 border-b-2" style={{ borderColor: "#6C4CE0" }}>
                  <h2 className="font-bold" style={{ fontSize: "14px", ...tmr }}>I. Textverst&auml;ndnis</h2>
                </div>
                <div className="space-y-4">
                  <RichtigFalschCard statements={richtigFalsch.statements} onAnswersChange={() => {}} />
                  <FragenZumTextCard
                    questions={fragen.map((f) => ({ id: f.id, question: f.content.question, points: f.points, reference_answer: f.content.reference_answer }))}
                    onAnswersChange={() => {}}
                  />
                  <KombinierenCard left_items={kombinieren.left_items} right_items={kombinieren.right_items} answer_key={kombinieren.answer_key} onAnswersChange={() => {}} />
                  <TitelCard accepted_titles={titel.accepted_titles} onAnswerChange={() => {}} />
                </div>
              </div>

              {/* Sprachfähigkeit */}
              <div>
                <div className="mb-3 pb-2 border-b-2" style={{ borderColor: "#0FB6A3" }}>
                  <h2 className="font-bold" style={{ fontSize: "14px", ...tmr }}>II. Sprachf&auml;higkeit</h2>
                </div>
                <div className="space-y-4">
                  <SynonymGegenteilCard type="synonym" sentence={synonym.sentence} target_word={synonym.target_word} accepted_answers={synonym.accepted_answers} points={1} onAnswerChange={() => {}} />
                  <SynonymGegenteilCard type="gegenteil" sentence={gegenteil.sentence} target_word={gegenteil.target_word} gap_sentence={gegenteil.gap_sentence} accepted_answers={gegenteil.accepted_answers} points={1} onAnswerChange={() => {}} />
                  <UebersetzungCard german_sentence={uebersetzung.german_sentence} accepted_translations={uebersetzung.accepted_translations} points={1.5} onAnswerChange={() => {}} />
                  {gramm1.original_sentence && (
                    <GrammatikCard variant="tempus" tense={gramm1.tense} original_sentence={gramm1.original_sentence} correct_answer={gramm1.correct_answer} points={1} onAnswerChange={() => {}} />
                  )}
                  {gramm2.original_sentence && (
                    <GrammatikCard variant="tempus" tense={gramm2.tense} original_sentence={gramm2.original_sentence} correct_answer={gramm2.correct_answer} points={1} onAnswerChange={() => {}} />
                  )}
                  {gramm3.original_sentence && (
                    <GrammatikCard variant="aktiv_passiv" direction={gramm3.direction} original_sentence={gramm3.original_sentence} correct_answer={gramm3.correct_answer} points={1} onAnswerChange={() => {}} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandscapeLock>
    );
  }

  /* ============ EDIT MODE ============ */
  return (
    <DashboardLayout
      t={t}
      locale={locale as any}
      onLocaleChange={() => {}}
      role="admin"
      displayName={displayName}
      navItems={getNavItems(t)}
    >
      <div style={tmr}>
        {/* Top bar with mode toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold" style={{ fontSize: "14px", ...tmr }}>
              Cr&eacute;er un examen Bac
            </h1>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>
              Remplissez toutes les sections puis enregistrez.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex rounded-full border border-border overflow-hidden">
              <button
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  mode === "edit" ? "bg-[#6C4CE0] text-white" : "text-muted-foreground hover:bg-accent"
                }`}
                style={tmr}
              >
                ✏️ &Eacute;dition
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  mode === "preview" ? "bg-[#6C4CE0] text-white" : "text-muted-foreground hover:bg-accent"
                }`}
                style={tmr}
              >
                👁 Aper&ccedil;u
              </button>
            </div>
            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl text-[11px] font-bold text-white bg-[#6C4CE0] hover:opacity-90 transition disabled:opacity-50"
              style={tmr}
            >
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Exam metadata */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5 mb-5">
          <h3 className="font-bold mb-4" style={{ fontSize: "13px", ...tmr }}>Informations g&eacute;n&eacute;rales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block mb-1 text-[12px] font-semibold text-foreground/80" style={tmr}>Titre (FR)</label>
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15" style={tmr} value={meta.title_fr} onChange={(e) => setMeta((m) => ({ ...m, title_fr: e.target.value }))} placeholder="Titre en fran&ccedil;ais..." />
            </div>
            <div>
              <label className="block mb-1 text-[12px] font-semibold text-foreground/80" style={tmr}>Titre (AR)</label>
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15" style={{ ...tmr, direction: "rtl" }} dir="rtl" value={meta.title_ar} onChange={(e) => setMeta((m) => ({ ...m, title_ar: e.target.value }))} placeholder="...العنوان بالعربية" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block mb-1 text-[12px] font-semibold text-foreground/80" style={tmr}>Einheit (Unit&eacute; th&eacute;matique)</label>
              <select className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15" style={tmr} value={meta.einheit} onChange={(e) => setMeta((m) => ({ ...m, einheit: e.target.value }))}>
                {EINHEITEN.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.icon} Einheit {e.number}: {e.title_de} &mdash; {e.title_fr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[12px] font-semibold text-foreground/80" style={tmr}>Dur&eacute;e (minutes)</label>
              <input type="number" className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15" style={tmr} value={meta.duration_minutes} onChange={(e) => setMeta((m) => ({ ...m, duration_minutes: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block mb-1 text-[12px] font-semibold text-foreground/80" style={tmr}>Niveau CECR <span className="font-normal text-muted-foreground">(optionnel)</span></label>
              <select className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none" style={tmr} value={meta.cefr_level} onChange={(e) => setMeta((m) => ({ ...m, cefr_level: e.target.value }))}>
                <option value="">— non sp&eacute;cifi&eacute; —</option>
                <option value="A1">A1</option><option value="A2">A2</option>
                <option value="B1">B1</option><option value="B2">B2</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text passage */}
        <div className="mb-5">
          <AdminTextPassageEditor passage={passage} onPassageChange={setPassage} vocab={vocab} onVocabChange={setVocab} />
        </div>

        {/* ======= TEXTVERSTÄNDNIS ======= */}
        <div className="mb-6">
          <div className="mb-3 pb-2 border-b-2" style={{ borderColor: "#6C4CE0" }}>
            <h2 className="font-bold" style={{ fontSize: "14px", ...tmr }}>
              I. Textverst&auml;ndnis
            </h2>
          </div>

          <div className="space-y-4">
            <AdminRichtigFalschEditor value={richtigFalsch} onChange={setRichtigFalsch} />
            <AdminFragenEditor questions={fragen} onChange={setFragen} />

            {/* Q3 — Choice: Kombinieren OR Ergänzen */}
            {q3Type === null ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-5">
                <p className="text-[11px] text-muted-foreground mb-3 font-semibold" style={tmr}>
                  Q3 — Choisissez le type d'exercice :
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setQ3Type("kombinieren")}
                    className="rounded-xl border-2 border-[#6C4CE0]/30 hover:border-[#6C4CE0] bg-[#6C4CE0]/5 hover:bg-[#6C4CE0]/10 p-4 text-left transition-all"
                    style={tmr}
                  >
                    <div className="font-bold text-[12px] text-[#6C4CE0] mb-1">Kombinieren Sie!</div>
                    <div className="text-[11px] text-muted-foreground">Faire correspondre des éléments (gauche ↔ droite)</div>
                  </button>
                  <button
                    onClick={() => setQ3Type("ergaenzen")}
                    className="rounded-xl border-2 border-[#0FB6A3]/30 hover:border-[#0FB6A3] bg-[#0FB6A3]/5 hover:bg-[#0FB6A3]/10 p-4 text-left transition-all"
                    style={tmr}
                  >
                    <div className="font-bold text-[12px] text-[#0FB6A3] mb-1">Ergänzen Sie mit den passenden Wörtern!</div>
                    <div className="text-[11px] text-muted-foreground">Compléter des phrases avec des mots</div>
                  </button>
                </div>
              </div>
            ) : q3Type === "kombinieren" ? (
              <div>
                <AdminKombinierenEditor value={kombinieren} onChange={setKombinieren} />
                <button
                  onClick={() => setQ3Type(null)}
                  className="mt-2 text-[11px] text-muted-foreground hover:text-[#6C4CE0] underline transition-colors"
                  style={tmr}
                >
                  Changer le type
                </button>
              </div>
            ) : (
              <div>
                <AdminErgaenzenEditor value={ergaenzen} onChange={setErgaenzen} />
                <button
                  onClick={() => setQ3Type(null)}
                  className="mt-2 text-[11px] text-muted-foreground hover:text-[#6C4CE0] underline transition-colors"
                  style={tmr}
                >
                  Changer le type
                </button>
              </div>
            )}

            <AdminTitelEditor value={titel} onChange={setTitel} />
          </div>
        </div>

        {/* ======= SPRACHFÄHIGKEIT ======= */}
        <div className="mb-6">
          <div className="mb-3 pb-2 border-b-2" style={{ borderColor: "#0FB6A3" }}>
            <h2 className="font-bold" style={{ fontSize: "14px", ...tmr }}>
              II. Sprachf&auml;higkeit
            </h2>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-[12px] text-muted-foreground mt-3" style={tmr}>Wortschatz</h3>
            <AdminSynonymGegenteilEditor type="synonym" value={synonym} onChange={setSynonym as any} />
            <AdminSynonymGegenteilEditor type="gegenteil" value={gegenteil} onChange={setGegenteil as any} />
            <AdminWortbildungEditor value={wortbildung} onChange={setWortbildung} />
            <AdminUebersetzungEditor value={uebersetzung} onChange={setUebersetzung} />

            <h3 className="font-bold text-[12px] text-muted-foreground mt-4" style={tmr}>Grammatik</h3>

            {/* Q1 — Tempus (simple: dropdown + sentence + answer) */}
            <div className="rounded-2xl border border-border bg-card p-4 mt-3" style={{ borderLeft: "4px solid #6C4CE0" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#6C4CE0]" style={tmr}>Q1</span>
                <span className="text-[11px]" style={tmr}>Setzen Sie ins</span>
                <select className="rounded-lg border border-border bg-secondary/40 px-2 py-1 text-[11px] font-bold outline-none focus:border-[#6C4CE0]" style={tmr} value={gramm1.tense} onChange={(e) => setGramm1((g) => ({ ...g, tense: e.target.value }))}>
                  <option value="Präteritum">Präteritum</option>
                  <option value="Präsens">Präsens</option>
                  <option value="Perfekt">Perfekt</option>
                  <option value="Futur">Futur</option>
                </select>
                <span className="text-[11px]" style={tmr}>!</span>
              </div>
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none mb-2 focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15" style={tmr} placeholder="Satz (Original)..." value={gramm1.original_sentence} onChange={(e) => setGramm1((g) => ({ ...g, original_sentence: e.target.value }))} />
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15" style={tmr} placeholder="Korrekte Antwort..." value={gramm1.correct_answer} onChange={(e) => setGramm1((g) => ({ ...g, correct_answer: e.target.value }))} />
            </div>

            {/* Q2 — Tempus (same simple layout) */}
            <div className="rounded-2xl border border-border bg-card p-4 mt-3" style={{ borderLeft: "4px solid #0FB6A3" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#0FB6A3]" style={tmr}>Q2</span>
                <span className="text-[11px]" style={tmr}>Setzen Sie ins</span>
                <select className="rounded-lg border border-border bg-secondary/40 px-2 py-1 text-[11px] font-bold outline-none focus:border-[#0FB6A3]" style={tmr} value={gramm2.tense} onChange={(e) => setGramm2((g) => ({ ...g, tense: e.target.value }))}>
                  <option value="Präsens">Präsens</option>
                  <option value="Präteritum">Präteritum</option>
                  <option value="Perfekt">Perfekt</option>
                  <option value="Futur">Futur</option>
                </select>
                <span className="text-[11px]" style={tmr}>!</span>
              </div>
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none mb-2 focus:border-[#0FB6A3] focus:ring-4 focus:ring-[#0FB6A3]/15" style={tmr} placeholder="Satz (Original)..." value={gramm2.original_sentence} onChange={(e) => setGramm2((g) => ({ ...g, original_sentence: e.target.value }))} />
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none focus:border-[#0FB6A3] focus:ring-4 focus:ring-[#0FB6A3]/15" style={tmr} placeholder="Korrekte Antwort..." value={gramm2.correct_answer} onChange={(e) => setGramm2((g) => ({ ...g, correct_answer: e.target.value }))} />
            </div>

            {/* Q3 — Passiv/Aktiv (simple: dropdown + sentence + answer) */}
            <div className="rounded-2xl border border-border bg-card p-4 mt-3" style={{ borderLeft: "4px solid #FFB200" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-[#FFB200]" style={tmr}>Q3</span>
                <select className="rounded-lg border border-border bg-secondary/40 px-2 py-1 text-[11px] font-bold outline-none focus:border-[#FFB200]" style={tmr} value={gramm3.direction} onChange={(e) => setGramm3((g) => ({ ...g, direction: e.target.value as "aktiv" | "passiv" }))}>
                  <option value="passiv">Setzen Sie ins Passiv!</option>
                  <option value="aktiv">Setzen Sie ins Aktiv!</option>
                </select>
              </div>
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none mb-2 focus:border-[#FFB200] focus:ring-4 focus:ring-[#FFB200]/15" style={tmr} placeholder="Satz (Original)..." value={gramm3.original_sentence} onChange={(e) => setGramm3((g) => ({ ...g, original_sentence: e.target.value }))} />
              <input className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none focus:border-[#FFB200] focus:ring-4 focus:ring-[#FFB200]/15" style={tmr} placeholder="Korrekte Antwort..." value={gramm3.correct_answer} onChange={(e) => setGramm3((g) => ({ ...g, correct_answer: e.target.value }))} />
            </div>
            <AdminGrammatikEditor value={gramm4} onChange={setGramm4} grammarType="choice_4" />
            <AdminGrammatikEditor value={gramm5} onChange={setGramm5} grammarType="choice_5" />
            <AdminGrammatikEditor value={gramm6} onChange={setGramm6} grammarType="choice_6" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-4 flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: "11px", ...tmr }}>
            Total des points : <strong className="text-foreground">{totalPoints} pts</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ to: "/admin/exams" })}
              className="px-4 py-2 rounded-xl border border-border text-[11px] font-medium hover:bg-accent transition-colors"
              style={tmr}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl text-[11px] font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #6C4CE0, #FF5A5F)", ...tmr }}
            >
              {saving ? "Enregistrement..." : "Enregistrer l'examen"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
