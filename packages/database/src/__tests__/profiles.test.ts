import { describe, expect, it } from "vitest"
import { upsertStudentProfile, type SupabaseClient } from "../index"

type QueryResult = {
  data?: unknown
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

  update(payload: unknown) {
    this.calls.push({ table: this.table, method: "update", payload })
    return this
  }

  insert(payload: unknown) {
    this.calls.push({ table: this.table, method: "insert", payload })
    return this
  }
}

function createMockSupabase(results: QueryResult[]) {
  const calls: QueryCall[] = []
  const queue = [...results]
  const supabase = {
    from(table: string) {
      calls.push({ table, method: "from" })
      return new MockQuery(table, queue.shift() ?? {}, calls)
    },
  } as unknown as SupabaseClient

  return { calls, supabase }
}

describe("upsertStudentProfile", () => {
  it("preserves an existing admin role while updating language preference", async () => {
    const { calls, supabase } = createMockSupabase([
      {
        data: {
          id: "user-1",
          role: "admin",
          language_preference: "en",
        },
      },
      {
        data: {
          id: "user-1",
          role: "admin",
          language_preference: "th",
        },
      },
    ])

    await expect(
      upsertStudentProfile({ supabase, userId: "user-1", locale: "th" })
    ).resolves.toEqual({
      id: "user-1",
      role: "admin",
      language_preference: "th",
    })

    expect(
      calls.some(
        (call) =>
          call.method === "update" &&
          (call.payload as { role?: string }).role === "student"
      )
    ).toBe(false)
    expect(calls.some((call) => call.method === "insert")).toBe(false)
  })

  it("creates a student profile only when no profile exists", async () => {
    const { calls, supabase } = createMockSupabase([
      { data: null },
      {
        data: {
          id: "user-1",
          role: "student",
          language_preference: "en",
        },
      },
    ])

    await expect(
      upsertStudentProfile({ supabase, userId: "user-1", locale: "en" })
    ).resolves.toMatchObject({ role: "student" })

    expect(
      calls.some(
        (call) =>
          call.method === "insert" &&
          (call.payload as { role?: string }).role === "student"
      )
    ).toBe(true)
  })
})
