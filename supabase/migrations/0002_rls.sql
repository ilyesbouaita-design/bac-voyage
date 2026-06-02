-- ============================================================
-- BacAllemand — Row-Level Security
-- Model:
--   * Admins (profiles.role='admin') can do everything.
--   * Students can READ only published content.
--   * Students can manage only THEIR OWN attempts / answers / xp / badges.
-- ============================================================

-- Base grants (RLS still governs row visibility on top of these)
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Enable RLS everywhere
alter table public.profiles        enable row level security;
alter table public.grammar_topics  enable row level security;
alter table public.lessons         enable row level security;
alter table public.vocab_sets      enable row level security;
alter table public.vocab_words     enable row level security;
alter table public.exercises       enable row level security;
alter table public.exams           enable row level security;
alter table public.exam_sections   enable row level security;
alter table public.exam_questions  enable row level security;
alter table public.exam_attempts   enable row level security;
alter table public.exam_answers    enable row level security;
alter table public.xp_events       enable row level security;
alter table public.badges          enable row level security;
alter table public.user_badges     enable row level security;

-- ---------- PROFILES ----------
create policy "profiles_select_self_or_admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (id = auth.uid() or public.is_admin());
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
                                with check (id = auth.uid() or public.is_admin());

-- ---------- CONTENT: read published (or admin) · write admin-only ----------
-- grammar_topics
create policy "grammar_topics_read" on public.grammar_topics
  for select to authenticated using (is_published or public.is_admin());
create policy "grammar_topics_write" on public.grammar_topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- lessons (published depends on parent topic)
create policy "lessons_read" on public.lessons
  for select to authenticated using (
    public.is_admin() or (
      is_published and exists (
        select 1 from public.grammar_topics t
        where t.id = lessons.topic_id and t.is_published
      )
    )
  );
create policy "lessons_write" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- vocab_sets
create policy "vocab_sets_read" on public.vocab_sets
  for select to authenticated using (is_published or public.is_admin());
create policy "vocab_sets_write" on public.vocab_sets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- vocab_words (visible when parent set is published)
create policy "vocab_words_read" on public.vocab_words
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.vocab_sets s
      where s.id = vocab_words.set_id and s.is_published
    )
  );
create policy "vocab_words_write" on public.vocab_words
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- exercises
create policy "exercises_read" on public.exercises
  for select to authenticated using (is_published or public.is_admin());
create policy "exercises_write" on public.exercises
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- exams
create policy "exams_read" on public.exams
  for select to authenticated using (is_published or public.is_admin());
create policy "exams_write" on public.exams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- exam_sections (visible when parent exam is published)
create policy "exam_sections_read" on public.exam_sections
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.exams e
      where e.id = exam_sections.exam_id and e.is_published
    )
  );
create policy "exam_sections_write" on public.exam_sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- exam_questions (visible when parent exam is published)
create policy "exam_questions_read" on public.exam_questions
  for select to authenticated using (
    public.is_admin() or exists (
      select 1
      from public.exam_sections s
      join public.exams e on e.id = s.exam_id
      where s.id = exam_questions.section_id and e.is_published
    )
  );
create policy "exam_questions_write" on public.exam_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- badges: any authenticated user can read; admin manages
create policy "badges_read" on public.badges
  for select to authenticated using (true);
create policy "badges_write" on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- STUDENT-OWNED DATA ----------
-- exam_attempts
create policy "attempts_select_own" on public.exam_attempts
  for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "attempts_insert_own" on public.exam_attempts
  for insert to authenticated with check (student_id = auth.uid());
create policy "attempts_update_own" on public.exam_attempts
  for update to authenticated using (student_id = auth.uid() or public.is_admin())
                                with check (student_id = auth.uid() or public.is_admin());
create policy "attempts_delete_admin" on public.exam_attempts
  for delete to authenticated using (public.is_admin());

-- exam_answers (ownership via parent attempt)
create policy "answers_select_own" on public.exam_answers
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.exam_attempts a
      where a.id = exam_answers.attempt_id and a.student_id = auth.uid()
    )
  );
create policy "answers_write_own" on public.exam_answers
  for all to authenticated using (
    public.is_admin() or exists (
      select 1 from public.exam_attempts a
      where a.id = exam_answers.attempt_id and a.student_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.exam_attempts a
      where a.id = exam_answers.attempt_id and a.student_id = auth.uid()
    )
  );

-- xp_events
create policy "xp_select_own" on public.xp_events
  for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "xp_insert_own" on public.xp_events
  for insert to authenticated with check (student_id = auth.uid() or public.is_admin());

-- user_badges
create policy "user_badges_select_own" on public.user_badges
  for select to authenticated using (student_id = auth.uid() or public.is_admin());
create policy "user_badges_insert_own" on public.user_badges
  for insert to authenticated with check (student_id = auth.uid() or public.is_admin());
