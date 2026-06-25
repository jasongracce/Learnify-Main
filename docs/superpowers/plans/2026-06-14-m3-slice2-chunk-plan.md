# Milestone 3 Slice 2: Assignments, Quizzes, And Submissions - Chunk Plan

Date: 2026-06-14
Status: Planned
Contract: `docs/MILESTONE3_CLASSROOMS.md`, Slice 2

## Goal

Teachers can create meaningful classroom work, students can complete and submit
it, and Learnify records enough state for grading and the Slice 3 gradebook.

Slice 2 must support:

- Step-by-step assignment builder.
- Assignment types: Learnify lesson, quiz, manual submission, mixed assignment.
- Teacher-defined points per assignment item.
- Quiz question types: multiple choice, true/false, short answer,
  fill-in-the-blank.
- Teacher-editable skill/concept tags.
- Attachment/link metadata for teacher materials and student submissions.
- Student submission receipts.
- Objective auto-grading for multiple choice and true/false.
- Minimal manual grading state for open work.
- Attempt limits and late-submission settings.
- Lumi rule: `points > 0` means graded and Lumi is off; `points = 0` means
  practice and Lumi can be available.

## Non-Goals For Slice 2

These belong to later slices unless required for a narrow Slice 2 workflow:

- Points-only gradebook and CSV export.
- Private feedback threads.
- Announcements and calendar.
- Full notification centers.
- Classroom analytics.
- Google Drive OAuth or deep file sync.
- Production file storage workflow beyond metadata/link capture.

## Chunk 1: Data Model And Contracts

- Add shared Zod/types for assignments, assignment items, quiz questions,
  submissions, attachment metadata, and statuses.
- Add Supabase migration for:
  - `classroom_assignments`
  - `assignment_items`
  - `assignment_recipients`
  - `assignment_quiz_questions`
  - `student_assignment_submissions`
  - `student_assignment_item_submissions`
  - `submission_versions`
  - `assignment_attachments`
- Add RLS policies for teachers, students, school admins, and Learnify admins.
- Add demo seed assignment for `Physics 6A 2026`.
- Add type/schema tests and migration review notes.

Gate:

```txt
pnpm typecheck
pnpm --filter @learnify/core test
pnpm --filter @learnify/database test
pnpm dlx supabase@latest db reset
```

`supabase db reset` requires Docker Desktop locally.

## Chunk 2: Core Assignment Rules

- Assignment status transitions: `draft`, `published`, `closed`, `deleted`.
- Submission statuses: `not_started`, `draft`, `submitted`,
  `late_submitted`, `returned`, `resubmitted`, `graded`.
- Required vs optional item completion.
- Due date and late-submission rules.
- Attempt-limit rules for quiz items.
- Points/practice logic.
- Auto-grade rules for multiple choice and true/false.
- Manual grading eligibility for attachments, short answers, fill-in-the-blank,
  and open submission work.

Gate:

```txt
pnpm --filter @learnify/core test
```

## Chunk 3: Database Repositories

- Create/list/update assignment drafts.
- Publish assignment to active classroom students.
- Fetch teacher assignment detail.
- Fetch student assignment list/detail.
- Save draft submission.
- Submit assignment.
- Record quiz item attempts.
- Preserve submission versions.
- Return minimal grade/submission state.

Gate:

```txt
pnpm --filter @learnify/database test
```

## Chunk 4: Teacher Assignment Builder API

Routes:

```txt
POST /api/classrooms/[classroomId]/assignments
GET /api/classrooms/[classroomId]/assignments
GET /api/assignments/[assignmentId]
PATCH /api/assignments/[assignmentId]
POST /api/assignments/[assignmentId]/publish
```

Requirements:

- Validate teacher owns the classroom.
- Support Learnify lesson, quiz, manual submission, and mixed assignment items.
- Validate points, required/optional settings, due date, attempt limit, and late
  policy.
- Write audit events.

Gate:

```txt
pnpm --filter web test:api
```

## Chunk 5: Student Assignment And Submission API

Routes:

```txt
GET /api/student/assignments
GET /api/student/assignments/[assignmentId]
POST /api/student/assignments/[assignmentId]/draft
POST /api/student/assignments/[assignmentId]/submit
POST /api/student/assignments/[assignmentId]/quiz-attempt
```

Requirements:

- Students can only access assigned classroom work.
- Required items must be complete before final submit.
- Objective quiz answers are auto-graded where possible.
- Open work can be saved as draft and submitted.
- Submission response includes visible receipt fields.

Gate:

```txt
pnpm --filter web test:api
```

## Chunk 6: Teacher UI

- Classroom assignment tab/list.
- Step-by-step builder:
  - details
  - items
  - points/settings
  - review/publish
- Quiz question editor.
- Manual submission item editor.
- Attachment/link metadata fields.
- Teacher assignment detail page with submission summary.

Gate:

```txt
pnpm --filter web build
pnpm --filter web test:e2e
```

Authenticated role smoke tests require saved Playwright auth states.

## Chunk 7: Student UI

- Student assignment list.
- Assignment detail.
- Lesson item link.
- Quiz answering UI.
- Manual text/link submission UI.
- Attachment metadata UI if storage is not ready.
- Submission receipt.

Gate:

```txt
pnpm --filter web build
pnpm --filter web test:e2e
```

## Chunk 8: Lumi-Assisted Quiz Drafts

- Add teacher-only draft generation route.
- Use existing `packages/ai` provider adapter pattern.
- Return structured quiz draft JSON.
- Teacher must edit/approve before publish.
- Never auto-publish generated questions.
- Mock provider coverage first; live model is optional.

Gate:

```txt
pnpm --filter @learnify/ai test
pnpm --filter web test:api
```

## Chunk 9: Final Slice 2 Stabilization

- Full verification:

```txt
pnpm typecheck
pnpm test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web test:e2e
pnpm dlx supabase@latest db reset
```

- Seed validation.
- Optional authenticated Playwright flow:

```txt
teacher creates assignment
student submits
teacher sees submission
```

- Update docs with Slice 2 completion status and Slice 3 handoff.
