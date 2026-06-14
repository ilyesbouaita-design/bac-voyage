import { supabase } from "./supabase";

/**
 * Award XP to a student. Writes to xp_events table and updates profiles.xp.
 * Also updates level (1 level per 100 XP), streak, and last_active_date.
 */
export async function awardXp(params: {
  studentId: string;
  amount: number;
  source: "lesson" | "exam";
  refId?: string;
}) {
  const { studentId, amount, source, refId } = params;
  if (!studentId || studentId === "demo-user-001" || amount <= 0) return;

  // 1. Insert xp_event
  await supabase.from("xp_events").insert({
    student_id: studentId,
    amount,
    source,
    ref_id: refId || null,
    ref_type: source,
  });

  // 2. Fetch current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, current_streak, last_active_date")
    .eq("id", studentId)
    .single();

  if (!profile) return;

  // 3. Calculate new XP and level
  const newXp = (profile.xp || 0) + amount;
  const newLevel = Math.floor(newXp / 100) + 1; // 1 level per 100 XP

  // 4. Update streak
  const today = new Date().toISOString().split("T")[0];
  const lastActive = profile.last_active_date?.split("T")[0];
  let newStreak = profile.current_streak || 0;

  if (lastActive !== today) {
    // Check if yesterday
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastActive === yesterday) {
      newStreak += 1; // Continue streak
    } else if (lastActive !== today) {
      newStreak = 1; // Reset streak
    }
  }

  // 5. Update profile
  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: newStreak,
      last_active_date: today,
    })
    .eq("id", studentId);
}

/**
 * Mark a lesson as completed in the database.
 * Uses xp_events to check if already completed (prevents double-award).
 */
export async function isLessonCompletedInDb(studentId: string, lessonId: string): Promise<boolean> {
  if (!studentId || studentId === "demo-user-001") return false;
  const { count } = await supabase
    .from("xp_events")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("ref_id", lessonId)
    .eq("ref_type", "lesson");
  return (count ?? 0) > 0;
}
