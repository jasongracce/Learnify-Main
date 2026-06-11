# M3 Slice 1 Chunk 1: Stabilize the Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing uncommitted Slice 1 backend compile (fix all 23 TS errors), pin the `@learnify/core` classroom rules with unit tests, and fix the migration's uniqueness constraints and SQL function hardening.

**Architecture:** No new modules. Three repair fronts: (1) characterization unit tests for the already-written pure rules in `packages/core/src/classrooms.ts`; (2) type-layer fixes — add `schoolId` to the Zod request schemas that routes destructure it from, fix one field-name mismatch, and give the auth helpers explicit discriminated-union return types so `"response" in auth` narrows; (3) edit the uncommitted migration in place (it has never been applied anywhere) to replace role-scoped unique constraints with partial unique indexes and pin `search_path` on SQL functions.

**Tech Stack:** TypeScript 5.8, Zod, vitest 3, Next.js 15 route handlers, Supabase (Postgres + RLS), pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-06-11-milestone3-slice1-remediation-design.md` (Chunk 1 section). Contract: `docs/MILESTONE3_CLASSROOMS.md` §2, §9, §11, §13, §16.

**Note on test style:** The core-rule implementations already exist, so Tasks 1–3 are characterization tests: write the test asserting the contract-required behavior, run it, and expect PASS. If a test fails, the implementation (not the test) is wrong — fix the implementation to match the contract and re-run. The tests still come before any other code changes so later chunks refactor against a pinned baseline.

---

### Task 1: Core unit tests — generation and normalization helpers

**Files:**
- Create: `packages/core/src/__tests__/classrooms.test.ts`

Covers §13: subject normalization, classroom slug generation, class code generation uniqueness, invite expiry logic.

- [ ] **Step 1: Write the tests**

Create `packages/core/src/__tests__/classrooms.test.ts` with exactly:

```typescript
import { describe, expect, it } from "vitest"
import {
  buildInviteExpiresAt,
  generateClassroomSlug,
  generateJoinCode,
  generateRawToken,
  generateSchoolSlug,
  hashToken,
  isInviteExpired,
  normalizeInviteEmail,
  normalizeSubject,
} from "../index"

describe("normalizeInviteEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeInviteEmail("  Teacher@School.AC.TH ")).toBe(
      "teacher@school.ac.th"
    )
  })
})

describe("normalizeSubject", () => {
  it("maps physics-like labels to physics", () => {
    expect(normalizeSubject("Physics 6A")).toBe("physics")
    expect(normalizeSubject("thermodynamics")).toBe("physics")
  })

  it("maps math-like labels to mathematics", () => {
    expect(normalizeSubject("Algebra II")).toBe("mathematics")
  })

  it("returns null for unrecognized labels", () => {
    expect(normalizeSubject("Underwater Basket Weaving")).toBeNull()
  })
})

describe("generateClassroomSlug", () => {
  it("lowercases, hyphenates, and appends random noise", () => {
    const slug = generateClassroomSlug("Physics 6A 2026")
    expect(slug).toMatch(/^physics-6a-2026-[0-9a-f]{6}$/)
  })

  it("strips characters outside a-z0-9, space, hyphen", () => {
    const slug = generateClassroomSlug("M.3/1 วิทย์ Physics!")
    expect(slug).toMatch(/^m31-physics-[0-9a-f]{6}$/)
  })

  it("produces different slugs for the same name", () => {
    expect(generateClassroomSlug("Same Name")).not.toBe(
      generateClassroomSlug("Same Name")
    )
  })
})

describe("generateSchoolSlug", () => {
  it("is deterministic with no noise suffix", () => {
    expect(generateSchoolSlug("Bangkok Demo School")).toBe(
      "bangkok-demo-school"
    )
  })
})

describe("generateJoinCode", () => {
  it("is 6 chars from the unambiguous charset (no 0, O, 1, I)", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateJoinCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it("does not collide across many draws", () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateJoinCode()))
    // Collisions are theoretically possible; near-total uniqueness is the bar.
    expect(codes.size).toBeGreaterThan(990)
  })
})

describe("tokens", () => {
  it("generates 64-char hex raw tokens", () => {
    expect(generateRawToken()).toMatch(/^[0-9a-f]{64}$/)
  })

  it("hashes deterministically and never equals the raw token", () => {
    const raw = generateRawToken()
    expect(hashToken(raw)).toBe(hashToken(raw))
    expect(hashToken(raw)).not.toBe(raw)
  })
})

describe("invite expiry", () => {
  const issued = new Date("2026-06-11T00:00:00.000Z")

  it("expires 14 days after issue (contract §5)", () => {
    expect(buildInviteExpiresAt(issued)).toBe("2026-06-25T00:00:00.000Z")
  })

  it("is not expired one minute before the deadline", () => {
    const expiresAt = buildInviteExpiresAt(issued)
    expect(
      isInviteExpired(expiresAt, new Date("2026-06-24T23:59:00.000Z"))
    ).toBe(false)
  })

  it("is expired one minute after the deadline", () => {
    const expiresAt = buildInviteExpiresAt(issued)
    expect(
      isInviteExpired(expiresAt, new Date("2026-06-25T00:01:00.000Z"))
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `pnpm --filter @learnify/core test`
Expected: all new tests PASS (alongside existing `learning-rules.test.ts`). If any fail, fix the implementation in `packages/core/src/classrooms.ts` to match the asserted contract behavior, not the test.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/__tests__/classrooms.test.ts packages/core/src/classrooms.ts packages/core/src/index.ts packages/shared/src/index.ts packages/shared/src/classrooms.ts
git commit -m "test(core): pin classroom generation and normalization rules"
```

(The `packages/*/src/index.ts` files carry the uncommitted `export * from "./classrooms"` lines these tests need; committing them here makes the test commit self-contained.)

---

### Task 2: Core unit tests — seat capacity and overage matrix

**Files:**
- Modify: `packages/core/src/__tests__/classrooms.test.ts` (append)

Covers §13: teacher seat capacity, student seat capacity, student overage allowed/enabled behavior. Contract §2/§7: overage requires BOTH Learnify-allowed AND school-enabled.

- [ ] **Step 1: Append the tests**

Append to `packages/core/src/__tests__/classrooms.test.ts`:

```typescript
import {
  checkAdminSeatCapacity,
  checkStudentSeatCapacity,
  checkTeacherSeatCapacity,
} from "../index"

describe("checkTeacherSeatCapacity", () => {
  it("allows below the limit", () => {
    expect(
      checkTeacherSeatCapacity({ teacherSeatLimit: 5, activeTeachers: 4 })
    ).toEqual({ allowed: true })
  })

  it("blocks at the limit — teacher overage is not supported (§2)", () => {
    expect(
      checkTeacherSeatCapacity({ teacherSeatLimit: 5, activeTeachers: 5 })
    ).toEqual({ allowed: false, reason: "no_teacher_seats" })
  })
})

describe("checkAdminSeatCapacity", () => {
  it("allows below the limit and blocks at the limit", () => {
    expect(
      checkAdminSeatCapacity({ adminSeatLimit: 3, activeAdmins: 2 })
    ).toEqual({ allowed: true })
    expect(
      checkAdminSeatCapacity({ adminSeatLimit: 3, activeAdmins: 3 })
    ).toEqual({ allowed: false, reason: "no_admin_seats" })
  })
})

describe("checkStudentSeatCapacity — overage matrix (§2)", () => {
  const atCapacity = { studentSeatLimit: 200, activeStudents: 200 }

  it("below limit: allowed without overage regardless of flags", () => {
    expect(
      checkStudentSeatCapacity({
        studentSeatLimit: 200,
        activeStudents: 199,
        studentOverageAllowedByLearnify: false,
        studentOverageEnabledBySchool: false,
      })
    ).toEqual({ allowed: true, overage: false })
  })

  it("at limit + allowed + enabled: allowed as overage", () => {
    expect(
      checkStudentSeatCapacity({
        ...atCapacity,
        studentOverageAllowedByLearnify: true,
        studentOverageEnabledBySchool: true,
      })
    ).toEqual({ allowed: true, overage: true })
  })

  it("at limit + allowed but NOT enabled: blocked", () => {
    expect(
      checkStudentSeatCapacity({
        ...atCapacity,
        studentOverageAllowedByLearnify: true,
        studentOverageEnabledBySchool: false,
      })
    ).toEqual({ allowed: false, reason: "no_student_seats" })
  })

  it("at limit + enabled but NOT allowed: blocked", () => {
    expect(
      checkStudentSeatCapacity({
        ...atCapacity,
        studentOverageAllowedByLearnify: false,
        studentOverageEnabledBySchool: true,
      })
    ).toEqual({ allowed: false, reason: "no_student_seats" })
  })

  it("at limit + neither: blocked", () => {
    expect(
      checkStudentSeatCapacity({
        ...atCapacity,
        studentOverageAllowedByLearnify: false,
        studentOverageEnabledBySchool: false,
      })
    ).toEqual({ allowed: false, reason: "no_student_seats" })
  })
})
```

(Move the `import` lines up to join the existing import block from `"../index"` — vitest/ESM requires imports at top level; merging them into the single existing import is cleanest.)

- [ ] **Step 2: Run the tests**

Run: `pnpm --filter @learnify/core test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/__tests__/classrooms.test.ts
git commit -m "test(core): pin seat capacity rules and student overage matrix"
```

---

### Task 3: Core unit tests — membership, join request, and invite acceptance transitions

**Files:**
- Modify: `packages/core/src/__tests__/classrooms.test.ts` (append)

Covers §13: school membership status transitions, classroom join request status transitions, exact-email invite acceptance. Contract §2 exact copy paths depend on these statuses.

- [ ] **Step 1: Append the tests**

Append (again merging imports into the top-level import from `"../index"`):

```typescript
import {
  resolveJoinRequestApproval,
  resolveJoinRequestCancellation,
  resolveJoinRequestRejection,
  resolveMembershipActivation,
  resolveMembershipDeactivation,
  resolveMembershipReactivation,
  validateInviteAcceptance,
} from "../index"

describe("resolveMembershipActivation", () => {
  it("invited + capacity → active, consumes seat", () => {
    expect(
      resolveMembershipActivation({
        currentStatus: "invited",
        capacityResult: { allowed: true },
        role: "teacher",
      })
    ).toEqual({ nextStatus: "active", consumesSeat: true, overage: false })
  })

  it("invited + no capacity → pending_capacity, no seat", () => {
    expect(
      resolveMembershipActivation({
        currentStatus: "invited",
        capacityResult: { allowed: false, reason: "no_teacher_seats" },
        role: "teacher",
      })
    ).toEqual({
      nextStatus: "pending_capacity",
      consumesSeat: false,
      overage: false,
    })
  })

  it("invited student + overage capacity → active with overage flag", () => {
    expect(
      resolveMembershipActivation({
        currentStatus: "invited",
        capacityResult: { allowed: true, overage: true },
        role: "student",
      })
    ).toEqual({ nextStatus: "active", consumesSeat: true, overage: true })
  })

  it("pending_capacity can activate once capacity frees", () => {
    expect(
      resolveMembershipActivation({
        currentStatus: "pending_capacity",
        capacityResult: { allowed: true },
        role: "teacher",
      })
    ).toEqual({ nextStatus: "active", consumesSeat: true, overage: false })
  })

  it("active/inactive/removed cannot activate", () => {
    for (const currentStatus of ["active", "inactive", "removed"] as const) {
      const result = resolveMembershipActivation({
        currentStatus,
        capacityResult: { allowed: true },
        role: "student",
      })
      expect(result).toHaveProperty("error")
    }
  })
})

describe("resolveMembershipDeactivation", () => {
  it("active → inactive (frees seat at repo layer, preserves history)", () => {
    expect(resolveMembershipDeactivation({ currentStatus: "active" })).toEqual({
      nextStatus: "inactive",
    })
  })

  it("invited → inactive (revoking a pending member)", () => {
    expect(resolveMembershipDeactivation({ currentStatus: "invited" })).toEqual({
      nextStatus: "inactive",
    })
  })

  it("inactive/removed cannot deactivate again", () => {
    for (const currentStatus of ["inactive", "removed"] as const) {
      expect(
        resolveMembershipDeactivation({ currentStatus })
      ).toHaveProperty("error")
    }
  })
})

describe("resolveMembershipReactivation", () => {
  it("inactive + capacity → active", () => {
    expect(
      resolveMembershipReactivation({
        currentStatus: "inactive",
        capacityResult: { allowed: true },
      })
    ).toEqual({ nextStatus: "active", consumesSeat: true, overage: false })
  })

  it("inactive + no capacity → pending_capacity", () => {
    expect(
      resolveMembershipReactivation({
        currentStatus: "inactive",
        capacityResult: { allowed: false, reason: "no_student_seats" },
      })
    ).toEqual({
      nextStatus: "pending_capacity",
      consumesSeat: false,
      overage: false,
    })
  })

  it("only inactive memberships can reactivate", () => {
    for (const currentStatus of [
      "invited",
      "active",
      "pending_capacity",
      "removed",
    ] as const) {
      expect(
        resolveMembershipReactivation({
          currentStatus,
          capacityResult: { allowed: true },
        })
      ).toHaveProperty("error")
    }
  })
})

describe("classroom join request transitions", () => {
  it("pending_teacher_approval + capacity → approved", () => {
    expect(
      resolveJoinRequestApproval({
        currentStatus: "pending_teacher_approval",
        capacityResult: { allowed: true, overage: false },
      })
    ).toEqual({ nextStatus: "approved" })
  })

  it("pending_teacher_approval + no capacity → pending_capacity (§2)", () => {
    expect(
      resolveJoinRequestApproval({
        currentStatus: "pending_teacher_approval",
        capacityResult: { allowed: false, reason: "no_student_seats" },
      })
    ).toEqual({ nextStatus: "pending_capacity" })
  })

  it("pending_capacity + freed capacity → approved", () => {
    expect(
      resolveJoinRequestApproval({
        currentStatus: "pending_capacity",
        capacityResult: { allowed: true, overage: true },
      })
    ).toEqual({ nextStatus: "approved" })
  })

  it("approved/rejected/cancelled cannot be re-approved", () => {
    for (const currentStatus of ["approved", "rejected", "cancelled"] as const) {
      expect(
        resolveJoinRequestApproval({
          currentStatus,
          capacityResult: { allowed: true, overage: false },
        })
      ).toHaveProperty("error")
    }
  })

  it("both pending states can be rejected, terminal states cannot", () => {
    expect(
      resolveJoinRequestRejection({ currentStatus: "pending_teacher_approval" })
    ).toEqual({ nextStatus: "rejected" })
    expect(
      resolveJoinRequestRejection({ currentStatus: "pending_capacity" })
    ).toEqual({ nextStatus: "rejected" })
    expect(
      resolveJoinRequestRejection({ currentStatus: "approved" })
    ).toHaveProperty("error")
  })

  it("students can cancel both pending states, not terminal ones (§4)", () => {
    expect(
      resolveJoinRequestCancellation({
        currentStatus: "pending_teacher_approval",
      })
    ).toEqual({ nextStatus: "cancelled" })
    expect(
      resolveJoinRequestCancellation({ currentStatus: "pending_capacity" })
    ).toEqual({ nextStatus: "cancelled" })
    expect(
      resolveJoinRequestCancellation({ currentStatus: "rejected" })
    ).toHaveProperty("error")
  })
})

describe("validateInviteAcceptance (§5 exact email matching)", () => {
  const base = {
    inviteEmailNormalized: "teacher@school.ac.th",
    inviteStatus: "pending" as const,
    expiresAt: "2026-06-25T00:00:00.000Z",
    now: new Date("2026-06-12T00:00:00.000Z"),
  }

  it("accepts an exact normalized email match", () => {
    expect(
      validateInviteAcceptance({
        ...base,
        acceptingEmailNormalized: "teacher@school.ac.th",
      })
    ).toEqual({ valid: true })
  })

  it("rejects a mismatched email", () => {
    expect(
      validateInviteAcceptance({
        ...base,
        acceptingEmailNormalized: "other@school.ac.th",
      })
    ).toEqual({ valid: false, reason: "email_mismatch" })
  })

  it("rejects expired invites", () => {
    expect(
      validateInviteAcceptance({
        ...base,
        acceptingEmailNormalized: "teacher@school.ac.th",
        now: new Date("2026-07-01T00:00:00.000Z"),
      })
    ).toEqual({ valid: false, reason: "expired" })
  })

  it("rejects already-accepted invites", () => {
    expect(
      validateInviteAcceptance({
        ...base,
        inviteStatus: "accepted",
        acceptingEmailNormalized: "teacher@school.ac.th",
      })
    ).toEqual({ valid: false, reason: "already_used" })
  })

  it("rejects revoked and deleted invites", () => {
    for (const inviteStatus of ["revoked", "deleted"] as const) {
      expect(
        validateInviteAcceptance({
          ...base,
          inviteStatus,
          acceptingEmailNormalized: "teacher@school.ac.th",
        })
      ).toEqual({ valid: false, reason: "revoked" })
    }
  })
})
```

- [ ] **Step 2: Run the tests**

Run: `pnpm --filter @learnify/core test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/__tests__/classrooms.test.ts
git commit -m "test(core): pin membership, join request, and invite acceptance transitions"
```

---

### Task 4: Add `schoolId` to request schemas and fix the one schema-name split

**Files:**
- Modify: `packages/shared/src/classrooms.ts`
- Modify: `apps/web/src/app/api/school/invites/admin/route.ts` (import line only)

Fixes 4 of the 23 errors (`schoolId does not exist`). The Learnify-admin route (`/api/admin/schools/[schoolId]/school-admin-invites`) takes `schoolId` from the URL and keeps the base schema; the school-level route (`/api/school/invites/admin`) needs it in the body, so it gets an extended schema.

- [ ] **Step 1: Edit `packages/shared/src/classrooms.ts`**

After the existing `sendSchoolAdminInviteRequestSchema` block, add:

```typescript
// School-level variant: school admins inviting additional admins pass the
// school in the body (the Learnify-admin route takes it from the URL).
export const inviteSchoolAdminRequestSchema =
  sendSchoolAdminInviteRequestSchema.extend({
    schoolId: z.string().uuid(),
  })

export type InviteSchoolAdminRequest = z.infer<
  typeof inviteSchoolAdminRequestSchema
>
```

In `sendTeacherInviteRequestSchema`, add a `schoolId` field:

```typescript
export const sendTeacherInviteRequestSchema = z.object({
  schoolId: z.string().uuid(),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  locale: z.enum(["en", "th"]).default("en"),
})
```

In `createClassroomRequestSchema`, add a `schoolId` field:

```typescript
export const createClassroomRequestSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  subjectLabel: z.string().trim().min(1).max(120),
  schoolYear: z.string().trim().max(20).optional(),
  gradeLabel: z.string().trim().max(40).optional(),
})
```

In `sendStudentInvitesRequestSchema`, add a `schoolId` field:

```typescript
export const sendStudentInvitesRequestSchema = z.object({
  schoolId: z.string().uuid(),
  emails: z
    .string()
    .trim()
    .min(1)
    .transform((raw) =>
      raw
        .split(/[\n,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
    )
    .pipe(
      z
        .array(z.string().email("Each entry must be a valid email"))
        .min(1)
        .max(100)
    ),
})
```

- [ ] **Step 2: Point the school-level admin-invite route at the new schema**

In `apps/web/src/app/api/school/invites/admin/route.ts`, change the import and both uses:

```typescript
import { inviteSchoolAdminRequestSchema } from "@learnify/shared"
```

and

```typescript
const parsed = inviteSchoolAdminRequestSchema.safeParse(body)
```

- [ ] **Step 3: Verify those 4 errors are gone**

Run: `pnpm typecheck 2>&1 | grep -c "error TS"`
Expected: `19` (the 18 `membership` narrowing errors + 1 `token` error remain).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/classrooms.ts apps/web/src/app/api/school/invites/admin/route.ts
git commit -m "fix(shared): add schoolId to school-scoped request schemas"
```

---

### Task 5: Give auth helpers explicit discriminated return types

**Files:**
- Modify: `apps/web/src/lib/auth/classrooms.ts`

Root cause of 18 errors: TypeScript infers `response?: undefined` onto the success member of each helper's return union, so `"response" in auth` cannot narrow. Explicit return types whose success members do not declare `response` restore narrowing in every caller — no route edits needed.

- [ ] **Step 1: Add the shared result types**

At the top of `apps/web/src/lib/auth/classrooms.ts`, extend the imports and add types:

```typescript
import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createSupabaseServiceClientFromEnv, getMembershipByUserAndSchool } from "@learnify/database"
import type { SchoolMembershipRecord, SchoolMembershipRole } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type ApiAuthFailure = { response: NextResponse }

type ApiAuthContext = {
  user: User
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  serviceSupabase: ReturnType<typeof createSupabaseServiceClientFromEnv>
}
```

- [ ] **Step 2: Annotate all four helpers**

```typescript
export async function requireApiAuth(): Promise<ApiAuthFailure | ApiAuthContext>

export async function requireApiLearnifyAdmin(): Promise<
  ApiAuthFailure | ApiAuthContext
>

export async function requireApiSchoolAccess(
  schoolId: string,
  role: SchoolMembershipRole | SchoolMembershipRole[]
): Promise<
  ApiAuthFailure | (ApiAuthContext & { membership: SchoolMembershipRecord })
>

export async function requireApiSchoolAdminOrLearnifyAdmin(
  schoolId: string
): Promise<
  | ApiAuthFailure
  | (ApiAuthContext & {
      membership: SchoolMembershipRecord | null
      isLearnifyAdmin: boolean
    })
>
```

Function bodies stay as they are — only signatures change. If `tsc` complains inside a body about returning the un-narrowed `auth` union (e.g. `if ("response" in auth) return auth`), the explicit parameter-less success types make that narrowing valid; no body edits are expected.

- [ ] **Step 3: Verify the narrowing errors are gone**

Run: `pnpm typecheck 2>&1 | grep -c "error TS"`
Expected: `1` (only the join/token `token` error remains).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/auth/classrooms.ts
git commit -m "fix(web): explicit discriminated return types for classroom auth helpers"
```

---

### Task 6: Fix the `joinToken` field read and reach zero type errors

**Files:**
- Modify: `apps/web/src/app/api/classrooms/join/token/route.ts:29`

- [ ] **Step 1: Fix the field name**

`joinByTokenRequestSchema` defines `joinToken`; the route reads `parsed.data.token`. Change line 29:

```typescript
const tokenHash = hashToken(parsed.data.joinToken)
```

- [ ] **Step 2: Verify zero errors — the compile gate**

Run: `pnpm typecheck`
Expected: exits 0, no output after the tsc invocation lines.

Also run: `pnpm --filter web lint`
Expected: no new errors (warnings acceptable if pre-existing).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/classrooms/join/token/route.ts
git commit -m "fix(web): read joinToken field in join-by-token route"
```

---

### Task 7: Migration — one live role per user/email, search_path hardening

**Files:**
- Modify: `supabase/migrations/202606110001_milestone3_classrooms_slice1.sql`

The migration is uncommitted and has never been applied to any environment, so it is edited in place — no follow-up migration. Contract §2: one role per user per school; same email cannot hold two roles in one school. Plain unique constraints would also block re-inviting a `removed` member, so live-status partial unique indexes are used instead.

- [ ] **Step 1: Replace the unique constraints**

In the `school_memberships` table definition, delete these lines (and the comma after `updated_at`'s line stays valid):

```sql
  -- one role per user per school
  unique (school_id, user_id, role),
  -- one active identity per email per school (prevents duplicate active memberships)
  unique (school_id, email_normalized, role)
```

so the table definition ends:

```sql
  activated_at      timestamptz,
  deactivated_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

Then, immediately after the existing `school_memberships_*` index block, add:

```sql
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
```

- [ ] **Step 2: Pin search_path on the SQL functions**

The two `security definer` helpers and the trigger function must not resolve objects through the caller's search_path. Change each function header:

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
```

```sql
create or replace function public.is_learnify_admin()
returns boolean language sql security definer set search_path = public as $$
```

```sql
create or replace function public.get_school_membership_id(p_school_id uuid, p_role text default null)
returns uuid language sql security definer set search_path = public as $$
```

- [ ] **Step 3: Validate the migration applies cleanly**

Run: `supabase db reset`
Expected: all 9 migrations apply, exit 0.

If Docker / local Supabase is not running, run `supabase start` first. If the local stack is unavailable in this environment, mark this step skipped and say so in the commit body — do NOT silently skip.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/202606110001_milestone3_classrooms_slice1.sql
git commit -m "fix(db): enforce one live role per user/email per school; pin search_path"
```

---

### Task 8: Chunk gate — full verification and baseline commit of remaining Slice 1 files

**Files:**
- Commit (no further edits): `packages/database/src/classrooms.ts`, `packages/database/src/index.ts`, `apps/web/src/lib/auth/classrooms.ts` (if not already committed), all 18 route files under `apps/web/src/app/api/{admin,school,classrooms}/`

The remaining uncommitted backend files now compile. Committing them closes Chunk 1 with the whole tree under version control, so Chunk 2's behavioral fixes (join/approve flow) land as reviewable diffs against this baseline. The known behavioral bugs in these files are documented in the spec and are Chunk 2's scope — committing them is not an endorsement that they are correct, and the commit message must say so.

- [ ] **Step 1: Full gate**

Run, in order:

```bash
pnpm typecheck
pnpm --filter @learnify/core test
pnpm --filter @learnify/database test
```

Expected: typecheck exits 0; core tests all pass; database tests pass (these are the pre-existing RAG/lesson tests — classroom repo tests arrive in Chunk 2).

- [ ] **Step 2: Verify nothing unexpected is in the tree**

Run: `git status --short`
Expected: only the known Slice 1 backend files (database package, route handlers, auth lib if uncommitted). Investigate anything else before adding.

- [ ] **Step 3: Commit the baseline**

```bash
git add packages/database/src apps/web/src/app/api/admin apps/web/src/app/api/school apps/web/src/app/api/classrooms apps/web/src/lib/auth/classrooms.ts
git commit -m "feat(classrooms): commit Slice 1 backend baseline (compiles; behavior fixes tracked for chunk 2)

Known issues documented in docs/superpowers/specs/2026-06-11-milestone3-slice1-remediation-design.md:
join/approve flow does not create memberships for new students, teacher
invites 422 at capacity, student email invites lack join requests. Fixed
with route tests in chunk 2."
```

- [ ] **Step 4: Confirm clean tree**

Run: `git status --short`
Expected: empty output.

---

## Self-review notes

- Spec coverage: Chunk 1 spec items — 23 type errors (Tasks 4–6), §13 core unit tests (Tasks 1–3), migration constraint + search_path fixes (Task 7), gates (Task 8). `supabase db reset` gate is in Task 7 Step 3 with an explicit skip-and-report rule.
- The expected error counts in Task 4 Step 3 (19) and Task 5 Step 3 (1) assume tasks run in order; if reordered, recompute by file rather than count.
- Type names (`ApiAuthFailure`, `ApiAuthContext`, `InviteSchoolAdminRequest`, `inviteSchoolAdminRequestSchema`) are each defined exactly once and referenced consistently.
