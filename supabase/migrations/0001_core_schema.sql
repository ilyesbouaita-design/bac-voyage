-- ============================================================
-- BacAllemand — Core schema
-- Profiles & roles · Grammatik · Wortschatz · Exam engine · Gamification
-- ============================================================

-- ---------- ENUMS ----------
create type user_role     as enum ('admin','student');
create type app_locale    as enum ('fr','ar');
create type pillar        as enum ('grammatik','wortschatz','exam');
create type exercise_type as enum ('mcq','true_false','fill_blank','cloze','matching','ordering','short_text','flashcard','essay');
create type cefr_level    as enum ('A1','A2','B1','B2');
create type attempt_status as enum ('in_progress','submitted','graded');
create type grade_method  as enum ('auto','ai','manual');

-- ---------- SHARED HELPERS ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------- PROFILES (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            user_role  not null default 'student',
  display_name    text,
  locale          app_locale not null default 'fr',
  avatar_url      text,
  -- gamification state
  xp              integer not null default 0,
  level           integer not null default 1,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_active_date date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role check helper (security definer so it can read profiles under RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    'fr'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent students from escalating their own role
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end; $$;
create trigger trg_profiles_role_guard
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ============================================================
-- PILLAR 1 — GRAMMATIK
-- ============================================================
create table if not exists public.grammar_topics (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  title_fr      text not null,
  title_ar      text,
  description_fr text,
  description_ar text,
  cefr_level    cefr_level,
  order_index   integer not null default 0,
  is_published  boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_grammar_topics_updated
  before update on public.grammar_topics
  for each row execute function public.set_updated_at();

create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  topic_id     uuid not null references public.grammar_topics(id) on delete cascade,
  title_fr     text not null,
  title_ar     text,
  body_fr      jsonb,   -- TipTap document JSON
  body_ar      jsonb,
  order_index  integer not null default 0,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_lessons_topic on public.lessons(topic_id);
create trigger trg_lessons_updated
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ============================================================
-- PILLAR 2 — WORTSCHATZ
-- ============================================================
create table if not exists public.vocab_sets (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,
  title_fr     text not null,
  title_ar     text,
  theme        text,
  cefr_level   cefr_level,
  order_index  integer not null default 0,
  is_published boolean not null default false,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_vocab_sets_updated
  before update on public.vocab_sets
  for each row execute function public.set_updated_at();

create table if not exists public.vocab_words (
  id             uuid primary key default gen_random_uuid(),
  set_id         uuid not null references public.vocab_sets(id) on delete cascade,
  term_de        text not null,
  article        text,            -- der / die / das
  plural_de      text,
  translation_fr text,
  translation_ar text,
  example_de     text,
  example_fr     text,
  example_ar     text,
  audio_url      text,
  image_url      text,
  order_index    integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_vocab_words_set on public.vocab_words(set_id);

-- ============================================================
-- SHARED EXERCISES (type-driven via content jsonb)
-- ============================================================
create table if not exists public.exercises (
  id              uuid primary key default gen_random_uuid(),
  pillar          pillar not null,
  topic_id        uuid references public.grammar_topics(id) on delete set null,
  set_id          uuid references public.vocab_sets(id) on delete set null,
  type            exercise_type not null,
  title_fr        text,
  title_ar        text,
  instructions_fr text,
  instructions_ar text,
  content         jsonb not null default '{}'::jsonb,  -- type-specific payload + answer key
  points          integer not null default 10,
  cefr_level      cefr_level,
  order_index     integer not null default 0,
  is_published    boolean not null default false,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_exercises_pillar on public.exercises(pillar);
create trigger trg_exercises_updated
  before update on public.exercises
  for each row execute function public.set_updated_at();

-- ============================================================
-- PILLAR 3 — EXAM ENGINE
-- ============================================================
create table if not exists public.exams (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,
  title_fr      text not null,
  title_ar      text,
  description_fr text,
  description_ar text,
  cefr_level    cefr_level,
  duration_minutes integer,
  total_points  integer not null default 20,   -- bac is scored out of 20
  is_published  boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_exams_updated
  before update on public.exams
  for each row execute function public.set_updated_at();

create table if not exists public.exam_sections (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams(id) on delete cascade,
  kind         text not null,    -- reading | grammar | vocabulary | writing | listening
  title_fr     text,
  title_ar     text,
  instructions_fr text,
  instructions_ar text,
  passage_de   text,             -- reading passage or writing prompt
  order_index  integer not null default 0
);
create index if not exists idx_exam_sections_exam on public.exam_sections(exam_id);

create table if not exists public.exam_questions (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references public.exam_sections(id) on delete cascade,
  type         exercise_type not null,
  prompt_de    text,
  prompt_fr    text,
  prompt_ar    text,
  content      jsonb not null default '{}'::jsonb,  -- options / answer key
  rubric       jsonb,                               -- grading rubric for ai/essay
  points       numeric not null default 1,
  grade_method grade_method not null default 'auto',
  order_index  integer not null default 0
);
create index if not exists idx_exam_questions_section on public.exam_questions(section_id);

create table if not exists public.exam_attempts (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams(id) on delete cascade,
  student_id   uuid not null references public.profiles(id) on delete cascade,
  status       attempt_status not null default 'in_progress',
  score        numeric,
  max_score    numeric,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at    timestamptz
);
create index if not exists idx_attempts_student on public.exam_attempts(student_id);
create index if not exists idx_attempts_exam on public.exam_attempts(exam_id);

create table if not exists public.exam_answers (
  id            uuid primary key default gen_random_uuid(),
  attempt_id    uuid not null references public.exam_attempts(id) on delete cascade,
  question_id   uuid not null references public.exam_questions(id) on delete cascade,
  response      jsonb,
  is_correct    boolean,
  score         numeric,
  graded_method grade_method,
  feedback_fr   text,
  feedback_ar   text,
  graded_at     timestamptz,
  unique(attempt_id, question_id)
);
create index if not exists idx_answers_attempt on public.exam_answers(attempt_id);

-- ============================================================
-- GAMIFICATION
-- ============================================================
create table if not exists public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  source     text not null,            -- exercise | exam | daily_goal | streak
  amount     integer not null,
  ref_type   text,
  ref_id     uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_xp_student on public.xp_events(student_id);
create index if not exists idx_xp_created on public.xp_events(created_at);

create table if not exists public.badges (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title_fr     text not null,
  title_ar     text,
  description_fr text,
  description_ar text,
  icon         text,
  criteria     jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.user_badges (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  unique(student_id, badge_id)
);
create index if not exists idx_user_badges_student on public.user_badges(student_id);
