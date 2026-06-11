import { describe, expect, it } from "vitest"
import { approveJoinRequest, type SupabaseClient } from "../index"

type QueryResult = {
  data?: unknown
  count?: number | null
  error?: { message: string } | null
}

type QueryCall = {
  table: string
  method: string
  payload?: unknown
}

class MockQuery {
  constructor(
    private readonly table: string,
    private readonly result: QueryResult,
    private readonly calls: QueryCall[]
  ) {}

  select() {
    this.calls.push({ table: this.table, method: "select" })
    return this
  }

  eq() {
    this.calls.push({ table: this.table, method: "eq" })
    return this
  }

  in() {
    this.calls.push({ table: this.table, method: "in" })
    return this
  }

  insert(payload: unknown) {
    this.calls.push({ table: this.table, method: "insert", payload })
    return this
  }

  update(payload: unknown) {
    this.calls.push({ table: this.table, method: "update", payload })
    return this
  }

  upsert(payload: unknown) {
    this.calls.push({ table: this.table, method: "upsert", payload })
    return this
  }

  order() {
    this.calls.push({ table: this.table, method: "order" })
    return this
  }

  maybeSingle<T>() {
    return Promise.resolve({
      data: (this.result.data ?? null) as T | null,
      error: this.result.error ?? null,
    })
  }

  single<T>() {
    return Promise.resolve({
      data: this.result.data as T,
      error: this.result.error ?? null,
    })
  }

  returns<T>() {
    return Promise.resolve({
      data: (this.result.data ?? []) as T,
      error: this.result.error ?? null,
    })
  }

  then<TResult1 = { data: unknown; error: unknown; count: number | null }>(
    onfulfilled?:
      | ((
          value: {
            data: unknown
            error: { message: string } | null
            count: number | null
          }
        ) => TResult1 | PromiseLike<TResult1>)
      | null
  ) {
    return Promise.resolve({
      data: this.result.data ?? null,
      error: this.result.error ?? null,
      count: this.result.count ?? null,
    }).then(onfulfilled)
  }
}

function createMockSupabase(tables: Record<string, QueryResult[]>) {
  const calls: QueryCall[] = []
  const queues = new Map(Object.entries(tables))
  const supabase = {
    from(table: string) {
      calls.push({ table, method: "from" })
      const queue = queues.get(table) ?? []
      const result = queue.shift() ?? { data: null, count: 0 }
      queues.set(table, queue)

      return new MockQuery(table, result, calls)
    },
  } as unknown as SupabaseClient

  return { calls, supabase }
}

const school = {
  id: "school-1",
  admin_seat_limit: 3,
  teacher_seat_limit: 5,
  student_seat_limit: 2,
  student_overage_allowed_by_learnify: false,
  student_overage_enabled_by_school: false,
}

const joinRequest = {
  id: "request-1",
  school_id: "school-1",
  classroom_id: "classroom-1",
  student_user_id: "student-user-1",
  student_membership_id: "student-membership-1",
  source: "code",
  status: "pending_teacher_approval",
}

const invitedMembership = {
  id: "student-membership-1",
  school_id: "school-1",
  user_id: "student-user-1",
  role: "student",
  status: "invited",
  email_normalized: "student@example.com",
  seat_consumed: false,
  overage: false,
}

const activeMembership = {
  ...invitedMembership,
  status: "active",
  seat_consumed: true,
}

function schoolSummaryResults(activeStudents: number): QueryResult[] {
  return [
    { data: school },
    { count: 1 },
    { count: 1 },
    { count: activeStudents },
    { count: 0 },
  ]
}

describe("approveJoinRequest", () => {
  it("activates a first-time student and creates a classroom membership", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_join_requests: [
        { data: joinRequest },
        { data: { ...joinRequest, status: "approved" } },
      ],
      school_memberships: [
        { data: invitedMembership },
        ...schoolSummaryResults(1).slice(1),
        ...schoolSummaryResults(1).slice(1),
        { data: invitedMembership },
        { data: activeMembership },
      ],
      schools: [{ data: school }, { data: school }],
      classroom_memberships: [
        {
          data: {
            id: "classroom-membership-1",
            classroom_id: "classroom-1",
            student_user_id: "student-user-1",
            status: "active",
          },
        },
      ],
    })

    await expect(
      approveJoinRequest({
        supabase,
        requestId: "request-1",
        approvedBy: "teacher-user-1",
        schoolId: "school-1",
        now: new Date("2026-06-11T00:00:00.000Z"),
      })
    ).resolves.toMatchObject({
      request: { status: "approved" },
      activated: true,
    })

    expect(
      calls.some(
        (call) =>
          call.table === "school_memberships" &&
          call.method === "update" &&
          (call.payload as { status?: string }).status === "active"
      )
    ).toBe(true)
    expect(
      calls.some(
        (call) =>
          call.table === "classroom_memberships" && call.method === "upsert"
      )
    ).toBe(true)
  })

  it("approves an already-active school student without consuming another seat", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_join_requests: [
        { data: joinRequest },
        { data: { ...joinRequest, status: "approved" } },
      ],
      school_memberships: [
        { data: activeMembership },
        ...schoolSummaryResults(2).slice(1),
      ],
      schools: [{ data: school }],
      classroom_memberships: [
        {
          data: {
            id: "classroom-membership-1",
            classroom_id: "classroom-1",
            student_user_id: "student-user-1",
            status: "active",
          },
        },
      ],
    })

    await expect(
      approveJoinRequest({
        supabase,
        requestId: "request-1",
        approvedBy: "teacher-user-1",
        schoolId: "school-1",
      })
    ).resolves.toMatchObject({
      request: { status: "approved" },
      activated: true,
    })

    expect(
      calls.some(
        (call) =>
          call.table === "school_memberships" &&
          call.method === "update" &&
          (call.payload as { status?: string }).status === "active"
      )
    ).toBe(false)
    expect(
      calls.some(
        (call) =>
          call.table === "classroom_memberships" && call.method === "upsert"
      )
    ).toBe(true)
  })

  it("leaves a first-time student pending when school capacity is full", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_join_requests: [
        { data: joinRequest },
        { data: { ...joinRequest, status: "pending_capacity" } },
      ],
      school_memberships: [
        { data: invitedMembership },
        ...schoolSummaryResults(2).slice(1),
      ],
      schools: [{ data: school }],
    })

    await expect(
      approveJoinRequest({
        supabase,
        requestId: "request-1",
        approvedBy: "teacher-user-1",
        schoolId: "school-1",
      })
    ).resolves.toMatchObject({
      request: { status: "pending_capacity" },
      activated: false,
    })

    expect(
      calls.some(
        (call) =>
          call.table === "classroom_memberships" && call.method === "upsert"
      )
    ).toBe(false)
  })
})
