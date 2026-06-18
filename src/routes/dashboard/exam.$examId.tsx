import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { LandscapeLock } from "@/components/exam/LandscapeLock";
import { ExamTextPanel } from "@/components/exam/ExamTextPanel";
import { SectionNav } from "@/components/exam/SectionNav";
import { RichtigFalschCard } from "@/components/exam/student/RichtigFalschCard";
import { FragenZumTextCard } from "@/components/exam/student/FragenZumTextCard";
import { KombinierenCard } from "@/components/exam/student/KombinierenCard";
import { ErgaenzenCard } from "@/components/exam/student/ErgaenzenCard";
import { TitelCard } from "@/components/exam/student/TitelCard";
import { SynonymGegenteilCard } from "@/components/exam/student/SynonymGegenteilCard";
import { UebersetzungCard } from "@/components/exam/student/UebersetzungCard";
import { WortbildungCard } from "@/components/exam/student/WortbildungCard";
import { GrammatikCard } from "@/components/exam/student/GrammatikCard";
import type {
  BacExamSection,
  BacExamQuestion,
  BacContent,
  VocabEntry,
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

export const Route = createFileRoute("/dashboard/exam/$examId")({
  component: StudentExamPage,
});

/* ---------- Font wrapper ---------- */
const tmr: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

/* ---------- Timer ---------- */
function useTimer(durationMinutes: number | null) {
  const [secondsLeft, setSecondsLeft] = useState(
    (durationMinutes ?? 180) * 60,
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ---------- Main Page ---------- */
function StudentExamPage() {
  const { examId } = useParams({ from: "/dashboard/exam/$examId" });
  const { loading: authLoading, userId } = useAuth("student");
  const { locale } = useLocale();
  const navigate = useNavigate();

  // Exam data
  const [exam, setExam] = useState<any>(null);
  const [sections, setSections] = useState<BacExamSection[]>([]);
  const [vocab, setVocab] = useState<VocabEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Text panel state
  const [textCollapsed, setTextCollapsed] = useState(false);
  const [textMode, setTextMode] = useState<"docked" | "floating">("docked");

  // Split divider state
  const [splitPercent, setSplitPercent] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(20, percent)));
    };

    const handleMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(20, percent)));
    };
    const handleTouchEnd = () => setDragging(false);

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging]);

  // Section nav
  const [activeSection, setActiveSection] = useState("");
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Answers state (keyed by question id)
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Results
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false); // loading state
  const [results, setResults] = useState<Record<string, any>>({});

  // Timer
  const timer = useTimer(exam?.duration_minutes ?? null);

  // Theme toggle
  function toggleTheme() {
    const el = document.documentElement;
    const dark = el.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  }

  // Fetch exam data
  useEffect(() => {
    if (authLoading || !userId) return;

    async function loadExam() {
      // Fetch exam
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (!examData) {
        navigate({ to: "/dashboard/bac" });
        return;
      }
      setExam(examData);

      // Fetch sections with questions
      const { data: sectionsData } = await supabase
        .from("exam_sections")
        .select("*")
        .eq("exam_id", examId)
        .order("order_index");

      if (!sectionsData) {
        setDataLoading(false);
        return;
      }

      const fullSections: BacExamSection[] = [];
      for (const sec of sectionsData) {
        const { data: questionsData } = await supabase
          .from("exam_questions")
          .select("*")
          .eq("section_id", sec.id)
          .order("order_index");

        fullSections.push({
          id: sec.id,
          title_fr: sec.title_fr ?? "",
          title_ar: sec.title_ar ?? "",
          kind: sec.kind,
          instructions_fr: sec.instructions_fr ?? "",
          passage_de: sec.passage_de ?? "",
          order_index: sec.order_index,
          questions: (questionsData ?? []).map((q: any) => ({
            id: q.id,
            type: q.type,
            bac_content: q.content as BacContent,
            prompt_fr: q.prompt_fr ?? "",
            prompt_de: q.prompt_de ?? "",
            points: q.points,
            grade_method: q.grade_method,
            order_index: q.order_index,
          })),
        });
      }

      setSections(fullSections);
      if (fullSections.length > 0) {
        setActiveSection(fullSections[0].id);
      }

      // Extract vocab from the first section's passage metadata if available
      // For now, vocab can be stored in section instructions or as a separate field
      setDataLoading(false);
    }

    loadExam();
  }, [authLoading, userId, examId, navigate]);

  // Update answer for a question
  const updateAnswer = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // Handle submit
  async function handleSubmit() {
    if (!userId || !exam) return;
    setSubmitting(true);

    // Create attempt
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        student_id: userId,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!attempt) return;

    // Save individual answers
    for (const section of sections) {
      for (const q of section.questions) {
        const response = answers[q.id] ?? null;
        await supabase.from("exam_answers").insert({
          attempt_id: attempt.id,
          question_id: q.id,
          response,
        });
      }
    }

    // Show loading screen for 3 seconds before revealing results
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setSubmitting(false);
    setSubmitted(true);
    // TODO: Trigger AI correction and load results
  }

  // Section nav scroll
  function scrollToSection(sectionId: string) {
    setActiveSection(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    if (el && rightPanelRef.current) {
      const containerTop = rightPanelRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      rightPanelRef.current.scrollBy({
        top: elTop - containerTop - 16,
        behavior: "smooth",
      });
    }
  }

  // Render question component based on bac_type
  function renderQuestion(q: BacExamQuestion) {
    const content = q.bac_content;
    if (!content || !("bac_type" in content)) return null;

    switch (content.bac_type) {
      case "richtig_falsch_zitat": {
        const c = content as RichtigFalschContent;
        return (
          <RichtigFalschCard
            key={q.id}
            statements={c.statements}
            onAnswersChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            results={results[q.id]}
          />
        );
      }
      case "fragen_zum_text": {
        const c = content as FragenZumTextContent;
        return (
          <FragenZumTextCard
            key={q.id}
            questions={[
              {
                id: q.id,
                question: c.question,
                points: q.points,
                reference_answer: c.reference_answer,
              },
            ]}
            onAnswersChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            results={results[q.id]}
          />
        );
      }
      case "kombinieren": {
        const c = content as KombinierenContent;
        return (
          <KombinierenCard
            key={q.id}
            left_items={c.left_items}
            right_items={c.right_items}
            answer_key={c.answer_key}
            onAnswersChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
          />
        );
      }
      case "ergaenzen": {
        const c = content as ErgaenzenContent;
        return (
          <ErgaenzenCard
            key={q.id}
            sentences={c.sentences}
            onAnswersChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
          />
        );
      }
      case "titel": {
        const c = content as TitelContent;
        return (
          <TitelCard
            key={q.id}
            accepted_titles={c.accepted_titles}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "synonym":
      case "gegenteil": {
        const c = content as SynonymContent | GegenteilContent;
        return (
          <SynonymGegenteilCard
            key={q.id}
            type={content.bac_type as "synonym" | "gegenteil"}
            sentence={c.sentence}
            target_word={c.target_word}
            gap_sentence={
              "gap_sentence" in c ? (c as GegenteilContent).gap_sentence : undefined
            }
            accepted_answers={c.accepted_answers}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "uebersetzung": {
        const c = content as UebersetzungContent;
        return (
          <UebersetzungCard
            key={q.id}
            german_sentence={c.german_sentence}
            accepted_translations={c.accepted_translations}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "kompositum_bilden": {
        const c = content as KompositumBildenContent;
        return (
          <WortbildungCard
            key={q.id}
            variant="kompositum_bilden"
            word1={c.word1}
            word2={c.word2}
            result={c.result}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
          />
        );
      }
      case "kompositum_loesen": {
        const c = content as KompositumLoesenContent;
        return (
          <WortbildungCard
            key={q.id}
            variant="kompositum_loesen"
            compound={c.compound}
            word1={c.word1}
            word2={c.word2}
            points={q.points}
            onAnswersChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
          />
        );
      }
      case "wortableitung": {
        const c = content as WortableitungContent;
        return (
          <WortbildungCard
            key={q.id}
            variant="wortableitung"
            source_type={c.source_type}
            target_type={c.target_type}
            word={c.word}
            hint={c.hint}
            accepted_answers={c.accepted_answers}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
          />
        );
      }
      case "grammatik_tempus": {
        const c = content as GrammatikTempusContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="tempus"
            tense={c.tense}
            original_sentence={c.original_sentence}
            correct_answer={c.correct_answer}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "grammatik_aktiv_passiv": {
        const c = content as GrammatikAktivPassivContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="aktiv_passiv"
            direction={c.direction}
            original_sentence={c.original_sentence}
            correct_answer={c.correct_answer}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "grammatik_satzbau": {
        const c = content as GrammatikSatzbauContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="satzbau"
            clause_type={c.clause_type}
            original_sentence={c.sentence1}
            sentence2={c.sentence2}
            correct_answer={c.correct_answer}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "grammatik_modalverb": {
        const c = content as GrammatikModalverbContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="modalverb"
            underlined_words={c.underlined_words}
            original_sentence={c.sentence}
            correct_answer={c.correct_answer}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "grammatik_konnektoren": {
        const c = content as GrammatikKonnektorenContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="konnektoren"
            konnektor_sentences={c.sentences}
            original_sentence=""
            correct_answer=""
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "grammatik_deklination": {
        const c = content as GrammatikDeklinationContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="deklination"
            template={c.template}
            original_sentence=""
            correct_answer=""
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      case "grammatik_fragen_stellen": {
        const c = content as GrammatikFragenStellenContent;
        return (
          <GrammatikCard
            key={q.id}
            variant="fragen_stellen"
            underlined_words={c.underlined_words}
            original_sentence={c.sentence}
            correct_answer={c.correct_question}
            points={q.points}
            onAnswerChange={(a) => updateAnswer(q.id, a)}
            showResults={submitted}
            result={results[q.id]}
          />
        );
      }
      default:
        return null;
    }
  }

  // Loading
  if (authLoading || dataLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        style={tmr}
      >
        <div className="w-10 h-10 border-4 border-[#6C4CE0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) return null;

  // Get passage from first section
  const passage =
    sections.find((s) => s.passage_de)?.passage_de ?? "";

  // Section nav items
  const navSections = sections.map((s, i) => ({
    id: s.id,
    label: `${["I", "II", "III", "IV"][i] ?? i + 1}. ${locale === "ar" ? s.title_ar || s.title_fr : s.title_fr}`,
    color:
      s.kind === "textverstaendnis"
        ? "#6C4CE0"
        : s.kind === "sprachfaehigkeit"
          ? "#0FB6A3"
          : "#FF5A5F",
  }));

  // Total points
  const totalPoints = sections.reduce(
    (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.points, 0),
    0,
  );

  return (
    <LandscapeLock>
      <div className="h-screen flex flex-col bg-background" style={tmr}>
        {/* Top bar */}
        <header
          className="h-12 flex items-center justify-between border-b border-border bg-card px-4 shrink-0"
          style={tmr}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/dashboard/bac" })}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <span className="font-bold" style={{ fontSize: "13px" }}>
              {locale === "ar"
                ? exam.title_ar || exam.title_fr
                : exam.title_fr}
            </span>
            {exam.cefr_level && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C4CE0]/10 text-[#6C4CE0]">
                {exam.cefr_level}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground" style={{ fontSize: "11px" }}>
              ⏱ {timer}
            </span>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 grid place-items-center rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              <span className="dark:hidden">🌙</span>
              <span className="hidden dark:inline">☀️</span>
            </button>
          </div>
        </header>

        {/* Main split view */}
        <div
          ref={containerRef}
          className="flex flex-1 min-h-0"
          style={{ userSelect: dragging ? "none" : undefined }}
        >
          {/* Text panel */}
          {textMode === "docked" && (
            <div
              className="border-e border-border overflow-hidden"
              style={{
                flex: textCollapsed ? "0 0 48px" : `0 0 ${splitPercent}%`,
                transition: dragging ? "none" : "flex-basis 0.3s ease",
              }}
            >
              <ExamTextPanel
                passage={passage}
                vocab={vocab}
                collapsed={textCollapsed}
                onToggleCollapse={() => setTextCollapsed((c) => !c)}
                mode="docked"
                onToggleMode={() => {
                  setTextMode("floating");
                  setTextCollapsed(false);
                }}
              />
            </div>
          )}

          {/* Draggable divider */}
          {textMode === "docked" && !textCollapsed && (
            <div
              onMouseDown={handleDividerMouseDown}
              onTouchStart={(e) => { e.preventDefault(); setDragging(true); }}
              style={{
                width: dragging ? "8px" : "12px",
                minWidth: dragging ? "8px" : "12px",
                cursor: "col-resize",
                background: dragging ? "#6C4CE0" : "transparent",
                borderLeft: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: dragging ? "none" : "all 0.2s",
                userSelect: "none",
                position: "relative",
                zIndex: 10,
              }}
              className="hover:bg-[#6C4CE0]/10 group"
            >
              {/* Grip dots */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "center" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: dragging ? "#fff" : "#6C4CE0", opacity: dragging ? 1 : 0.4 }} />
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: dragging ? "#fff" : "#6C4CE0", opacity: dragging ? 1 : 0.4 }} />
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: dragging ? "#fff" : "#6C4CE0", opacity: dragging ? 1 : 0.4 }} />
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: dragging ? "#fff" : "#6C4CE0", opacity: dragging ? 1 : 0.4 }} />
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: dragging ? "#fff" : "#6C4CE0", opacity: dragging ? 1 : 0.4 }} />
              </div>
            </div>
          )}

          {/* Floating text panel */}
          {textMode === "floating" && (
            <ExamTextPanel
              passage={passage}
              vocab={vocab}
              collapsed={false}
              onToggleCollapse={() => {}}
              mode="floating"
              onToggleMode={() => setTextMode("docked")}
            />
          )}

          {/* Questions panel — always flex:1 to fill remaining space */}
          <div
            ref={rightPanelRef}
            className="overflow-y-auto"
            style={{
              overscrollBehavior: "contain",
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Section nav */}
            {navSections.length > 0 && (
              <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-2">
                <SectionNav
                  sections={navSections}
                  activeSection={activeSection}
                  onSectionClick={scrollToSection}
                />
              </div>
            )}

            {/* Sections and questions */}
            <div className="p-4 space-y-8" style={tmr}>
              {sections.map((section, si) => (
                <div key={section.id} id={`section-${section.id}`}>
                  {/* Section header */}
                  <div
                    className="mb-4 pb-2 border-b-2"
                    style={{
                      borderColor:
                        section.kind === "textverstaendnis"
                          ? "#6C4CE0"
                          : section.kind === "sprachfaehigkeit"
                            ? "#0FB6A3"
                            : "#FF5A5F",
                    }}
                  >
                    <h2
                      className="font-bold"
                      style={{ fontSize: "14px", ...tmr }}
                    >
                      {["I", "II", "III"][si]}.{" "}
                      {locale === "ar"
                        ? section.title_ar || section.title_fr
                        : section.title_fr}
                    </h2>
                    {section.instructions_fr && (
                      <p
                        className="text-muted-foreground mt-1 italic"
                        style={{ fontSize: "11px" }}
                      >
                        {section.instructions_fr}
                      </p>
                    )}
                  </div>

                  {/* Questions */}
                  <div className="space-y-5">
                    {section.questions.map((q) => renderQuestion(q))}
                  </div>
                </div>
              ))}

              {/* Submit bar */}
              {!submitted && !submitting && (
                <div className="pt-6 pb-4">
                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg"
                    style={{
                      background: "linear-gradient(90deg, #FF5A5F, #6C4CE0)",
                      fontSize: "13px",
                      fontFamily: "'Times New Roman', Georgia, serif",
                      transition: "transform 180ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 180ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(108,76,224,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = ""; }}
                  >
                    💾 Soumettre l&apos;examen
                  </button>
                  <p
                    className="text-center text-muted-foreground mt-2"
                    style={{ fontSize: "10px" }}
                  >
                    Une fois soumis, vous ne pourrez plus modifier vos
                    r&eacute;ponses.
                  </p>
                </div>
              )}

              {/* Loading screen after submit */}
              {submitting && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
                  style={{ background: "rgba(15,10,40,0.92)", backdropFilter: "blur(8px)" }}>
                  <style>{`@keyframes pulse-ring { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }`}</style>
                  {/* Animated brain/AI icon */}
                  <div style={{ fontSize: "56px", animation: "pulse-ring 1.5s ease-in-out infinite" }}>🤖</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <p style={{ color: "#fff", fontFamily: "'Times New Roman',serif", fontSize: "16px", fontWeight: "bold" }}>
                      Correction en cours...
                    </p>
                    <p style={{ color: "#c4b8e8", fontFamily: "'Times New Roman',serif", fontSize: "12px" }}>
                      L'IA analyse vos réponses
                    </p>
                  </div>
                  {/* Animated dots progress bar */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} style={{
                        width: "10px", height: "10px", borderRadius: "50%",
                        background: "#6C4CE0",
                        animation: `pulse-ring 1s ease-in-out ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Score (after submit) */}
              {submitted && (
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p
                    className="font-bold text-[#0FB6A3]"
                    style={{ fontSize: "14px" }}
                  >
                    Examen soumis avec succ&egrave;s !
                  </p>
                  <p
                    className="text-muted-foreground mt-1"
                    style={{ fontSize: "11px" }}
                  >
                    Vos r&eacute;ponses sont en cours de correction par l&apos;IA.
                  </p>
                  <button
                    onClick={() => navigate({ to: "/dashboard/bac" })}
                    className="mt-4 px-6 py-2 rounded-xl border border-border hover:bg-accent transition-colors"
                    style={{ fontSize: "12px" }}
                  >
                    Retour aux examens
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LandscapeLock>
  );
}
