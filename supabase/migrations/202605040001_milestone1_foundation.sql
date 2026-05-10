create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  display_name text,
  language_preference text not null default 'en' check (language_preference in ('en', 'th')),
  grade_level text,
  school_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,
  name text,
  role text,
  grade_level text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'th')),
  interest_reason text,
  beta_access boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_normalized_key
  on public.waitlist_signups (email_normalized);

update public.waitlist_signups
set beta_access = true
where beta_access = false;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_th text,
  subject text not null,
  grade_level text,
  description_en text,
  description_th text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  course_id uuid not null references public.courses(id) on delete cascade,
  title_en text not null,
  title_th text,
  description_en text,
  description_th text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  module_id uuid not null references public.modules(id) on delete cascade,
  title_en text not null,
  title_th text,
  summary_en text,
  summary_th text,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_minutes integer not null default 10,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'published')),
  order_index integer not null default 0,
  created_by_ai boolean not null default false,
  reviewed_by uuid references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type text not null check (type in ('text', 'visual', 'simulation', 'multiple_choice', 'lumi_hint', 'reflection', 'next_lesson')),
  order_index integer not null default 0,
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (lesson_id, slug)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject text not null,
  title_en text not null,
  title_th text,
  description_en text,
  description_th text,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_skills (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (lesson_id, skill_id)
);

create table if not exists public.lesson_prerequisites (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  prerequisite_lesson_id uuid not null references public.lessons(id) on delete cascade,
  primary key (lesson_id, prerequisite_lesson_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  skill_id uuid references public.skills(id),
  question_type text not null default 'multiple_choice' check (question_type in ('multiple_choice', 'short_answer', 'true_false')),
  question_en text not null,
  question_th text,
  options_json jsonb,
  correct_answer jsonb not null,
  explanation_en text,
  explanation_th text,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_block_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_id uuid not null references public.lesson_blocks(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, block_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_id uuid not null references public.lesson_blocks(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_answer jsonb not null,
  is_correct boolean not null,
  attempt_number integer not null,
  time_spent_seconds integer,
  created_at timestamptz not null default now()
);

create table if not exists public.student_skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  mastery_score numeric not null default 0,
  confidence_level text not null default 'low' check (confidence_level in ('low', 'medium', 'high')),
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create table if not exists public.lumi_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id),
  course_id uuid references public.courses(id),
  language text not null default 'en' check (language in ('en', 'th')),
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.lumi_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.lumi_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  message text not null,
  retrieved_context_ids jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.waitlist_signups enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.skills enable row level security;
alter table public.lesson_skills enable row level security;
alter table public.lesson_prerequisites enable row level security;
alter table public.questions enable row level security;
alter table public.lesson_block_progress enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.question_attempts enable row level security;
alter table public.student_skill_mastery enable row level security;
alter table public.lumi_conversations enable row level security;
alter table public.lumi_messages enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "waitlist public insert" on public.waitlist_signups;
create policy "waitlist public insert" on public.waitlist_signups
  for insert with check (true);

drop policy if exists "published courses read" on public.courses;
create policy "published courses read" on public.courses
  for select using (status = 'published' and auth.role() = 'authenticated');

drop policy if exists "published modules read" on public.modules;
create policy "published modules read" on public.modules
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.courses
      where courses.id = modules.course_id
      and courses.status = 'published'
    )
  );

drop policy if exists "published lessons read" on public.lessons;
create policy "published lessons read" on public.lessons
  for select using (status = 'published' and auth.role() = 'authenticated');

drop policy if exists "published lesson blocks read" on public.lesson_blocks;
create policy "published lesson blocks read" on public.lesson_blocks
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.lessons
      where lessons.id = lesson_blocks.lesson_id
      and lessons.status = 'published'
    )
  );

drop policy if exists "skills authenticated read" on public.skills;
create policy "skills authenticated read" on public.skills
  for select using (auth.role() = 'authenticated');

drop policy if exists "lesson skills authenticated read" on public.lesson_skills;
create policy "lesson skills authenticated read" on public.lesson_skills
  for select using (auth.role() = 'authenticated');

drop policy if exists "lesson prerequisites authenticated read" on public.lesson_prerequisites;
create policy "lesson prerequisites authenticated read" on public.lesson_prerequisites
  for select using (auth.role() = 'authenticated');

drop policy if exists "questions for published lessons read" on public.questions;
create policy "questions for published lessons read" on public.questions
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.lessons
      where lessons.id = questions.lesson_id
      and lessons.status = 'published'
    )
  );

drop policy if exists "own block progress" on public.lesson_block_progress;
create policy "own block progress" on public.lesson_block_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lesson progress" on public.lesson_progress;
create policy "own lesson progress" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own question attempts" on public.question_attempts;
create policy "own question attempts" on public.question_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own skill mastery" on public.student_skill_mastery;
create policy "own skill mastery" on public.student_skill_mastery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lumi conversations" on public.lumi_conversations;
create policy "own lumi conversations" on public.lumi_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lumi messages" on public.lumi_messages;
create policy "own lumi messages" on public.lumi_messages
  for all using (
    exists (
      select 1 from public.lumi_conversations
      where lumi_conversations.id = lumi_messages.conversation_id
      and lumi_conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lumi_conversations
      where lumi_conversations.id = lumi_messages.conversation_id
      and lumi_conversations.user_id = auth.uid()
    )
  );
