import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  gradeAnswerV2,
  DEFAULT_TOLERANCE_RULES,
  type GradeResultV2,
} from "@/lib/grading-engine-v2";

export const Route = createFileRoute("/admin/grading-rules")({
  component: GradingRulesPage,
});

// ---------------------------------------------------------------------------
// Shared 12px Times New Roman text style
// ---------------------------------------------------------------------------
const TM: React.CSSProperties = { fontFamily: "'Times New Roman', Times, serif", fontSize: 12 };

const BRAND = {
  violet: "#6C4CE0",
  coral: "#FF5A5F",
  gold: "#FFB200",
  teal: "#0FB6A3",
};

// ---------------------------------------------------------------------------
// Sidebar nav (matches other admin pages)
// ---------------------------------------------------------------------------
const navItems = [
  {
    label: "Tableau de bord",
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
    label: "Examens",
    to: "/admin/exams",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: "Grammaire",
    to: "/admin/grammar",
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
    to: "/admin/vocabulary",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Correction",
    to: "/admin/grading-rules",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LS_CASES_KEY = "bac-grading-cases";
const LS_PATTERNS_KEY = "bac-grading-custom-patterns";

const QUESTION_TYPES = [
  { value: "synonym", label: "Synonym" },
  { value: "gegenteil", label: "Gegenteil" },
  { value: "fragen_zum_text", label: "Fragen zum Text" },
  { value: "uebersetzung", label: "Übersetzung" },
  { value: "grammatik_tempus", label: "Grammatik (Tempus)" },
  { value: "grammatik_satzbau", label: "Grammatik (Satzbau)" },
  { value: "wortbildung", label: "Wortbildung" },
  { value: "kombinieren", label: "Kombinieren" },
  { value: "ergaenzen", label: "Ergänzen" },
  { value: "titel", label: "Titel" },
  { value: "richtig_falsch_zitat", label: "Richtig/Falsch + Zitat" },
];

const TYPE_COLORS: Record<string, string> = {
  synonym: BRAND.violet,
  gegenteil: BRAND.coral,
  fragen_zum_text: BRAND.teal,
  uebersetzung: BRAND.gold,
  grammatik_tempus: BRAND.violet,
  grammatik_satzbau: BRAND.violet,
  wortbildung: BRAND.teal,
  kombinieren: BRAND.gold,
  ergaenzen: BRAND.teal,
  titel: BRAND.coral,
  richtig_falsch_zitat: BRAND.coral,
};

function typeLabel(v: string) {
  return QUESTION_TYPES.find((q) => q.value === v)?.label ?? v;
}

function typeColor(v: string) {
  return TYPE_COLORS[v] ?? "#6b7280";
}

const TOLERANCE_OPTIONS = [
  { value: "IGNORE_CAPITALIZATION", label: "Majuscules" },
  { value: "IGNORE_ARTICLE", label: "Article" },
  { value: "FORGIVE_COMMA", label: "Virgule" },
  { value: "TYPO", label: "Faute de frappe" },
  { value: "REFORMULATION", label: "Reformulation" },
];

const BUILTIN_RULES: {
  id: string;
  description: string;
  penaltyLabel: string;
}[] = [
  {
    id: "IGNORE_CAPITALIZATION",
    description: "Majuscules ignorées (verfügbar = Verfügbar)",
    penaltyLabel: "0%",
  },
  {
    id: "IGNORE_ARTICLE",
    description: "Article incorrect (der/die/das)",
    penaltyLabel: "-25%",
  },
  {
    id: "FORGIVE_COMMA",
    description: "Virgule manquante",
    penaltyLabel: "-20%",
  },
  {
    id: "ACCEPT_UMLAUT_ALTERNATIVE",
    description: "Strasse = Straße, Mueller = Müller",
    penaltyLabel: "0%",
  },
  {
    id: "ACCEPT_HYPHEN_VARIATION",
    description: "Deutsch-Unterricht = Deutschunterricht",
    penaltyLabel: "0%",
  },
  {
    id: "IGNORE_TRAILING_PERIOD",
    description: "Berlin. = Berlin",
    penaltyLabel: "0%",
  },
  {
    id: "ACCEPT_ABBREVIATED_ARTICLE",
    description: "d. Baum = der Baum",
    penaltyLabel: "0%",
  },
];

type Verdict = "correct" | "partial" | "wrong";

interface TrainingCase {
  id: string;
  questionType: string;
  question: string;
  referenceAnswer: string;
  studentAnswer: string;
  verdict: Verdict;
  notes: string;
  tolerances: string[];
  createdAt: string;
}

interface CustomPattern {
  id: string;
  pattern: string;
  replacement: string;
  penalty: number; // 0, 0.25, 0.5
}

const VERDICT_META: Record<Verdict, { label: string; emoji: string; color: string }> = {
  correct: { label: "Correct", emoji: "✅", color: BRAND.teal },
  partial: { label: "Partiel", emoji: "⚠️", color: BRAND.gold },
  wrong: { label: "Faux", emoji: "❌", color: BRAND.coral },
};

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------
function loadCases(): TrainingCase[] {
  try {
    const raw = localStorage.getItem(LS_CASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCases(cases: TrainingCase[]) {
  try {
    localStorage.setItem(LS_CASES_KEY, JSON.stringify(cases));
  } catch {
    /* ignore quota errors */
  }
}

function loadPatterns(): CustomPattern[] {
  try {
    const raw = localStorage.getItem(LS_PATTERNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePatterns(patterns: CustomPattern[]) {
  try {
    localStorage.setItem(LS_PATTERNS_KEY, JSON.stringify(patterns));
  } catch {
    /* ignore quota errors */
  }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Supabase sync (best-effort mirror into exercises table)
// ---------------------------------------------------------------------------
const GRADING_RULES_MARKER = "__grading_rules__";

async function syncToSupabase(cases: TrainingCase[], patterns: CustomPattern[]) {
  try {
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("pillar", "grammatik")
      .eq("type", "short_text")
      .eq("title_fr", GRADING_RULES_MARKER)
      .limit(1);

    const payload = {
      pillar: "grammatik",
      type: "short_text",
      title_fr: GRADING_RULES_MARKER,
      content: { cases, patterns, updatedAt: new Date().toISOString() },
      points: 0,
      order_index: 0,
      is_published: false,
    };

    if (existing && existing.length > 0) {
      await supabase.from("exercises").update(payload).eq("id", existing[0].id);
    } else {
      await supabase.from("exercises").insert(payload);
    }
  } catch {
    /* best-effort only; localStorage remains source of truth */
  }
}

async function fetchFromSupabase(): Promise<{ cases: TrainingCase[]; patterns: CustomPattern[] } | null> {
  try {
    const { data, error } = await supabase
      .from("exercises")
      .select("content")
      .eq("pillar", "grammatik")
      .eq("type", "short_text")
      .eq("title_fr", GRADING_RULES_MARKER)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    const content = data.content as any;
    return {
      cases: Array.isArray(content?.cases) ? content.cases : [],
      patterns: Array.isArray(content?.patterns) ? content.patterns : [],
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h2 style={{ ...TM, fontWeight: 700, fontSize: 14 }} className="text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p style={TM} className="text-gray-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg?: string }) {
  return (
    <span
      style={{ ...TM, color, background: bg ?? `${color}18`, fontWeight: 600 }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap"
    >
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-violet border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function GradingRulesPage() {
  const { loading } = useAuth("admin");

  const [cases, setCases] = useState<TrainingCase[]>([]);
  const [patterns, setPatterns] = useState<CustomPattern[]>([]);
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add-case form state
  const [formType, setFormType] = useState(QUESTION_TYPES[0].value);
  const [formQuestion, setFormQuestion] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formStudent, setFormStudent] = useState("");
  const [formVerdict, setFormVerdict] = useState<Verdict>("correct");
  const [formNotes, setFormNotes] = useState("");
  const [formTolerances, setFormTolerances] = useState<string[]>([]);

  // Custom pattern form state
  const [patPattern, setPatPattern] = useState("");
  const [patReplacement, setPatReplacement] = useState("");
  const [patPenalty, setPatPenalty] = useState(0);

  // Test panel state
  const [testType, setTestType] = useState(QUESTION_TYPES[0].value);
  const [testStudent, setTestStudent] = useState("");
  const [testReference, setTestReference] = useState("");
  const [testResult, setTestResult] = useState<GradeResultV2 | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Load local first for instant UI, then try to reconcile with Supabase.
    setCases(loadCases());
    setPatterns(loadPatterns());

    (async () => {
      const remote = await fetchFromSupabase();
      if (remote && (remote.cases.length > 0 || remote.patterns.length > 0)) {
        const local = loadCases();
        if (local.length === 0) {
          setCases(remote.cases);
          saveCases(remote.cases);
        }
        const localPatterns = loadPatterns();
        if (localPatterns.length === 0) {
          setPatterns(remote.patterns);
          savePatterns(remote.patterns);
        }
      }
    })();
  }, [loading]);

  function persist(nextCases: TrainingCase[], nextPatterns: CustomPattern[]) {
    setCases(nextCases);
    setPatterns(nextPatterns);
    saveCases(nextCases);
    savePatterns(nextPatterns);
    setSyncing(true);
    syncToSupabase(nextCases, nextPatterns).finally(() => setSyncing(false));
  }

  function toggleTolerance(value: string) {
    setFormTolerances((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleAddCase() {
    if (!formQuestion.trim() || !formStudent.trim() || !formReference.trim()) return;
    const newCase: TrainingCase = {
      id: uid(),
      questionType: formType,
      question: formQuestion.trim(),
      referenceAnswer: formReference.trim(),
      studentAnswer: formStudent.trim(),
      verdict: formVerdict,
      notes: formNotes.trim(),
      tolerances: formTolerances,
      createdAt: new Date().toISOString(),
    };
    persist([newCase, ...cases], patterns);
    // reset form
    setFormQuestion("");
    setFormReference("");
    setFormStudent("");
    setFormVerdict("correct");
    setFormNotes("");
    setFormTolerances([]);
  }

  function handleDeleteCase(id: string) {
    persist(cases.filter((c) => c.id !== id), patterns);
  }

  function handleAddPattern() {
    if (!patPattern.trim()) return;
    const newPattern: CustomPattern = {
      id: uid(),
      pattern: patPattern.trim(),
      replacement: patReplacement,
      penalty: patPenalty,
    };
    persist(cases, [newPattern, ...patterns]);
    setPatPattern("");
    setPatReplacement("");
    setPatPenalty(0);
  }

  function handleUpdatePattern(id: string, field: keyof CustomPattern, value: string | number) {
    const next = patterns.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    persist(cases, next);
  }

  function handleDeletePattern(id: string) {
    persist(cases, patterns.filter((p) => p.id !== id));
  }

  function handleExport() {
    const blob = new Blob(
      [JSON.stringify({ cases, patterns, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bac-grading-rules-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedCases: TrainingCase[] = Array.isArray(parsed?.cases) ? parsed.cases : [];
        const importedPatterns: CustomPattern[] = Array.isArray(parsed?.patterns) ? parsed.patterns : [];
        persist(importedCases, importedPatterns);
      } catch {
        alert("Fichier JSON invalide.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  async function handleAnalyze() {
    if (!testStudent.trim() || !testReference.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const activeToleranceIds = Object.keys(DEFAULT_TOLERANCE_RULES);
      const result = await gradeAnswerV2({
        questionType: testType,
        studentAnswer: testStudent,
        referenceAnswer: testReference,
        points: 1,
        locale: "fr",
        toleranceRules: activeToleranceIds,
      });
      setTestResult(result);
    } catch {
      setTestResult(null);
    } finally {
      setTesting(false);
    }
  }

  const visibleCases = useMemo(() => cases.slice(0, 50), [cases]);

  if (loading) return <Spinner />;

  return (
    <DashboardLayout navItems={navItems} role="admin">
      <div className="space-y-6" style={TM}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 style={{ ...TM, fontWeight: 700, fontSize: 20 }} className="text-gray-900">
              Règles de correction
            </h1>
            <p style={TM} className="text-gray-500 mt-1">
              Entraînez le système de correction avec des exemples réels.
            </p>
          </div>
          {syncing && (
            <span style={TM} className="text-gray-400 italic">
              Synchronisation…
            </span>
          )}
        </div>

        {/* Section 1: Built-in tolerance rules */}
        <SectionCard
          title="Règles de tolérance intégrées"
          subtitle="Ces règles sont toujours actives dans le moteur de correction."
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Règle</th>
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Description</th>
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Pénalité</th>
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {BUILTIN_RULES.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-50 last:border-0">
                    <td style={{ ...TM, fontWeight: 600 }} className="py-2.5 pr-3 text-gray-900 whitespace-nowrap">
                      {rule.id}
                    </td>
                    <td style={TM} className="py-2.5 pr-3 text-gray-600">
                      {rule.description}
                    </td>
                    <td style={TM} className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">
                      {rule.penaltyLabel}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge color={BRAND.teal}>✅ Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 2: Add new training case */}
        <SectionCard
          title="Ajouter un cas d'entraînement"
          subtitle="Ajoutez un exemple réel vu chez un étudiant pour entraîner le moteur."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Type de question
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet"
              >
                {QUESTION_TYPES.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Question / Consigne
              </label>
              <input
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="Ex: Donnez le synonyme de 'verfügbar'"
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet"
              />
            </div>

            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Réponse de référence (admin)
              </label>
              <textarea
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
                rows={3}
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet resize-y"
              />
            </div>

            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Réponse de l'étudiant
              </label>
              <textarea
                value={formStudent}
                onChange={(e) => setFormStudent(e.target.value)}
                rows={3}
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet resize-y"
              />
            </div>

            <div className="md:col-span-2">
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Verdict
              </label>
              <div className="flex flex-wrap gap-4">
                {(["correct", "partial", "wrong"] as Verdict[]).map((v) => (
                  <label key={v} style={TM} className="flex items-center gap-2 cursor-pointer text-gray-700">
                    <input
                      type="radio"
                      name="verdict"
                      checked={formVerdict === v}
                      onChange={() => setFormVerdict(v)}
                    />
                    {VERDICT_META[v].emoji}{" "}
                    {v === "correct" ? "Correct (100%)" : v === "partial" ? "Partiel (50%)" : "Faux (0%)"}
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Expliquez pourquoi (ceci entraîne le moteur)…"
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet resize-y"
              />
            </div>

            <div className="md:col-span-2">
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Tolérance appliquée
              </label>
              <div className="flex flex-wrap gap-4">
                {TOLERANCE_OPTIONS.map((opt) => (
                  <label key={opt.value} style={TM} className="flex items-center gap-2 cursor-pointer text-gray-700">
                    <input
                      type="checkbox"
                      checked={formTolerances.includes(opt.value)}
                      onChange={() => toggleTolerance(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleAddCase}
              disabled={!formQuestion.trim() || !formStudent.trim() || !formReference.trim()}
              style={{ ...TM, fontWeight: 600, background: `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.coral})` }}
              className="text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </div>
        </SectionCard>

        {/* Cases list */}
        <SectionCard
          title={`Cas d'entraînement (${cases.length})`}
          subtitle="Jusqu'à 50 cas affichés."
        >
          {visibleCases.length === 0 ? (
            <p style={TM} className="text-gray-400 italic py-6 text-center">
              Aucun cas ajouté pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleCases.map((c) => {
                const vm = VERDICT_META[c.verdict];
                const studentColor =
                  c.verdict === "correct" ? BRAND.teal : c.verdict === "partial" ? BRAND.gold : BRAND.coral;
                return (
                  <div
                    key={c.id}
                    className="border border-gray-100 rounded-xl p-3.5 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge color={typeColor(c.questionType)}>{typeLabel(c.questionType)}</Badge>
                        <Badge color={vm.color}>
                          {vm.emoji} {vm.label}
                        </Badge>
                        {c.tolerances.map((t) => (
                          <span
                            key={t}
                            style={{ ...TM, color: "#6b7280" }}
                            className="px-2 py-0.5 rounded-full bg-gray-100"
                          >
                            {TOLERANCE_OPTIONS.find((o) => o.value === t)?.label ?? t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDeleteCase(c.id)}
                        aria-label="Supprimer"
                        style={TM}
                        className="text-gray-400 hover:text-brand-coral transition-colors"
                      >
                        🗑
                      </button>
                    </div>

                    <p style={{ ...TM, fontWeight: 600 }} className="text-gray-900">
                      {c.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p style={{ ...TM, color: "#9ca3af" }}>Réponse étudiant</p>
                        <p style={{ ...TM, color: studentColor, fontWeight: 600 }}>{c.studentAnswer}</p>
                      </div>
                      <div>
                        <p style={{ ...TM, color: "#9ca3af" }}>Réponse de référence</p>
                        <p style={{ ...TM, color: "#6b7280" }}>{c.referenceAnswer}</p>
                      </div>
                    </div>

                    {c.notes && (
                      <p style={{ ...TM, color: "#9ca3af", fontStyle: "italic" }}>{c.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Section 3: Custom tolerance patterns */}
        <SectionCard
          title="Modèles de tolérance personnalisés"
          subtitle="Ajoutez des règles regex personnalisées (ex: heiss → heiß)."
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Pattern (regex)</th>
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Remplacement</th>
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold">Pénalité</th>
                  <th style={TM} className="py-2 pr-3 text-gray-500 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3">
                      <input
                        value={p.pattern}
                        onChange={(e) => handleUpdatePattern(p.id, "pattern", e.target.value)}
                        style={TM}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-violet"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={p.replacement}
                        onChange={(e) => handleUpdatePattern(p.id, "replacement", e.target.value)}
                        style={TM}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-violet"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={p.penalty}
                        onChange={(e) => handleUpdatePattern(p.id, "penalty", Number(e.target.value))}
                        style={TM}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-violet"
                      >
                        <option value={0}>0%</option>
                        <option value={0.25}>25%</option>
                        <option value={0.5}>50%</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => handleDeletePattern(p.id)}
                        style={TM}
                        className="text-gray-400 hover:text-brand-coral transition-colors"
                        aria-label="Supprimer"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3">
                    <input
                      value={patPattern}
                      onChange={(e) => setPatPattern(e.target.value)}
                      placeholder="heiss"
                      style={TM}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-violet"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={patReplacement}
                      onChange={(e) => setPatReplacement(e.target.value)}
                      placeholder="heiß"
                      style={TM}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-violet"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      value={patPenalty}
                      onChange={(e) => setPatPenalty(Number(e.target.value))}
                      style={TM}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-violet"
                    >
                      <option value={0}>0%</option>
                      <option value={0.25}>25%</option>
                      <option value={0.5}>50%</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={handleAddPattern}
                      disabled={!patPattern.trim()}
                      style={{ ...TM, fontWeight: 700, background: BRAND.violet }}
                      className="text-white w-7 h-7 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      +
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Section 4: Export / Import */}
        <SectionCard title="Export / Import" subtitle="Sauvegardez ou restaurez vos cas d'entraînement.">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              style={{ ...TM, fontWeight: 600 }}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ⬇ Exporter JSON
            </button>
            <button
              onClick={handleImportClick}
              style={{ ...TM, fontWeight: 600 }}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ⬆ Importer JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </SectionCard>

        {/* Test panel */}
        <SectionCard
          title="Tester le système de correction"
          subtitle="Vérifiez comment le moteur de correction évalue une réponse."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Type de question
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet"
              >
                {QUESTION_TYPES.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
            <div />

            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Réponse de l'étudiant
              </label>
              <textarea
                value={testStudent}
                onChange={(e) => setTestStudent(e.target.value)}
                rows={3}
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet resize-y"
              />
            </div>
            <div>
              <label style={{ ...TM, fontWeight: 600 }} className="block text-gray-700 mb-1.5">
                Réponse de référence
              </label>
              <textarea
                value={testReference}
                onChange={(e) => setTestReference(e.target.value)}
                rows={3}
                style={TM}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-violet resize-y"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleAnalyze}
              disabled={testing || !testStudent.trim() || !testReference.trim()}
              style={{ ...TM, fontWeight: 600, background: `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.teal})` }}
              className="text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? "Analyse…" : "Analyser"}
            </button>
          </div>

          {testResult && (
            <div className="mt-5 border border-gray-100 rounded-xl p-4 space-y-2 bg-gray-50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge color={BRAND.violet}>Méthode : {testResult.method}</Badge>
                <Badge
                  color={
                    testResult.isCorrect ? BRAND.teal : testResult.isPartial ? BRAND.gold : BRAND.coral
                  }
                >
                  Score : {testResult.percentage}%
                </Badge>
                <Badge color="#6b7280">
                  Confiance : {Math.round(testResult.confidence * 100)}%
                </Badge>
                {testResult.needsManualReview && (
                  <Badge color={BRAND.coral}>Révision manuelle recommandée</Badge>
                )}
              </div>

              {testResult.details?.toleranceApplied && testResult.details.toleranceApplied.length > 0 && (
                <p style={TM} className="text-gray-600">
                  Tolérances appliquées : {testResult.details.toleranceApplied.join(", ")}
                </p>
              )}
              {testResult.details?.keywordsFound && (
                <p style={TM} className="text-gray-600">
                  Mots-clés trouvés : {testResult.details.keywordsFound.join(", ") || "—"}
                </p>
              )}
              {testResult.details?.keywordsMissing && testResult.details.keywordsMissing.length > 0 && (
                <p style={TM} className="text-gray-600">
                  Mots-clés manquants : {testResult.details.keywordsMissing.join(", ")}
                </p>
              )}
              {typeof testResult.details?.editDistance === "number" && (
                <p style={TM} className="text-gray-600">
                  Distance d'édition : {testResult.details.editDistance}
                </p>
              )}
              {typeof testResult.details?.fuseScore === "number" && (
                <p style={TM} className="text-gray-600">
                  Similarité sémantique : {testResult.details.fuseScore}
                </p>
              )}

              <p style={{ ...TM, fontStyle: "italic" }} className="text-gray-700 pt-1 border-t border-gray-200 mt-2">
                {testResult.feedback_fr}
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}

export default GradingRulesPage;
