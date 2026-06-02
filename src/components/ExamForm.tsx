import { useState, useCallback, useMemo } from "react";
import type { DashboardTranslations } from "@/lib/i18n-dashboard";
import {
  examFormTranslations,
  type ExamFormTranslations,
} from "@/lib/i18n-exam-form";
import type { Locale } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Exported data types
// ---------------------------------------------------------------------------

export interface QuestionData {
  id?: string;
  type:
    | "mcq"
    | "true_false"
    | "fill_blank"
    | "cloze"
    | "matching"
    | "ordering"
    | "short_text"
    | "essay";
  prompt_fr: string;
  prompt_ar: string;
  content: any;
  points: number;
  grade_method: "auto" | "ai" | "manual";
}

export interface SectionData {
  id?: string;
  title_fr: string;
  title_ar: string;
  instructions_fr: string;
  passage_de: string;
  kind: "reading" | "writing" | "grammar" | "vocabulary";
  questions: QuestionData[];
}

export interface ExamData {
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
  cefr_level: "A1" | "A2" | "B1" | "B2" | "";
  duration_minutes: number;
  sections: SectionData[];
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export interface ExamFormProps {
  t: DashboardTranslations;
  locale: "fr" | "ar";
  initialExam?: ExamData;
  onSave: (data: ExamData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECTION_ACCENT_COLORS = [
  "border-brand-violet",
  "border-brand-gold",
  "border-brand-coral",
  "border-brand-teal",
] as const;

const SECTION_ACCENT_BG = [
  "bg-brand-violet/8",
  "bg-brand-gold/8",
  "bg-brand-coral/8",
  "bg-brand-teal/8",
] as const;

const KIND_BADGE_COLORS: Record<SectionData["kind"], string> = {
  reading: "bg-brand-violet/15 text-brand-violet",
  writing: "bg-brand-coral/15 text-brand-coral",
  grammar: "bg-brand-gold/15 text-brand-gold",
  vocabulary: "bg-brand-teal/15 text-brand-teal",
};

function defaultContentForType(type: QuestionData["type"]): any {
  switch (type) {
    case "mcq":
      return {
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
        ],
      };
    case "true_false":
      return { correct_answer: true };
    case "fill_blank":
      return { correct_answer: "", accept_alternatives: [] };
    case "short_text":
      return { sample_answer: "" };
    case "essay":
      return { max_words: 200 };
    case "matching":
      return {
        pairs: [
          { left: "", right: "" },
          { left: "", right: "" },
        ],
      };
    case "ordering":
      return { items: ["", ""] };
    case "cloze":
      return { text_with_blanks: "", answers: [] };
    default:
      return {};
  }
}

function newQuestion(): QuestionData {
  return {
    type: "mcq",
    prompt_fr: "",
    prompt_ar: "",
    content: defaultContentForType("mcq"),
    points: 1,
    grade_method: "auto",
  };
}

function newSection(): SectionData {
  return {
    title_fr: "",
    title_ar: "",
    instructions_fr: "",
    passage_de: "",
    kind: "reading",
    questions: [],
  };
}

// ---------------------------------------------------------------------------
// Shared tiny input components
// ---------------------------------------------------------------------------

const inputCls =
  "w-full rounded-xl border bg-secondary/40 px-4 py-3 text-sm outline-none transition focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/15";
const textareaCls =
  "w-full rounded-xl border bg-secondary/40 px-4 py-3 text-sm outline-none transition focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/15 resize-y min-h-[80px]";
const selectCls =
  "w-full rounded-xl border bg-secondary/40 px-4 py-3 text-sm outline-none transition focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/15 appearance-none cursor-pointer";
const labelCls = "block text-sm font-semibold text-foreground/80 mb-1.5";
const smallBtnCls =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition";

// ---------------------------------------------------------------------------
// MCQ Editor
// ---------------------------------------------------------------------------

function McqEditor({
  content,
  onChange,
  ef,
}: {
  content: { options: { text: string; is_correct: boolean }[] };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  const options = content.options ?? [];

  const setOptionText = (i: number, text: string) => {
    const next = options.map((o, idx) => (idx === i ? { ...o, text } : o));
    onChange({ ...content, options: next });
  };

  const setCorrect = (i: number) => {
    const next = options.map((o, idx) => ({
      ...o,
      is_correct: idx === i,
    }));
    onChange({ ...content, options: next });
  };

  const addOption = () => {
    onChange({
      ...content,
      options: [...options, { text: "", is_correct: false }],
    });
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, idx) => idx !== i);
    // Make sure at least one is correct
    if (!next.some((o) => o.is_correct) && next.length > 0) {
      next[0].is_correct = true;
    }
    onChange({ ...content, options: next });
  };

  return (
    <div className="space-y-3">
      <p className={labelCls}>{ef.mcqOptions}</p>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-3">
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <input
              type="radio"
              name={`mcq-correct-${Math.random()}`}
              checked={opt.is_correct}
              onChange={() => setCorrect(i)}
              className="accent-brand-violet w-4 h-4"
            />
            <span className="text-xs text-foreground/60">
              {ef.mcqCorrectOption}
            </span>
          </label>
          <input
            type="text"
            value={opt.text}
            onChange={(e) => setOptionText(i, e.target.value)}
            placeholder={`${ef.mcqOptionText} ${i + 1}`}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => removeOption(i)}
            disabled={options.length <= 2}
            className={`${smallBtnCls} text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className={`${smallBtnCls} text-brand-violet hover:bg-brand-violet/10`}
      >
        + {ef.mcqAddOption}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// True/False Editor
// ---------------------------------------------------------------------------

function TrueFalseEditor({
  content,
  onChange,
  ef,
}: {
  content: { correct_answer: boolean };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  return (
    <div className="space-y-2">
      <p className={labelCls}>{ef.tfCorrectAnswer}</p>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={content.correct_answer === true}
            onChange={() => onChange({ correct_answer: true })}
            className="accent-brand-violet w-4 h-4"
          />
          <span className="text-sm font-medium">{ef.tfTrue}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={content.correct_answer === false}
            onChange={() => onChange({ correct_answer: false })}
            className="accent-brand-violet w-4 h-4"
          />
          <span className="text-sm font-medium">{ef.tfFalse}</span>
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fill Blank Editor
// ---------------------------------------------------------------------------

function FillBlankEditor({
  content,
  onChange,
  ef,
}: {
  content: { correct_answer: string; accept_alternatives: string[] };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  const alts = content.accept_alternatives ?? [];

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>{ef.fillCorrectAnswer}</label>
        <input
          type="text"
          value={content.correct_answer}
          onChange={(e) =>
            onChange({ ...content, correct_answer: e.target.value })
          }
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{ef.fillAlternatives}</label>
        {alts.map((alt, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={alt}
              onChange={(e) => {
                const next = [...alts];
                next[i] = e.target.value;
                onChange({ ...content, accept_alternatives: next });
              }}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...content,
                  accept_alternatives: alts.filter((_, idx) => idx !== i),
                })
              }
              className={`${smallBtnCls} text-red-500 hover:bg-red-50`}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ ...content, accept_alternatives: [...alts, ""] })
          }
          className={`${smallBtnCls} text-brand-violet hover:bg-brand-violet/10`}
        >
          + {ef.fillAddAlternative}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Short Text Editor
// ---------------------------------------------------------------------------

function ShortTextEditor({
  content,
  onChange,
  ef,
}: {
  content: { sample_answer: string };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  return (
    <div>
      <label className={labelCls}>{ef.shortSampleAnswer}</label>
      <input
        type="text"
        value={content.sample_answer}
        onChange={(e) => onChange({ sample_answer: e.target.value })}
        className={inputCls}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Essay Editor
// ---------------------------------------------------------------------------

function EssayEditor({
  content,
  onChange,
  ef,
}: {
  content: { max_words: number };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  return (
    <div>
      <label className={labelCls}>{ef.essayMaxWords}</label>
      <input
        type="number"
        min={10}
        value={content.max_words}
        onChange={(e) =>
          onChange({ max_words: parseInt(e.target.value, 10) || 0 })
        }
        className={`${inputCls} max-w-[180px]`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Matching Editor
// ---------------------------------------------------------------------------

function MatchingEditor({
  content,
  onChange,
  ef,
}: {
  content: { pairs: { left: string; right: string }[] };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  const pairs = content.pairs ?? [];

  const setPair = (i: number, field: "left" | "right", value: string) => {
    const next = pairs.map((p, idx) =>
      idx === i ? { ...p, [field]: value } : p,
    );
    onChange({ ...content, pairs: next });
  };

  return (
    <div className="space-y-3">
      <p className={labelCls}>{ef.matchingPairs}</p>
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-foreground/40 w-5 shrink-0 text-right">
            {i + 1}.
          </span>
          <input
            type="text"
            value={pair.left}
            onChange={(e) => setPair(i, "left", e.target.value)}
            placeholder={ef.matchingLeft}
            className={inputCls}
          />
          <span className="text-foreground/30 shrink-0">&harr;</span>
          <input
            type="text"
            value={pair.right}
            onChange={(e) => setPair(i, "right", e.target.value)}
            placeholder={ef.matchingRight}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              if (pairs.length <= 2) return;
              onChange({
                ...content,
                pairs: pairs.filter((_, idx) => idx !== i),
              });
            }}
            disabled={pairs.length <= 2}
            className={`${smallBtnCls} text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            pairs: [...pairs, { left: "", right: "" }],
          })
        }
        className={`${smallBtnCls} text-brand-violet hover:bg-brand-violet/10`}
      >
        + {ef.matchingAddPair}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ordering Editor
// ---------------------------------------------------------------------------

function OrderingEditor({
  content,
  onChange,
  ef,
}: {
  content: { items: string[] };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  const items = content.items ?? [];

  return (
    <div className="space-y-3">
      <p className={labelCls}>{ef.orderingItems}</p>
      <p className="text-xs text-foreground/50">{ef.orderingHint}</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-mono text-foreground/40 w-5 shrink-0 text-right">
            {i + 1}.
          </span>
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange({ ...content, items: next });
            }}
            placeholder={`${ef.orderingItem} ${i + 1}`}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => {
              if (items.length <= 2) return;
              onChange({
                ...content,
                items: items.filter((_, idx) => idx !== i),
              });
            }}
            disabled={items.length <= 2}
            className={`${smallBtnCls} text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...content, items: [...items, ""] })}
        className={`${smallBtnCls} text-brand-violet hover:bg-brand-violet/10`}
      >
        + {ef.orderingAddItem}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cloze Editor
// ---------------------------------------------------------------------------

function ClozeEditor({
  content,
  onChange,
  ef,
}: {
  content: { text_with_blanks: string; answers: string[] };
  onChange: (c: any) => void;
  ef: ExamFormTranslations;
}) {
  const answers = content.answers ?? [];

  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>{ef.clozeText}</label>
        <p className="text-xs text-foreground/50 mb-1.5">{ef.clozeHint}</p>
        <textarea
          value={content.text_with_blanks}
          onChange={(e) =>
            onChange({ ...content, text_with_blanks: e.target.value })
          }
          placeholder={ef.clozeTextPlaceholder}
          className={`${textareaCls} font-mono`}
          rows={4}
        />
      </div>
      <div>
        <label className={labelCls}>{ef.clozeAnswers}</label>
        {answers.map((ans, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <span className="text-xs text-foreground/40 w-5 shrink-0 text-right">
              {i + 1}.
            </span>
            <input
              type="text"
              value={ans}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                onChange({ ...content, answers: next });
              }}
              placeholder={`${ef.clozeAnswer} ${i + 1}`}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...content,
                  answers: answers.filter((_, idx) => idx !== i),
                })
              }
              className={`${smallBtnCls} text-red-500 hover:bg-red-50`}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ ...content, answers: [...answers, ""] })
          }
          className={`${smallBtnCls} text-brand-violet hover:bg-brand-violet/10`}
        >
          + {ef.clozeAddAnswer}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question Content Editor (dispatcher)
// ---------------------------------------------------------------------------

function QuestionContentEditor({
  question,
  onChange,
  ef,
}: {
  question: QuestionData;
  onChange: (content: any) => void;
  ef: ExamFormTranslations;
}) {
  switch (question.type) {
    case "mcq":
      return (
        <McqEditor content={question.content} onChange={onChange} ef={ef} />
      );
    case "true_false":
      return (
        <TrueFalseEditor
          content={question.content}
          onChange={onChange}
          ef={ef}
        />
      );
    case "fill_blank":
      return (
        <FillBlankEditor
          content={question.content}
          onChange={onChange}
          ef={ef}
        />
      );
    case "short_text":
      return (
        <ShortTextEditor
          content={question.content}
          onChange={onChange}
          ef={ef}
        />
      );
    case "essay":
      return (
        <EssayEditor content={question.content} onChange={onChange} ef={ef} />
      );
    case "matching":
      return (
        <MatchingEditor
          content={question.content}
          onChange={onChange}
          ef={ef}
        />
      );
    case "ordering":
      return (
        <OrderingEditor
          content={question.content}
          onChange={onChange}
          ef={ef}
        />
      );
    case "cloze":
      return (
        <ClozeEditor content={question.content} onChange={onChange} ef={ef} />
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Question Editor
// ---------------------------------------------------------------------------

function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
  ef,
}: {
  question: QuestionData;
  index: number;
  onUpdate: (q: QuestionData) => void;
  onDelete: () => void;
  ef: ExamFormTranslations;
}) {
  const questionTypes: { value: QuestionData["type"]; label: string }[] = [
    { value: "mcq", label: ef.typeMcq },
    { value: "true_false", label: ef.typeTrueFalse },
    { value: "fill_blank", label: ef.typeFillBlank },
    { value: "cloze", label: ef.typeCloze },
    { value: "matching", label: ef.typeMatching },
    { value: "ordering", label: ef.typeOrdering },
    { value: "short_text", label: ef.typeShortText },
    { value: "essay", label: ef.typeEssay },
  ];

  const gradeMethods: { value: QuestionData["grade_method"]; label: string }[] =
    [
      { value: "auto", label: ef.gradeAuto },
      { value: "ai", label: ef.gradeAi },
      { value: "manual", label: ef.gradeManual },
    ];

  const handleTypeChange = (newType: QuestionData["type"]) => {
    onUpdate({
      ...question,
      type: newType,
      content: defaultContentForType(newType),
    });
  };

  return (
    <div className="rounded-xl border bg-card/60 p-4 space-y-4">
      {/* Question header row */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-foreground/60">
          {ef.questionNumber.replace("{n}", String(index + 1))}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className={`${smallBtnCls} text-red-500 hover:bg-red-50`}
        >
          {ef.deleteQuestion}
        </button>
      </div>

      {/* Type + Points + Grade method row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>{ef.questionType}</label>
          <select
            value={question.type}
            onChange={(e) =>
              handleTypeChange(e.target.value as QuestionData["type"])
            }
            className={selectCls}
          >
            {questionTypes.map((qt) => (
              <option key={qt.value} value={qt.value}>
                {qt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{ef.points}</label>
          <input
            type="number"
            min={0}
            value={question.points}
            onChange={(e) =>
              onUpdate({
                ...question,
                points: parseInt(e.target.value, 10) || 0,
              })
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{ef.gradeMethod}</label>
          <select
            value={question.grade_method}
            onChange={(e) =>
              onUpdate({
                ...question,
                grade_method: e.target.value as QuestionData["grade_method"],
              })
            }
            className={selectCls}
          >
            {gradeMethods.map((gm) => (
              <option key={gm.value} value={gm.value}>
                {gm.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt */}
      <div>
        <label className={labelCls}>{ef.promptFr}</label>
        <input
          type="text"
          value={question.prompt_fr}
          onChange={(e) =>
            onUpdate({ ...question, prompt_fr: e.target.value })
          }
          placeholder={ef.placeholderPromptFr}
          className={inputCls}
        />
      </div>

      {/* Type-specific content */}
      <div className="pt-2 border-t border-dashed">
        <QuestionContentEditor
          question={question}
          onChange={(content) => onUpdate({ ...question, content })}
          ef={ef}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Editor
// ---------------------------------------------------------------------------

function SectionEditor({
  section,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  ef,
}: {
  section: SectionData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (s: SectionData) => void;
  onDelete: () => void;
  ef: ExamFormTranslations;
}) {
  const accentBorder = SECTION_ACCENT_COLORS[index % SECTION_ACCENT_COLORS.length];
  const accentBg = SECTION_ACCENT_BG[index % SECTION_ACCENT_BG.length];

  const sectionKinds: { value: SectionData["kind"]; label: string }[] = [
    { value: "reading", label: ef.kindReading },
    { value: "writing", label: ef.kindWriting },
    { value: "grammar", label: ef.kindGrammar },
    { value: "vocabulary", label: ef.kindVocabulary },
  ];

  const updateQuestion = (qIdx: number, q: QuestionData) => {
    const next = [...section.questions];
    next[qIdx] = q;
    onUpdate({ ...section, questions: next });
  };

  const deleteQuestion = (qIdx: number) => {
    onUpdate({
      ...section,
      questions: section.questions.filter((_, i) => i !== qIdx),
    });
  };

  const addQuestion = () => {
    onUpdate({ ...section, questions: [...section.questions, newQuestion()] });
  };

  return (
    <div
      className={`rounded-2xl border-l-4 ${accentBorder} border bg-card overflow-hidden`}
    >
      {/* ---- Section header ---- */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-secondary/30 ${accentBg}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-foreground/70">
            {ef.sectionNumber.replace("{n}", String(index + 1))}
          </span>
          {section.title_fr && (
            <span className="text-sm text-foreground/60 truncate">
              &mdash; {section.title_fr}
            </span>
          )}
          <span
            className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${KIND_BADGE_COLORS[section.kind]}`}
          >
            {sectionKinds.find((k) => k.value === section.kind)?.label ??
              section.kind}
          </span>
          <span className="text-xs text-foreground/40">
            ({section.questions.length} {ef.questions.toLowerCase()})
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(ef.deleteSectionConfirm)) onDelete();
            }}
            className="text-xs text-red-500 hover:text-red-700 cursor-pointer px-2 py-1"
          >
            {ef.deleteSection}
          </span>
          <svg
            className={`w-4 h-4 text-foreground/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* ---- Section body ---- */}
      {isExpanded && (
        <div className="px-6 py-5 space-y-5 border-t">
          {/* Title row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{ef.sectionTitleFr}</label>
              <input
                type="text"
                value={section.title_fr}
                onChange={(e) =>
                  onUpdate({ ...section, title_fr: e.target.value })
                }
                placeholder={ef.placeholderSectionTitleFr}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{ef.sectionTitleAr}</label>
              <input
                type="text"
                value={section.title_ar}
                onChange={(e) =>
                  onUpdate({ ...section, title_ar: e.target.value })
                }
                placeholder={ef.placeholderSectionTitleAr}
                className={inputCls}
                dir="rtl"
              />
            </div>
          </div>

          {/* Kind */}
          <div className="max-w-xs">
            <label className={labelCls}>{ef.sectionKind}</label>
            <select
              value={section.kind}
              onChange={(e) =>
                onUpdate({
                  ...section,
                  kind: e.target.value as SectionData["kind"],
                })
              }
              className={selectCls}
            >
              {sectionKinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div>
            <label className={labelCls}>{ef.instructionsFr}</label>
            <textarea
              value={section.instructions_fr}
              onChange={(e) =>
                onUpdate({ ...section, instructions_fr: e.target.value })
              }
              placeholder={ef.placeholderInstructionsFr}
              className={textareaCls}
              rows={3}
            />
          </div>

          {/* German passage */}
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-2">
                {ef.passageDe}
                <span className="text-[10px] uppercase tracking-wider font-bold bg-foreground/10 text-foreground/50 px-1.5 py-0.5 rounded">
                  DE
                </span>
              </span>
            </label>
            <textarea
              value={section.passage_de}
              onChange={(e) =>
                onUpdate({ ...section, passage_de: e.target.value })
              }
              placeholder={ef.passageDePlaceholder}
              className={`${textareaCls} font-mono`}
              rows={5}
            />
          </div>

          {/* ---- Questions ---- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground/70 flex items-center gap-2">
              {ef.questions}
              <span className="text-xs font-normal text-foreground/40">
                ({section.questions.length})
              </span>
            </h4>

            {section.questions.length === 0 && (
              <p className="text-sm text-foreground/40 italic py-4 text-center">
                {ef.noQuestions}
              </p>
            )}

            {section.questions.map((q, qIdx) => (
              <QuestionEditor
                key={qIdx}
                question={q}
                index={qIdx}
                onUpdate={(updated) => updateQuestion(qIdx, updated)}
                onDelete={() => deleteQuestion(qIdx)}
                ef={ef}
              />
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="w-full rounded-xl border-2 border-dashed border-brand-violet/30 text-brand-violet text-sm font-medium py-3 transition hover:border-brand-violet/60 hover:bg-brand-violet/5"
            >
              + {ef.addQuestion}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ExamForm component
// ---------------------------------------------------------------------------

const defaultExam: ExamData = {
  title_fr: "",
  title_ar: "",
  description_fr: "",
  description_ar: "",
  cefr_level: "",
  duration_minutes: 0,
  sections: [],
};

export default function ExamForm({
  t,
  locale,
  initialExam,
  onSave,
  onCancel,
  saving,
}: ExamFormProps) {
  const ef = examFormTranslations[locale as Locale];
  const [exam, setExam] = useState<ExamData>(initialExam ?? defaultExam);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    () => new Set(),
  );

  // Computed total points
  const totalPoints = useMemo(() => {
    return exam.sections.reduce(
      (sum, s) => sum + s.questions.reduce((qs, q) => qs + (q.points || 0), 0),
      0,
    );
  }, [exam.sections]);

  // ---- Section-level helpers ----

  const updateSection = useCallback((idx: number, section: SectionData) => {
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === idx ? section : s)),
    }));
  }, []);

  const deleteSection = useCallback((idx: number) => {
    setExam((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
    setExpandedSections((prev) => {
      const next = new Set<number>();
      prev.forEach((v) => {
        if (v < idx) next.add(v);
        else if (v > idx) next.add(v - 1);
      });
      return next;
    });
  }, []);

  const addSection = useCallback(() => {
    setExam((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection()],
    }));
    // Auto-expand the newly added section
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.add(exam.sections.length);
      return next;
    });
  }, [exam.sections.length]);

  const toggleSection = useCallback((idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // ---- Save handler ----

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await onSave(exam);
    },
    [exam, onSave],
  );

  // ---- Render ----

  return (
    <form onSubmit={handleSubmit} className="pb-28">
      {/* ================================================================ */}
      {/* STEP 1 -- Exam Metadata                                          */}
      {/* ================================================================ */}
      <div className="rounded-2xl border bg-card p-6 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-5">
          {ef.metadata}
        </h2>

        {/* Title row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>
              {ef.titleFr} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={exam.title_fr}
              onChange={(e) =>
                setExam((prev) => ({ ...prev, title_fr: e.target.value }))
              }
              placeholder={ef.placeholderTitleFr}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{ef.titleAr}</label>
            <input
              type="text"
              value={exam.title_ar}
              onChange={(e) =>
                setExam((prev) => ({ ...prev, title_ar: e.target.value }))
              }
              placeholder={ef.placeholderTitleAr}
              className={inputCls}
              dir="rtl"
            />
          </div>
        </div>

        {/* Description row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>{ef.descriptionFr}</label>
            <textarea
              value={exam.description_fr}
              onChange={(e) =>
                setExam((prev) => ({
                  ...prev,
                  description_fr: e.target.value,
                }))
              }
              placeholder={ef.placeholderDescriptionFr}
              className={textareaCls}
              rows={3}
            />
          </div>
          <div>
            <label className={labelCls}>{ef.descriptionAr}</label>
            <textarea
              value={exam.description_ar}
              onChange={(e) =>
                setExam((prev) => ({
                  ...prev,
                  description_ar: e.target.value,
                }))
              }
              placeholder={ef.placeholderDescriptionAr}
              className={textareaCls}
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        {/* Level + Duration row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{ef.cefrLevel}</label>
            <select
              value={exam.cefr_level}
              onChange={(e) =>
                setExam((prev) => ({
                  ...prev,
                  cefr_level: e.target.value as ExamData["cefr_level"],
                }))
              }
              className={selectCls}
            >
              <option value="">{ef.cefrLevelPlaceholder}</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{ef.durationMinutes}</label>
            <input
              type="number"
              min={0}
              value={exam.duration_minutes || ""}
              onChange={(e) =>
                setExam((prev) => ({
                  ...prev,
                  duration_minutes: parseInt(e.target.value, 10) || 0,
                }))
              }
              placeholder={ef.durationPlaceholder}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* STEP 2 -- Sections                                               */}
      {/* ================================================================ */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-5">
          {ef.sections}
        </h2>

        {exam.sections.length === 0 && (
          <p className="text-sm text-foreground/40 italic text-center py-8">
            {ef.noSections}
          </p>
        )}

        <div className="space-y-4">
          {exam.sections.map((section, sIdx) => (
            <SectionEditor
              key={sIdx}
              section={section}
              index={sIdx}
              isExpanded={expandedSections.has(sIdx)}
              onToggle={() => toggleSection(sIdx)}
              onUpdate={(s) => updateSection(sIdx, s)}
              onDelete={() => {
                if (confirm(ef.deleteSectionConfirm)) deleteSection(sIdx);
              }}
              ef={ef}
            />
          ))}
        </div>

        {/* Add section button */}
        <button
          type="button"
          onClick={addSection}
          className="mt-4 w-full rounded-2xl border-2 border-dashed border-brand-violet/30 text-brand-violet text-sm font-semibold py-5 transition hover:border-brand-violet/60 hover:bg-brand-violet/5"
        >
          + {ef.addSection}
        </button>
      </div>

      {/* ================================================================ */}
      {/* BOTTOM BAR                                                       */}
      {/* ================================================================ */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-t">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          {/* Total points */}
          <div className="text-sm text-foreground/60">
            {ef.totalPoints}:{" "}
            <span className="font-bold text-foreground">{totalPoints}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border px-6 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-secondary/60"
            >
              {ef.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-violet/80 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-violet/25 transition hover:shadow-xl hover:shadow-brand-violet/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? ef.saving : ef.save}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
