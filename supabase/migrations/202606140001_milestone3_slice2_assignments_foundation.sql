-- =============================================================================
-- Milestone 3 Slice 2: Assignment Data Foundation
-- =============================================================================

create table if not exists public.classroom_assignments (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools(id) on delete cascade,
  classroom_id    uuid not null references public.classrooms(id) on delete cascade,
  created_by      uuid references public.profiles(id) on delete set null,
  title_en        text not null,
  title_th        text,
  description_en  text,
  description_th  text,
  assignment_type text not null default 'mixed'
    check (assignment_type in ('lesson','quiz','manual_submission','mixed')),
  status          text not null default 'draft'
    check (status in ('draft','published','closed','deleted')),
  total_points    numeric not null default 0 check (total_points >= 0),
  due_at          timestamptz,
  published_at    timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists classroom_assignments_school_classroom_idx
  on public.classroom_assignments (school_id, classroom_id);
create index if not exists classroom_assignments_classroom_status_idx
  on public.classroom_assignments (classroom_id, status);
create index if not exists classroom_assignments_classroom_published_at_idx
  on public.classroom_assignments (classroom_id, published_at desc);

create table if not exists public.assignment_items (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.classroom_assignments(id) on delete cascade,
  item_type       text not null
    check (item_type in ('learnify_lesson','quiz','manual_submission','attachment')),
  order_index     integer not null default 0 check (order_index >= 0),
  title_en        text not null,
  title_th        text,
  instructions_en text,
  instructions_th text,
  lesson_id       uuid references public.lessons(id) on delete set null,
  points          numeric not null default 0 check (points >= 0),
  required        boolean not null default true,
  settings        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists assignment_items_assignment_order_idx
  on public.assignment_items (assignment_id, order_index);

create table if not exists public.assignment_recipients (
  id                      uuid primary key default gen_random_uuid(),
  assignment_id           uuid not null references public.classroom_assignments(id) on delete cascade,
  classroom_membership_id uuid not null references public.classroom_memberships(id) on delete cascade,
  student_user_id         uuid not null references public.profiles(id) on delete cascade,
  status                  text not null default 'assigned'
    check (status in ('assigned','in_progress','submitted','returned','graded','missing','excused')),
  assigned_at             timestamptz not null default now(),
  due_at                  timestamptz,
  first_opened_at         timestamptz,
  submitted_at            timestamptz,
  returned_at             timestamptz,
  graded_at               timestamptz,
  excused_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (assignment_id, student_user_id)
);

create index if not exists assignment_recipients_student_status_idx
  on public.assignment_recipients (student_user_id, status);

create table if not exists public.assignment_quiz_questions (
  id                 uuid primary key default gen_random_uuid(),
  assignment_item_id uuid not null references public.assignment_items(id) on delete cascade,
  question_type      text not null
    check (question_type in ('multiple_choice','true_false','short_answer','fill_in_blank')),
  order_index        integer not null default 0 check (order_index >= 0),
  prompt_en          text not null,
  prompt_th          text,
  options_json       jsonb,
  correct_answer     jsonb,
  explanation_en     text,
  explanation_th     text,
  points             numeric not null default 1 check (points >= 0),
  max_attempts       integer check (max_attempts is null or max_attempts >= 1),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists assignment_quiz_questions_item_order_idx
  on public.assignment_quiz_questions (assignment_item_id, order_index);

create table if not exists public.student_assignment_submissions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.classroom_assignments(id) on delete cascade,
  recipient_id    uuid not null references public.assignment_recipients(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'not_started'
    check (status in ('not_started','draft','submitted','late_submitted','returned','resubmitted','graded')),
  score           numeric check (score is null or score >= 0),
  max_score       numeric not null default 0 check (max_score >= 0),
  submitted_at    timestamptz,
  late            boolean not null default false,
  returned_at     timestamptz,
  graded_at       timestamptz,
  graded_by       uuid references public.profiles(id) on delete set null,
  feedback_en     text,
  feedback_th     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (assignment_id, student_user_id),
  unique (recipient_id)
);

create index if not exists student_assignment_submissions_student_status_idx
  on public.student_assignment_submissions (student_user_id, status);

create table if not exists public.student_assignment_item_submissions (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null references public.student_assignment_submissions(id) on delete cascade,
  assignment_item_id uuid not null references public.assignment_items(id) on delete cascade,
  status             text not null default 'not_started'
    check (status in ('not_started','in_progress','draft','submitted','late_submitted','returned','resubmitted','graded','completed')),
  answer_json        jsonb,
  score              numeric check (score is null or score >= 0),
  max_score          numeric not null default 0 check (max_score >= 0),
  attempts_count     integer not null default 0 check (attempts_count >= 0),
  completed_at       timestamptz,
  feedback_en        text,
  feedback_th        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (submission_id, assignment_item_id)
);

create table if not exists public.submission_versions (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.student_assignment_submissions(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  body_json      jsonb not null default '{}',
  submitted_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (submission_id, version_number)
);

create table if not exists public.assignment_attachments (
  id                 uuid primary key default gen_random_uuid(),
  assignment_id      uuid references public.classroom_assignments(id) on delete cascade,
  assignment_item_id uuid references public.assignment_items(id) on delete cascade,
  submission_id      uuid references public.student_assignment_submissions(id) on delete cascade,
  attachment_type    text not null
    check (attachment_type in ('pdf','image','video','audio','google_drive','link','file')),
  title              text not null,
  url                text not null,
  storage_path       text,
  metadata           jsonb not null default '{}',
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  check (
    assignment_id is not null
    or assignment_item_id is not null
    or submission_id is not null
  )
);

create index if not exists assignment_attachments_assignment_idx
  on public.assignment_attachments (assignment_id);
create index if not exists assignment_attachments_item_idx
  on public.assignment_attachments (assignment_item_id);
create index if not exists assignment_attachments_submission_idx
  on public.assignment_attachments (submission_id);

create trigger classroom_assignments_updated_at
  before update on public.classroom_assignments
  for each row execute function public.set_updated_at();

create trigger assignment_items_updated_at
  before update on public.assignment_items
  for each row execute function public.set_updated_at();

create trigger assignment_recipients_updated_at
  before update on public.assignment_recipients
  for each row execute function public.set_updated_at();

create trigger assignment_quiz_questions_updated_at
  before update on public.assignment_quiz_questions
  for each row execute function public.set_updated_at();

create trigger student_assignment_submissions_updated_at
  before update on public.student_assignment_submissions
  for each row execute function public.set_updated_at();

create trigger student_assignment_item_submissions_updated_at
  before update on public.student_assignment_item_submissions
  for each row execute function public.set_updated_at();

alter table public.classroom_assignments enable row level security;
alter table public.assignment_items enable row level security;
alter table public.assignment_recipients enable row level security;
alter table public.assignment_quiz_questions enable row level security;
alter table public.student_assignment_submissions enable row level security;
alter table public.student_assignment_item_submissions enable row level security;
alter table public.submission_versions enable row level security;
alter table public.assignment_attachments enable row level security;

create policy "learnify_admin_manage_classroom_assignments" on public.classroom_assignments
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "teacher_read_classroom_assignments" on public.classroom_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where c.id = classroom_assignments.classroom_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  );

create policy "school_admin_read_classroom_assignments" on public.classroom_assignments
  for select to authenticated
  using (public.get_school_membership_id(school_id, 'school_admin') is not null);

create policy "student_read_assigned_published_assignments" on public.classroom_assignments
  for select to authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.assignment_recipients ar
      where ar.assignment_id = classroom_assignments.id
        and ar.student_user_id = auth.uid()
    )
  );

create policy "learnify_admin_manage_assignment_items" on public.assignment_items
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "member_read_assignment_items" on public.assignment_items
  for select to authenticated
  using (
    exists (
      select 1 from public.classroom_assignments ca
      join public.classrooms c on c.id = ca.classroom_id
      left join public.school_memberships teacher_sm on teacher_sm.id = c.owner_membership_id
      where ca.id = assignment_items.assignment_id
        and (
          public.get_school_membership_id(ca.school_id, 'school_admin') is not null
          or (
            teacher_sm.user_id = auth.uid()
            and teacher_sm.status = 'active'
          )
          or (
            ca.status = 'published'
            and exists (
              select 1 from public.assignment_recipients ar
              where ar.assignment_id = ca.id
                and ar.student_user_id = auth.uid()
            )
          )
        )
    )
  );

create policy "learnify_admin_manage_assignment_recipients" on public.assignment_recipients
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "teacher_read_assignment_recipients" on public.assignment_recipients
  for select to authenticated
  using (
    exists (
      select 1 from public.classroom_assignments ca
      join public.classrooms c on c.id = ca.classroom_id
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where ca.id = assignment_recipients.assignment_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  );

create policy "school_admin_read_assignment_recipients" on public.assignment_recipients
  for select to authenticated
  using (
    exists (
      select 1 from public.classroom_assignments ca
      where ca.id = assignment_recipients.assignment_id
        and public.get_school_membership_id(ca.school_id, 'school_admin') is not null
    )
  );

create policy "student_read_own_assignment_recipients" on public.assignment_recipients
  for select to authenticated
  using (student_user_id = auth.uid());

create policy "learnify_admin_manage_assignment_quiz_questions" on public.assignment_quiz_questions
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "member_read_assignment_quiz_questions" on public.assignment_quiz_questions
  for select to authenticated
  using (
    exists (
      select 1 from public.assignment_items ai
      join public.classroom_assignments ca on ca.id = ai.assignment_id
      join public.classrooms c on c.id = ca.classroom_id
      left join public.school_memberships teacher_sm on teacher_sm.id = c.owner_membership_id
      where ai.id = assignment_quiz_questions.assignment_item_id
        and (
          public.get_school_membership_id(ca.school_id, 'school_admin') is not null
          or (
            teacher_sm.user_id = auth.uid()
            and teacher_sm.status = 'active'
          )
          or (
            ca.status = 'published'
            and exists (
              select 1 from public.assignment_recipients ar
              where ar.assignment_id = ca.id
                and ar.student_user_id = auth.uid()
            )
          )
        )
    )
  );

create policy "learnify_admin_manage_student_assignment_submissions" on public.student_assignment_submissions
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "teacher_read_student_assignment_submissions" on public.student_assignment_submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.classroom_assignments ca
      join public.classrooms c on c.id = ca.classroom_id
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where ca.id = student_assignment_submissions.assignment_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  );

create policy "student_read_own_assignment_submissions" on public.student_assignment_submissions
  for select to authenticated
  using (student_user_id = auth.uid());

create policy "learnify_admin_manage_student_assignment_item_submissions" on public.student_assignment_item_submissions
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "teacher_read_student_assignment_item_submissions" on public.student_assignment_item_submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.student_assignment_submissions sas
      join public.classroom_assignments ca on ca.id = sas.assignment_id
      join public.classrooms c on c.id = ca.classroom_id
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where sas.id = student_assignment_item_submissions.submission_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  );

create policy "student_read_own_assignment_item_submissions" on public.student_assignment_item_submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.student_assignment_submissions sas
      where sas.id = student_assignment_item_submissions.submission_id
        and sas.student_user_id = auth.uid()
    )
  );

create policy "learnify_admin_manage_submission_versions" on public.submission_versions
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "teacher_read_submission_versions" on public.submission_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.student_assignment_submissions sas
      join public.classroom_assignments ca on ca.id = sas.assignment_id
      join public.classrooms c on c.id = ca.classroom_id
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where sas.id = submission_versions.submission_id
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  );

create policy "student_read_own_submission_versions" on public.submission_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.student_assignment_submissions sas
      where sas.id = submission_versions.submission_id
        and sas.student_user_id = auth.uid()
    )
  );

create policy "learnify_admin_manage_assignment_attachments" on public.assignment_attachments
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

create policy "teacher_read_assignment_attachments" on public.assignment_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.classroom_assignments ca
      join public.classrooms c on c.id = ca.classroom_id
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where (
          ca.id = assignment_attachments.assignment_id
          or exists (
            select 1 from public.assignment_items ai
            where ai.id = assignment_attachments.assignment_item_id
              and ai.assignment_id = ca.id
          )
          or exists (
            select 1 from public.student_assignment_submissions sas
            where sas.id = assignment_attachments.submission_id
              and sas.assignment_id = ca.id
          )
        )
        and sm.user_id = auth.uid()
        and sm.status = 'active'
    )
  );

create policy "school_admin_read_assignment_material_attachments" on public.assignment_attachments
  for select to authenticated
  using (
    submission_id is null
    and exists (
      select 1 from public.classroom_assignments ca
      where (
          ca.id = assignment_attachments.assignment_id
          or exists (
            select 1 from public.assignment_items ai
            where ai.id = assignment_attachments.assignment_item_id
              and ai.assignment_id = ca.id
          )
        )
        and public.get_school_membership_id(ca.school_id, 'school_admin') is not null
    )
  );

create policy "student_read_own_assignment_attachments" on public.assignment_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.assignment_recipients ar
      where ar.student_user_id = auth.uid()
        and (
          ar.assignment_id = assignment_attachments.assignment_id
          or exists (
            select 1 from public.assignment_items ai
            where ai.id = assignment_attachments.assignment_item_id
              and ai.assignment_id = ar.assignment_id
          )
        )
    )
    or exists (
      select 1 from public.student_assignment_submissions sas
      where sas.id = assignment_attachments.submission_id
        and sas.student_user_id = auth.uid()
    )
  );
