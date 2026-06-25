# M3 Slice 2 Chunk 1: Data Model And Contracts - Implementation Plan

Date: 2026-06-14
Status: Planned
Parent plan: `docs/superpowers/plans/2026-06-14-m3-slice2-chunk-plan.md`
Contract: `docs/MILESTONE3_CLASSROOMS.md`, Slice 2

## Goal

Add the assignment, quiz, attachment, and submission data contracts that later
Slice 2 chunks will use. This chunk should not build assignment UI or route
handlers beyond what is needed for schema/type verification.

## Success Criteria

- Shared TypeScript/Zod contracts exist for Slice 2 assignment entities.
- Supabase migration defines Slice 2 tables, indexes, constraints, and RLS.
- Demo seed creates one draft/published classroom assignment for the seeded
  `Physics 6A 2026` classroom without requiring real auth users.
- Tests pin status/type constants and representative schema validation.
- Existing gates still pass.

## Proposed Tables

### `classroom_assignments`

Purpose: assignment shell owned by one classroom.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
created_by_membership_id uuid not null references public.school_memberships(id)
title text not null
description text
assignment_type text not null
status text not null default 'draft'
due_at timestamptz
publish_at timestamptz
late_submissions_allowed boolean not null default true
max_attempts integer
total_points numeric not null default 0
settings_json jsonb not null default '{}'
published_at timestamptz
closed_at timestamptz
deleted_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Allowed `assignment_type`:

```txt
lesson
quiz
manual_submission
mixed
```

Allowed `status`:

```txt
draft
published
closed
deleted
```

### `assignment_items`

Purpose: ordered items inside an assignment. Mixed assignments are just multiple
items with different `item_type` values.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
assignment_id uuid not null references public.classroom_assignments(id) on delete cascade
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
item_type text not null
title text not null
instructions text
order_index integer not null default 0
points numeric not null default 0
required boolean not null default true
lesson_id uuid references public.lessons(id)
content_json jsonb not null default '{}'
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Allowed `item_type`:

```txt
learnify_lesson
quiz
manual_submission
attachment
```

Important invariant:

```txt
points > 0 => graded work and Lumi off during work
points = 0 => practice and Lumi can be available
```

### `assignment_recipients`

Purpose: one row per assigned student school/classroom membership.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
assignment_id uuid not null references public.classroom_assignments(id) on delete cascade
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
student_user_id uuid not null references public.profiles(id) on delete cascade
student_membership_id uuid not null references public.school_memberships(id)
classroom_membership_id uuid not null references public.classroom_memberships(id)
status text not null default 'assigned'
assigned_at timestamptz not null default now()
unique (assignment_id, student_user_id)
```

Allowed `status`:

```txt
assigned
in_progress
submitted
returned
graded
missing
excused
```

Note: `missing` and `excused` are mostly Slice 3 behavior but are cheap status
values to reserve now.

### `assignment_quiz_questions`

Purpose: teacher-authored quiz questions attached to an assignment item.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
assignment_id uuid not null references public.classroom_assignments(id) on delete cascade
assignment_item_id uuid not null references public.assignment_items(id) on delete cascade
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
question_type text not null
prompt text not null
options_json jsonb
correct_answer_json jsonb
explanation text
skill_tags text[] not null default '{}'
order_index integer not null default 0
points numeric not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Allowed `question_type`:

```txt
multiple_choice
true_false
short_answer
fill_in_blank
```

Autograde only:

```txt
multiple_choice
true_false
```

### `assignment_attachments`

Purpose: metadata/link layer first. Actual file storage can be wired in a later
chunk without changing the assignment model.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
assignment_id uuid references public.classroom_assignments(id) on delete cascade
assignment_item_id uuid references public.assignment_items(id) on delete cascade
submission_id uuid
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
owner_user_id uuid references public.profiles(id) on delete set null
attachment_type text not null
title text
url text
storage_path text
mime_type text
metadata_json jsonb not null default '{}'
created_at timestamptz not null default now()
```

Allowed `attachment_type`:

```txt
pdf
image
video
audio
google_drive
link
file
```

### `student_assignment_submissions`

Purpose: one current submission state per student assignment.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
assignment_id uuid not null references public.classroom_assignments(id) on delete cascade
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
student_user_id uuid not null references public.profiles(id) on delete cascade
student_membership_id uuid not null references public.school_memberships(id)
recipient_id uuid not null references public.assignment_recipients(id) on delete cascade
status text not null default 'not_started'
score numeric
max_score numeric
submitted_at timestamptz
graded_at timestamptz
returned_at timestamptz
latest_version integer not null default 0
receipt_json jsonb not null default '{}'
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique (assignment_id, student_user_id)
```

Allowed `status`:

```txt
not_started
draft
submitted
late_submitted
returned
resubmitted
graded
```

### `student_assignment_item_submissions`

Purpose: per-item student work and grading state.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
submission_id uuid not null references public.student_assignment_submissions(id) on delete cascade
assignment_id uuid not null references public.classroom_assignments(id) on delete cascade
assignment_item_id uuid not null references public.assignment_items(id) on delete cascade
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
student_user_id uuid not null references public.profiles(id) on delete cascade
status text not null default 'not_started'
answer_json jsonb not null default '{}'
score numeric
max_score numeric
attempt_count integer not null default 0
auto_graded boolean not null default false
submitted_at timestamptz
graded_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
unique (submission_id, assignment_item_id)
```

Allowed `status`:

```txt
not_started
draft
submitted
late_submitted
returned
resubmitted
graded
completed
```

### `submission_versions`

Purpose: immutable version history for each final/draft save that matters for
audit and latest-submission behavior.

Key columns:

```sql
id uuid primary key default gen_random_uuid()
submission_id uuid not null references public.student_assignment_submissions(id) on delete cascade
assignment_id uuid not null references public.classroom_assignments(id) on delete cascade
school_id uuid not null references public.schools(id) on delete cascade
classroom_id uuid not null references public.classrooms(id) on delete cascade
student_user_id uuid not null references public.profiles(id) on delete cascade
version_number integer not null
status text not null
snapshot_json jsonb not null default '{}'
created_at timestamptz not null default now()
unique (submission_id, version_number)
```

## RLS Direction

Use service-role route handlers for all writes. RLS should still be enabled and
safe for reads.

Teacher policies:

- Teachers can read assignments, items, recipients, submissions, versions, and
  attachments for classrooms they own.
- Direct authenticated writes are not required in Chunk 1.

Student policies:

- Students can read published assignments assigned to them.
- Students can read their own recipients, submissions, item submissions,
  versions, and attachments.
- Students cannot read classmate submission state.

School admin policies:

- School admins can read assignment shell/usage metadata for their school.
- School admins should not read private submission content beyond what is
  required for school-level management. For Chunk 1, prefer no direct read on
  submission body tables for school admins.

Learnify admin policies:

- Learnify admins can read/manage all Slice 2 tables for support.

## Shared Contracts

Create `packages/shared/src/assignments.ts` and export it from
`packages/shared/src/index.ts`.

Include:

- status arrays and Zod enums
- record types matching database rows
- request schemas reserved for later route chunks:
  - `createAssignmentDraftRequestSchema`
  - `updateAssignmentDraftRequestSchema`
  - `publishAssignmentRequestSchema`
  - `saveStudentAssignmentDraftRequestSchema`
  - `submitStudentAssignmentRequestSchema`
  - `recordAssignmentQuizAttemptRequestSchema`

Keep request schemas conservative in Chunk 1; they can be expanded in API
chunks.

## Tests

Create `packages/shared/src/assignments.test.ts` only if the package currently
has a test setup. If not, place schema coverage in the first package that
already runs Vitest without adding new tooling.

Required test coverage:

- valid assignment type/status constants
- valid item type constants
- valid quiz question types
- create assignment draft schema accepts mixed assignment with lesson, quiz, and
  manual submission item metadata
- invalid negative points are rejected
- invalid quiz question type is rejected
- submission status enum includes all Slice 2 manual submission statuses

## Migration File

Create:

```txt
supabase/migrations/202606140001_milestone3_slice2_assignments_foundation.sql
```

Use additive migration only. Do not edit existing applied Slice 1 migrations.

Migration sections:

1. tables
2. indexes
3. `updated_at` triggers using existing `public.set_updated_at()`
4. RLS enablement
5. RLS read policies

Indexes should cover:

- `(school_id, classroom_id)`
- `(classroom_id, status)`
- `(assignment_id, order_index)`
- `(assignment_id, student_user_id)`
- `(student_user_id, status)`
- `(submission_id, version_number)`

## Seed File

Create:

```txt
supabase/migrations/202606140002_milestone3_slice2_demo_assignment_seed.sql
```

Seed direction:

- Resolve the demo school/classroom by known slug from Slice 1 seed.
- Insert one published mixed assignment:
  - title: `Gravity Checkpoint`
  - item 1: Learnify lesson item for `gravity-and-falling-objects`
  - item 2: quiz item with one multiple choice and one true/false question
  - item 3: manual text/link submission item
  - due date can be null
  - total points should equal item/question points
- Do not require real auth users.
- Create no student submissions in seed unless demo classroom memberships exist
  reliably.

## Execution Steps

1. Create `packages/shared/src/assignments.ts`.
2. Export assignment contracts from `packages/shared/src/index.ts`.
3. Add or update tests for assignment schemas/status constants.
4. Create the Slice 2 foundation migration.
5. Create the Slice 2 demo assignment seed migration.
6. Run formatting/lint where applicable.
7. Run verification gates.

## Verification Gates

Required:

```txt
pnpm typecheck
pnpm test
pnpm --filter web lint
pnpm --filter web build
```

Database gate:

```txt
pnpm dlx supabase@latest db reset
```

If Docker Desktop is unavailable, record the exact Docker/Supabase CLI error and
do not mark the migration gate complete.

## Commit Guidance

Suggested commit after green gates:

```txt
feat(assignments): add Slice 2 assignment data contracts
```

Do not include unrelated local artifacts such as screenshots, `.claude/`, or
`.playwright-mcp/`.
