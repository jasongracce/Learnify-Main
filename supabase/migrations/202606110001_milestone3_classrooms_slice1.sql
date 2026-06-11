-- =============================================================================
-- Milestone 3 · Slice 1: School And Classroom Foundation
-- =============================================================================

-- ---------------------------------------------------------------------------
-- schools
-- ---------------------------------------------------------------------------

create table if not exists public.schools (
  id                                  uuid primary key default gen_random_uuid(),
  name                                text not null,
  slug                                text not null unique,
  subscription_status                 text not null default 'active'
    check (subscription_status in ('active','suspended','expired','grace_ended','cancelled')),
  admin_seat_limit                    integer not null default 3 check (admin_seat_limit > 0),
  teacher_seat_limit                  integer not null check (teacher_seat_limit > 0),
  student_seat_limit                  integer not null check (student_seat_limit > 0),
  student_overage_allowed_by_learnify boolean not null default false,
  student_overage_enabled_by_school   boolean not null default false,
  renewal_date                        date,
  created_by                          uuid references public.profiles(id) on delete set null,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);

create index if not exists schools_slug_idx on public.schools (slug);
create index if not exists schools_subscription_status_idx on public.schools (subscription_status);

-- ---------------------------------------------------------------------------
-- school_memberships
-- ---------------------------------------------------------------------------

create table if not exists public.school_memberships (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete set null,
  role              text not null
    check (role in ('school_admin','teacher','student')),
  status            text not null
    check (status in ('invited','active','pending_capacity','inactive','removed')),
  email_normalized  text not null,
  seat_consumed     boolean not null default false,
  overage           boolean not null default false,
  invited_by        uuid references public.profiles(id) on delete set null,
  activated_at      timestamptz,
  deactivated_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists school_memberships_school_id_idx on public.school_memberships (school_id);
create index if not exists school_memberships_user_id_idx on public.school_memberships (user_id);
create index if not exists school_memberships_email_normalized_idx on public.school_memberships (school_id, email_normalized);
create index if not exists school_memberships_status_idx on public.school_memberships (school_id, status);

-- One live membership — and therefore one role — per user per school (§2).
-- 'removed' rows are history and do not block a fresh invite.
create unique index if not exists school_memberships_one_live_user_idx
  on public.school_memberships (school_id, user_id)
  where user_id is not null
    and status in ('invited','active','pending_capacity','inactive');

-- One live membership identity per normalized email per school (§2).
create unique index if not exists school_memberships_one_live_email_idx
  on public.school_memberships (school_id, email_normalized)
  where status in ('invited','active','pending_capacity','inactive');

-- ---------------------------------------------------------------------------
-- school_invites  (school admin + teacher)
-- ---------------------------------------------------------------------------

create table if not exists public.school_invites (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  email            text not null,
  email_normalized text not null,
  role             text not null
    check (role in ('school_admin','teacher')),
  token_hash       text not null unique,
  status           text not null default 'pending'
    check (status in ('pending','accepted','expired','deleted','revoked')),
  invited_by       uuid references public.profiles(id) on delete set null,
  accepted_by      uuid references public.profiles(id) on delete set null,
  expires_at       timestamptz not null,
  accepted_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists school_invites_school_id_idx on public.school_invites (school_id);
create index if not exists school_invites_token_hash_idx on public.school_invites (token_hash);
create index if not exists school_invites_email_normalized_idx on public.school_invites (school_id, email_normalized);
create index if not exists school_invites_status_idx on public.school_invites (status);

-- ---------------------------------------------------------------------------
-- classrooms
-- ---------------------------------------------------------------------------

create table if not exists public.classrooms (
  id                   uuid primary key default gen_random_uuid(),
  school_id            uuid not null references public.schools(id) on delete cascade,
  owner_membership_id  uuid not null references public.school_memberships(id),
  name                 text not null,
  slug                 text not null unique,
  subject_label        text not null,
  subject_normalized   text,
  school_year          text,
  grade_label          text,
  status               text not null default 'active'
    check (status in ('active','archived','deleted')),
  join_code            text not null unique,
  join_token_hash      text not null unique,
  join_enabled         boolean not null default true,
  archived_at          timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists classrooms_school_id_idx on public.classrooms (school_id);
create index if not exists classrooms_slug_idx on public.classrooms (slug);
create index if not exists classrooms_join_code_idx on public.classrooms (join_code);
create index if not exists classrooms_status_idx on public.classrooms (school_id, status);

-- ---------------------------------------------------------------------------
-- classroom_join_requests
-- ---------------------------------------------------------------------------

create table if not exists public.classroom_join_requests (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references public.schools(id) on delete cascade,
  classroom_id          uuid not null references public.classrooms(id) on delete cascade,
  student_user_id       uuid references public.profiles(id) on delete set null,
  student_membership_id uuid references public.school_memberships(id) on delete set null,
  email                 text,
  email_normalized      text,
  source                text not null
    check (source in ('code','qr','email_invite')),
  status                text not null default 'pending_teacher_approval'
    check (status in ('pending_teacher_approval','pending_capacity','approved','rejected','cancelled')),
  requested_at          timestamptz not null default now(),
  approved_by           uuid references public.profiles(id) on delete set null,
  approved_at           timestamptz,
  rejected_by           uuid references public.profiles(id) on delete set null,
  rejected_at           timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists classroom_join_requests_classroom_id_idx on public.classroom_join_requests (classroom_id);
create index if not exists classroom_join_requests_student_user_id_idx on public.classroom_join_requests (student_user_id);
create index if not exists classroom_join_requests_status_idx on public.classroom_join_requests (classroom_id, status);
create index if not exists classroom_join_requests_school_id_idx on public.classroom_join_requests (school_id);

-- ---------------------------------------------------------------------------
-- classroom_memberships
-- ---------------------------------------------------------------------------

create table if not exists public.classroom_memberships (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references public.schools(id) on delete cascade,
  classroom_id          uuid not null references public.classrooms(id) on delete cascade,
  student_membership_id uuid not null references public.school_memberships(id),
  student_user_id       uuid not null references public.profiles(id) on delete cascade,
  status                text not null default 'active'
    check (status in ('active','removed')),
  joined_at             timestamptz,
  removed_at            timestamptz,
  removed_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (classroom_id, student_user_id)
);

create index if not exists classroom_memberships_classroom_id_idx on public.classroom_memberships (classroom_id);
create index if not exists classroom_memberships_student_user_id_idx on public.classroom_memberships (student_user_id);
create index if not exists classroom_memberships_school_id_idx on public.classroom_memberships (school_id);

-- ---------------------------------------------------------------------------
-- classroom_student_invites
-- ---------------------------------------------------------------------------

create table if not exists public.classroom_student_invites (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  classroom_id     uuid not null references public.classrooms(id) on delete cascade,
  email            text not null,
  email_normalized text not null,
  token_hash       text not null unique,
  status           text not null default 'pending'
    check (status in ('pending','accepted','expired','deleted','revoked')),
  invited_by       uuid not null references public.profiles(id) on delete cascade,
  expires_at       timestamptz not null,
  accepted_by      uuid references public.profiles(id) on delete set null,
  accepted_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists classroom_student_invites_classroom_id_idx on public.classroom_student_invites (classroom_id);
create index if not exists classroom_student_invites_token_hash_idx on public.classroom_student_invites (token_hash);
create index if not exists classroom_student_invites_email_normalized_idx on public.classroom_student_invites (classroom_id, email_normalized);
create index if not exists classroom_student_invites_status_idx on public.classroom_student_invites (status);

-- ---------------------------------------------------------------------------
-- school_audit_events
-- ---------------------------------------------------------------------------

create table if not exists public.school_audit_events (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references public.schools(id) on delete cascade,
  actor_user_id       uuid references public.profiles(id) on delete set null,
  actor_membership_id uuid references public.school_memberships(id) on delete set null,
  event_type          text not null,
  target_type         text not null,
  target_id           uuid,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists school_audit_events_school_id_idx on public.school_audit_events (school_id, created_at desc);
create index if not exists school_audit_events_event_type_idx on public.school_audit_events (event_type);
create index if not exists school_audit_events_actor_user_id_idx on public.school_audit_events (actor_user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_updated_at
  before update on public.schools
  for each row execute function public.set_updated_at();

create trigger school_memberships_updated_at
  before update on public.school_memberships
  for each row execute function public.set_updated_at();

create trigger school_invites_updated_at
  before update on public.school_invites
  for each row execute function public.set_updated_at();

create trigger classrooms_updated_at
  before update on public.classrooms
  for each row execute function public.set_updated_at();

create trigger classroom_join_requests_updated_at
  before update on public.classroom_join_requests
  for each row execute function public.set_updated_at();

create trigger classroom_memberships_updated_at
  before update on public.classroom_memberships
  for each row execute function public.set_updated_at();

create trigger classroom_student_invites_updated_at
  before update on public.classroom_student_invites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.school_invites enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_join_requests enable row level security;
alter table public.classroom_memberships enable row level security;
alter table public.classroom_student_invites enable row level security;
alter table public.school_audit_events enable row level security;

-- Helper: check if the caller is a Learnify platform admin
create or replace function public.is_learnify_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
$$;

-- Helper: get caller's active membership id for a school
create or replace function public.get_school_membership_id(p_school_id uuid, p_role text default null)
returns uuid language sql security definer set search_path = public as $$
  select id from public.school_memberships
  where school_id = p_school_id
    and user_id = auth.uid()
    and status = 'active'
    and (p_role is null or role = p_role)
  limit 1
$$;

-- ---- schools ----

-- Learnify admins can manage schools; service role bypasses RLS
create policy "learnify_admin_manage_schools" on public.schools
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- School admins + teachers + students can read their own school
create policy "school_member_read_school" on public.schools
  for select to authenticated
  using (
    exists (
      select 1 from public.school_memberships
      where school_id = schools.id
        and user_id = auth.uid()
        and status = 'active'
    )
  );

-- ---- school_memberships ----

create policy "learnify_admin_manage_memberships" on public.school_memberships
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- School admins can read all memberships in their school
create policy "school_admin_read_memberships" on public.school_memberships
  for select to authenticated
  using (
    public.get_school_membership_id(school_id, 'school_admin') is not null
  );

-- Teachers can read their own school memberships
create policy "teacher_read_own_school_membership" on public.school_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
  );

-- Students can read their own membership
create policy "student_read_own_membership" on public.school_memberships
  for select to authenticated
  using (user_id = auth.uid());

-- ---- school_invites ----

create policy "learnify_admin_manage_school_invites" on public.school_invites
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- School admins can read invites for their school
create policy "school_admin_read_invites" on public.school_invites
  for select to authenticated
  using (
    public.get_school_membership_id(school_id, 'school_admin') is not null
  );

-- ---- classrooms ----

create policy "learnify_admin_manage_classrooms" on public.classrooms
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- School admins can read all classrooms in their school
create policy "school_admin_read_classrooms" on public.classrooms
  for select to authenticated
  using (
    public.get_school_membership_id(school_id, 'school_admin') is not null
  );

-- Teachers can read their own classrooms
create policy "teacher_read_own_classrooms" on public.classrooms
  for select to authenticated
  using (
    exists (
      select 1 from public.school_memberships sm
      where sm.id = classrooms.owner_membership_id
        and sm.user_id = auth.uid()
    )
  );

-- Students can read classrooms they are members of
create policy "student_read_enrolled_classrooms" on public.classrooms
  for select to authenticated
  using (
    exists (
      select 1 from public.classroom_memberships cm
      where cm.classroom_id = classrooms.id
        and cm.student_user_id = auth.uid()
        and cm.status = 'active'
    )
  );

-- ---- classroom_join_requests ----

create policy "learnify_admin_manage_join_requests" on public.classroom_join_requests
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- Teachers can read join requests for their classrooms
create policy "teacher_read_join_requests" on public.classroom_join_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where c.id = classroom_join_requests.classroom_id
        and sm.user_id = auth.uid()
    )
  );

-- Students can read their own join requests
create policy "student_read_own_join_requests" on public.classroom_join_requests
  for select to authenticated
  using (student_user_id = auth.uid());

-- ---- classroom_memberships ----

create policy "learnify_admin_manage_classroom_memberships" on public.classroom_memberships
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- Teachers can read roster for their classrooms
create policy "teacher_read_classroom_roster" on public.classroom_memberships
  for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where c.id = classroom_memberships.classroom_id
        and sm.user_id = auth.uid()
    )
  );

-- Students can read their own classroom memberships
create policy "student_read_own_classroom_memberships" on public.classroom_memberships
  for select to authenticated
  using (student_user_id = auth.uid());

-- ---- classroom_student_invites ----

create policy "learnify_admin_manage_student_invites" on public.classroom_student_invites
  for all to authenticated
  using (public.is_learnify_admin())
  with check (public.is_learnify_admin());

-- Teachers can read student invites for their classrooms
create policy "teacher_read_student_invites" on public.classroom_student_invites
  for select to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      join public.school_memberships sm on sm.id = c.owner_membership_id
      where c.id = classroom_student_invites.classroom_id
        and sm.user_id = auth.uid()
    )
  );

-- ---- school_audit_events ----

create policy "learnify_admin_read_audit_events" on public.school_audit_events
  for select to authenticated
  using (public.is_learnify_admin());

-- School admins can read their school's audit events
create policy "school_admin_read_audit_events" on public.school_audit_events
  for select to authenticated
  using (
    public.get_school_membership_id(school_id, 'school_admin') is not null
  );
