import { describe, expect, it } from "vitest"
import {
  completeLessonBlock,
  getQuestionForLesson,
  type SupabaseClient,
} from "../index"

type QueryResult = {
  data?: unknown
  count?: number | null
  error?: { message: string } | null
}

class MockQuery {
  constructor(
    private readonly result: QueryResult,
    private readonly calls: string[]
  ) {}

  select() {
    this.calls.push("select")
    return this
  }

  eq() {
    this.calls.push("eq")
    return this
  }

  upsert() {
    this.calls.push("upsert")
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
  const calls: string[] = []
  const queues = new Map(Object.entries(tables))
  const supabase = {
    from(table: string) {
      calls.push(`from:${table}`)
      const queue = queues.get(table) ?? []
      const result = queue.shift() ?? { data: [] }
      queues.set(table, queue)

      return new MockQuery(result, calls)
    },
  } as unknown as SupabaseClient

  return {
    calls,
    supabase,
  }
}

const question = {
  id: "question-1",
  slug: "q-gravity-001",
  lesson_id: "lesson-1",
  skill_id: "skill-1",
  correct_answer: { option_id: "b" },
}

describe("lesson integrity repository helpers", () => {
  it("finds a question by exact slug", async () => {
    const { supabase } = createMockSupabase({
      questions: [{ data: [question] }],
    })

    await expect(
      getQuestionForLesson({
        supabase,
        lessonId: "lesson-1",
        questionSlugOrId: "q-gravity-001",
      })
    ).resolves.toMatchObject({
      id: "question-1",
    })
  })

  it("finds a question by exact id", async () => {
    const { supabase } = createMockSupabase({
      questions: [{ data: [question] }],
    })

    await expect(
      getQuestionForLesson({
        supabase,
        lessonId: "lesson-1",
        questionSlugOrId: "question-1",
      })
    ).resolves.toMatchObject({
      slug: "q-gravity-001",
    })
  })

  it("does not fall back to the only lesson question", async () => {
    const { supabase } = createMockSupabase({
      questions: [{ data: [question] }],
    })

    await expect(
      getQuestionForLesson({
        supabase,
        lessonId: "lesson-1",
        questionSlugOrId: "stale-question-id",
      })
    ).resolves.toBeNull()
  })

  it("rejects direct completion for multiple choice blocks", async () => {
    const { calls, supabase } = createMockSupabase({
      lessons: [
        {
          data: {
            id: "lesson-1",
            slug: "gravity-and-falling-objects",
            status: "published",
          },
        },
      ],
      lesson_blocks: [
        {
          data: {
            id: "block-1",
            slug: "gravity-question",
            lesson_id: "lesson-1",
            type: "multiple_choice",
            content_json: {},
          },
        },
      ],
    })

    await expect(
      completeLessonBlock({
        supabase,
        userId: "user-1",
        lessonSlug: "gravity-and-falling-objects",
        blockSlug: "gravity-question",
      })
    ).rejects.toThrow(
      "Question blocks must be completed through question attempts."
    )
    expect(calls).not.toContain("upsert")
  })

  it("still completes non-question blocks and updates lesson progress", async () => {
    const { supabase } = createMockSupabase({
      lessons: [
        {
          data: {
            id: "lesson-1",
            slug: "gravity-and-falling-objects",
            status: "published",
          },
        },
      ],
      lesson_blocks: [
        {
          data: {
            id: "block-1",
            slug: "gravity-intro",
            lesson_id: "lesson-1",
            type: "text",
            content_json: {},
          },
        },
        { count: 2 },
      ],
      lesson_block_progress: [
        {
          data: {
            id: "progress-1",
            user_id: "user-1",
            lesson_id: "lesson-1",
            block_id: "block-1",
            status: "completed",
            completed_at: "2026-05-01T00:00:00.000Z",
            updated_at: "2026-05-01T00:00:00.000Z",
          },
        },
        { count: 1 },
      ],
      lesson_progress: [
        {
          data: {
            id: "lesson-progress-1",
            user_id: "user-1",
            lesson_id: "lesson-1",
            status: "in_progress",
            progress_percent: 50,
            completed_at: null,
            updated_at: "2026-05-01T00:00:00.000Z",
          },
        },
      ],
    })

    await expect(
      completeLessonBlock({
        supabase,
        userId: "user-1",
        lessonSlug: "gravity-and-falling-objects",
        blockSlug: "gravity-intro",
      })
    ).resolves.toMatchObject({
      blockProgress: {
        block_id: "block-1",
        status: "completed",
      },
      lessonProgress: {
        progress_percent: 50,
      },
    })
  })
})
