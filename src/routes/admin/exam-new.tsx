import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { useLocale } from "@/lib/useLocale";
import { dashboardTranslations } from "@/lib/i18n-dashboard";
import { DashboardLayout } from "@/components/DashboardLayout";
import ExamForm from "@/components/ExamForm";
import type { ExamData } from "@/components/ExamForm";
import { examFormTranslations } from "@/lib/i18n-exam-form";

export const Route = createFileRoute("/admin/exam-new")({
  component: AdminExamNewPage,
});

// ---------------------------------------------------------------------------
// Admin navigation items (consistent with other admin pages)
// ---------------------------------------------------------------------------

function navItems(t: (typeof dashboardTranslations)["fr"]) {
  return [
    {
      label: t.nav?.dashboard ?? "Tableau de bord",
      href: "/admin",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z"
          />
        </svg>
      ),
    },
    {
      label: t.nav?.exams ?? "Examens",
      href: "/admin/exams",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      ),
    },
    {
      label: t.nav?.users ?? "Utilisateurs",
      href: "/admin/users",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      ),
    },
    {
      label: t.nav?.settings ?? "Parametres",
      href: "/admin/settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function AdminExamNewPage() {
  const { user, role, loading: authLoading } = useAuth("admin");
  const { locale } = useLocale();
  const t = dashboardTranslations[locale];
  const ef = examFormTranslations[locale];
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // ---- Auth loading state ----
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-violet border-t-transparent" />
      </div>
    );
  }

  // ---- Save handler ----
  const handleSave = async (data: ExamData) => {
    setSaving(true);

    try {
      // 1. Insert the exam
      const { data: examRow, error: examError } = await supabase
        .from("exams")
        .insert({
          title_fr: data.title_fr,
          title_ar: data.title_ar || null,
          description_fr: data.description_fr || null,
          description_ar: data.description_ar || null,
          cefr_level: data.cefr_level || null,
          duration_minutes: data.duration_minutes || null,
          is_published: false,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (examError || !examRow) {
        throw examError ?? new Error("Failed to create exam");
      }

      const examId = examRow.id;
      let totalPoints = 0;

      // 2. Insert sections and their questions
      for (let sIdx = 0; sIdx < data.sections.length; sIdx++) {
        const section = data.sections[sIdx];

        const { data: sectionRow, error: sectionError } = await supabase
          .from("exam_sections")
          .insert({
            exam_id: examId,
            title_fr: section.title_fr || null,
            title_ar: section.title_ar || null,
            instructions_fr: section.instructions_fr || null,
            passage_de: section.passage_de || null,
            kind: section.kind,
            order_index: sIdx,
          })
          .select("id")
          .single();

        if (sectionError || !sectionRow) {
          throw sectionError ?? new Error("Failed to create section");
        }

        const sectionId = sectionRow.id;

        // 3. Insert questions for this section
        if (section.questions.length > 0) {
          const questionRows = section.questions.map((q, qIdx) => {
            totalPoints += q.points || 0;
            return {
              section_id: sectionId,
              type: q.type,
              prompt_fr: q.prompt_fr || null,
              prompt_ar: q.prompt_ar || null,
              content: q.content,
              points: q.points,
              order_index: qIdx,
              grade_method: q.grade_method,
            };
          });

          const { error: questionsError } = await supabase
            .from("exam_questions")
            .insert(questionRows);

          if (questionsError) {
            throw questionsError;
          }
        }
      }

      // 4. Update total points on the exam
      const { error: updateError } = await supabase
        .from("exams")
        .update({ total_points: totalPoints })
        .eq("id", examId);

      if (updateError) {
        throw updateError;
      }

      // 5. Success
      toast.success(ef.toastSaveSuccess);
      navigate({ to: "/admin/exams" });
    } catch (err: any) {
      console.error("Error saving exam:", err);
      toast.error(ef.toastSaveError + (err?.message ? `: ${err.message}` : ""));
    } finally {
      setSaving(false);
    }
  };

  // ---- Cancel handler ----
  const handleCancel = () => {
    navigate({ to: "/admin/exams" });
  };

  // ---- Render ----
  return (
    <DashboardLayout navItems={navItems(t)} locale={locale}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">
          {ef.createExam}
        </h1>

        <ExamForm
          t={t}
          locale={locale}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      </div>
    </DashboardLayout>
  );
}
