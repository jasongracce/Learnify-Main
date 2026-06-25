-- =============================================================================
-- Milestone 3 Slice 1 demo classroom seed records
-- =============================================================================

insert into public.schools (
  id,
  name,
  slug,
  subscription_status,
  admin_seat_limit,
  teacher_seat_limit,
  student_seat_limit,
  student_overage_allowed_by_learnify,
  student_overage_enabled_by_school,
  renewal_date
)
values (
  '10000000-0000-4000-8000-000000000001',
  'Demo School',
  'demo-school',
  'active',
  3,
  5,
  200,
  false,
  false,
  null
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  subscription_status = excluded.subscription_status,
  admin_seat_limit = excluded.admin_seat_limit,
  teacher_seat_limit = excluded.teacher_seat_limit,
  student_seat_limit = excluded.student_seat_limit,
  student_overage_allowed_by_learnify = excluded.student_overage_allowed_by_learnify,
  student_overage_enabled_by_school = excluded.student_overage_enabled_by_school;

insert into public.school_memberships (
  id,
  school_id,
  user_id,
  role,
  status,
  email_normalized,
  seat_consumed,
  overage,
  invited_by,
  activated_at
)
values (
  '10000000-0000-4000-8000-000000000100',
  '10000000-0000-4000-8000-000000000001',
  null,
  'school_admin',
  'active',
  'school-admin@demo.learnify.academy',
  true,
  false,
  null,
  now()
),
(
  '10000000-0000-4000-8000-000000000101',
  '10000000-0000-4000-8000-000000000001',
  null,
  'teacher',
  'active',
  'teacher@demo.learnify.academy',
  true,
  false,
  null,
  now()
),
(
  '10000000-0000-4000-8000-000000000102',
  '10000000-0000-4000-8000-000000000001',
  null,
  'student',
  'invited',
  'student@demo.learnify.academy',
  false,
  false,
  null,
  null
)
on conflict (id) do update set
  status = excluded.status,
  seat_consumed = excluded.seat_consumed,
  activated_at = excluded.activated_at;

insert into public.school_invites (
  id,
  school_id,
  email,
  email_normalized,
  role,
  token_hash,
  status,
  invited_by,
  expires_at
)
values
  (
    '10000000-0000-4000-8000-000000000201',
    '10000000-0000-4000-8000-000000000001',
    'admin@demo.learnify.academy',
    'admin@demo.learnify.academy',
    'school_admin',
    'demo-school-admin-invite-token-hash',
    'pending',
    null,
    now() + interval '14 days'
  ),
  (
    '10000000-0000-4000-8000-000000000202',
    '10000000-0000-4000-8000-000000000001',
    'teacher@demo.learnify.academy',
    'teacher@demo.learnify.academy',
    'teacher',
    'demo-teacher-invite-token-hash',
    'pending',
    null,
    now() + interval '14 days'
  )
on conflict (id) do update set
  status = excluded.status,
  expires_at = excluded.expires_at;

insert into public.classrooms (
  id,
  school_id,
  owner_membership_id,
  name,
  slug,
  subject_label,
  subject_normalized,
  school_year,
  grade_label,
  status,
  join_code,
  join_token_hash,
  join_enabled
)
values (
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000101',
  'Physics 6A 2026',
  'physics-6a-2026-demo',
  'Physics',
  'physics',
  '2026',
  '6A',
  'active',
  'PHY6A2',
  'demo-physics-6a-2026-join-token-hash',
  true
)
on conflict (id) do update set
  name = excluded.name,
  subject_label = excluded.subject_label,
  subject_normalized = excluded.subject_normalized,
  school_year = excluded.school_year,
  grade_label = excluded.grade_label,
  status = excluded.status,
  join_enabled = excluded.join_enabled;

insert into public.classroom_join_requests (
  id,
  school_id,
  classroom_id,
  student_user_id,
  student_membership_id,
  email,
  email_normalized,
  source,
  status,
  requested_at
)
values (
  '10000000-0000-4000-8000-000000000501',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000301',
  null,
  '10000000-0000-4000-8000-000000000102',
  'student@demo.learnify.academy',
  'student@demo.learnify.academy',
  'email_invite',
  'pending_teacher_approval',
  now()
)
on conflict (id) do update set
  status = excluded.status,
  requested_at = excluded.requested_at;
