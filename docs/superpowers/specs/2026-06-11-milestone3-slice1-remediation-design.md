# Milestone 3 Slice 1 Remediation Design

Date: 2026-06-11
Status: Approved
Contract: `docs/MILESTONE3_CLASSROOMS.md` (source of truth — section references below are to that file)
Launch plan: `learnify-2-week-launch-plan.md` (external, Jason's Downloads)

## Context

An earlier session produced ~2,400 lines of uncommitted Slice 1 backend code:

- `packages/shared/src/classrooms.ts` — types + Zod schemas (contract §8/§9 compliant)
- `packages/core/src/classrooms.ts` — seat/invite/transition rules (contract compliant, untested)
- `packages/database/src/classrooms.ts` — repository functions
- `supabase/migrations/202606110001_milestone3_classrooms_slice1.sql` — 8 tables + RLS
- `apps/web/src/lib/auth/classrooms.ts` + 18 API route handlers
- No tests, no UI, no emails, no seeds

A contract-compliance review (2026-06-11) found the skeleton worth keeping but
not shippable. Decision: keep and fix in chunks, each chunk ending with a green
verification gate and a commit.

## Review findings to remediate

Critical:

1. Code/QR joins create join requests with `student_membership_id: null`; no
   school membership is ever created. `approveJoinRequest` silently skips
   activation and classroom membership creation when the id is null — teacher
   approval of a new student creates nothing while reporting success.
2. Approving a student already `active` in the school (second classroom) calls
   `activateMembership`, which throws. Contract §6: must succeed without
   consuming another seat.
3. 23 TypeScript errors across 12 route files: `schoolId` destructured from Zod
   schemas that do not define it (classrooms create, teacher invite, admin
   invite, student invites); `parsed.data.token` vs `joinToken` in join/token
   route; auth helper return types do not narrow, so `auth.membership` errors
   in 9 routes.
4. Migration uniqueness wrong: `unique(school_id, user_id, role)` and
   `unique(school_id, email_normalized, role)` allow one person to hold two
   roles in the same school (forbidden by §2) and block re-inviting removed
   members. Must be partial unique indexes scoped to live statuses.
5. Teacher invites rejected (422) at seat capacity. §7: pending invites may
   exceed seats; seat is consumed on acceptance; `pending_capacity` fallback.
6. Student email invites create only an invite record, not the pending join
   request required by §6, and no route redeems the invite token.

Missing entirely: remove-student route (§10), Resend email sending (§16 step
6), seeds (§14), all tests (§13), all UI (§16 steps 7–11).

Minor (fix opportunistically): approval flow non-transactional; `security
definer` SQL helpers lack `set search_path`; bulk-invite failure report
attributes errors to wrong emails; raw invite tokens returned in API responses.

## Chunk plan

Each chunk: implement → gate green → commit on `milestone3-classrooms-contract`.

### Chunk 1 — Stabilize the foundation

- Fix all 23 type errors:
  - Add `schoolId` (uuid string) to `createClassroomRequestSchema`,
    `sendTeacherInviteRequestSchema`, `sendSchoolAdminInviteRequestSchema`
    (used by `/api/school/invites/admin`), `sendStudentInvitesRequestSchema`.
  - Fix `joinToken` field read in `/api/classrooms/join/token`.
  - Give auth helpers discriminated-union return types so `"response" in auth`
    narrows and `auth.membership` typechecks.
- Unit tests for `@learnify/core` classroom rules (§13 core list): subject
  normalization, classroom slug generation, join code generation/uniqueness,
  invite expiry, exact-email invite acceptance, teacher/student/admin seat
  capacity, overage allowed×enabled matrix, membership status transitions,
  join request status transitions, deactivation frees seats.
- Migration fixes (edit in place — migration is uncommitted and never applied):
  - Replace the two unique constraints with partial unique indexes:
    one live role per `(school_id, user_id)` and per
    `(school_id, email_normalized)` where status in
    ('invited','active','pending_capacity','inactive').
  - `set search_path = public` on `is_learnify_admin`,
    `get_school_membership_id`, `set_updated_at`.
- Gate: `pnpm typecheck` green; core tests green; `supabase db reset` green
  locally (skip if Docker/local Supabase unavailable — note in commit).

### Chunk 2 — Fix join/approve flow + route tests

- Join by code/QR creates or reuses a pending (`invited`) student school
  membership at request time; join request always carries a membership id.
- `approveJoinRequest`: already-active membership → no activation, no extra
  seat; otherwise activate with capacity check; always create classroom
  membership on approval; §2 teacher copy preserved.
- Teacher invite at capacity → invite still created, membership stays
  `pending_capacity` (no 422).
- Route handler tests per §13 list.
- Gate: route tests green.

### Chunk 3 — Complete the backend surface

- `POST /api/classrooms/[classroomId]/students/[membershipId]/remove`.
- Student email invites create pending join requests (§6) + token redemption
  path for `/join/[joinToken]` student invites.
- Resend helpers + branded EN/TH templates for school-admin and teacher
  invites from `Learnify <onboarding@app.learnify.academy>`; stop returning
  raw tokens in API responses.
- §14 seeds: demo school (seats 3/5/200, overage false), one school admin
  invite, one teacher invite/membership, classroom `Physics 6A 2026`.
- Gate: full backend test suite green.

### Chunk 4 — UI: dashboards + admin surfaces (§16 steps 7, 11)

Role-specific dashboard shells on dashboard v1; Learnify admin school
management + audit view; school admin users/invites/seat usage.

### Chunk 5 — UI: classroom creation + student join (§16 steps 8–9)

Classroom creation (required name + subject), code + QR display,
regenerate/disable; student join `/{locale}/app/join/[joinToken]` + code
entry; pending/rejected states with exact §2 copy.

### Chunk 6 — UI: roster + notifications + localization (§16 step 10, §12)

Teacher roster active/pending, one-by-one approve/reject, red-dot pending
badge (TanStack Query); school admin notification center (seat limit,
overage, invite accepted); EN/TH pass on all new surfaces.

## Out of scope

- Slices 2–5 features (§15 non-goals auto-rejected).
- Deployment, Resend domain verification, pilot outreach — operational tasks
  owned by Jason per the launch plan.
