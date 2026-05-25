import { describe, expect, it } from "vitest"
import {
  retrieveVerifiedRagChunks,
  type SupabaseClient,
} from "../index"

type QueryResult = {
  data?: unknown[]
  error?: { message: string } | null
}

class MockQuery {
  constructor(private readonly result: QueryResult = {}) {}

  select() {
    return this
  }

  eq() {
    return this
  }

  contains() {
    return this
  }

  ilike() {
    return this
  }

  in() {
    return this
  }

  order() {
    return this
  }

  limit() {
    return this
  }

  returns<T>() {
    return Promise.resolve({
      data: (this.result.data ?? []) as T,
      error: this.result.error ?? null,
    })
  }
}

function createMockSupabase(input: {
  rpc?: QueryResult
  tables?: Record<string, QueryResult[]>
}) {
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = []
  const fromCalls: string[] = []
  const tableQueues = new Map(Object.entries(input.tables ?? {}))

  const supabase = {
    rpc(name: string, args: Record<string, unknown>) {
      rpcCalls.push({ name, args })

      return new MockQuery(input.rpc)
    },
    from(table: string) {
      fromCalls.push(table)

      const queue = tableQueues.get(table) ?? []
      const result = queue.shift() ?? { data: [] }
      tableQueues.set(table, queue)

      return new MockQuery(result)
    },
  } as unknown as SupabaseClient

  return { supabase, rpcCalls, fromCalls }
}

const keywordChunk = {
  id: "chunk-keyword",
  document_id: "doc-keyword",
  chunk_index: 2,
  content: "Gravity increases falling acceleration near Earth.",
  metadata: {
    course_slug: "physics-foundations",
    lesson_slug: "gravity-and-falling-objects",
  },
  verified: true,
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z",
  rag_documents: {
    id: "doc-keyword",
    title: "Gravity and Falling Objects",
    subject: "Physics",
    grade_level: "Grade 10",
    language: "en",
    source_type: "lesson_seed",
    source_url: null,
    status: "processed",
    verified: true,
    metadata: {},
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
  },
}

const vectorChunk = {
  id: "chunk-vector",
  document_id: "doc-vector",
  document_title: "Projectile Motion",
  content: "Projectile motion combines horizontal velocity and gravity.",
  locale: "en",
  subject: "Physics",
  source_type: "lesson_seed",
  source_url: null,
  chunk_index: 1,
  metadata: {
    course_slug: "physics-foundations",
    lesson_slug: "projectile-motion",
  },
  score: 0.82,
  created_at: "2026-05-02T00:00:00.000Z",
}

describe("retrieveVerifiedRagChunks", () => {
  it("calls vector RPC when an embedding is provided", async () => {
    const { supabase, rpcCalls, fromCalls } = createMockSupabase({
      rpc: { data: [vectorChunk] },
    })

    await retrieveVerifiedRagChunks({
      supabase,
      locale: "en",
      subject: "Physics",
      courseSlug: "physics-foundations",
      lessonSlug: "projectile-motion",
      limit: 4,
      embedding: [0.1, 0.2, 0.3],
    })

    expect(rpcCalls).toEqual([
      {
        name: "match_verified_rag_chunks",
        args: {
          query_embedding: [0.1, 0.2, 0.3],
          match_locale: "en",
          match_subject: "Physics",
          match_course_slug: "physics-foundations",
          match_lesson_slug: "projectile-motion",
          match_count: 4,
        },
      },
    ])
    expect(fromCalls).toEqual([])
  })

  it("maps vector results into RetrievedRagChunk", async () => {
    const { supabase } = createMockSupabase({
      rpc: { data: [vectorChunk] },
    })

    const chunks = await retrieveVerifiedRagChunks({
      supabase,
      locale: "en",
      limit: 3,
      embedding: [0.1],
    })

    expect(chunks).toEqual([
      {
        id: "chunk-vector",
        documentId: "doc-vector",
        documentTitle: "Projectile Motion",
        content: "Projectile motion combines horizontal velocity and gravity.",
        locale: "en",
        subject: "Physics",
        sourceType: "lesson_seed",
        sourceUrl: null,
        chunkIndex: 1,
        metadata: {
          course_slug: "physics-foundations",
          lesson_slug: "projectile-motion",
        },
        score: 0.82,
        createdAt: "2026-05-02T00:00:00.000Z",
      },
    ])
  })

  it("falls back to keyword retrieval when vector RPC errors", async () => {
    const { supabase } = createMockSupabase({
      rpc: { error: { message: "vector index unavailable" } },
      tables: {
        rag_chunks: [{ data: [keywordChunk] }],
      },
    })

    const chunks = await retrieveVerifiedRagChunks({
      supabase,
      locale: "en",
      query: "gravity",
      limit: 2,
      embedding: [0.1],
    })

    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.id).toBe("chunk-keyword")
    expect(chunks[0]?.score).toBeGreaterThan(0)
  })

  it("falls back to keyword retrieval when vector RPC returns no rows", async () => {
    const { supabase } = createMockSupabase({
      rpc: { data: [] },
      tables: {
        rag_chunks: [{ data: [keywordChunk] }],
      },
    })

    const chunks = await retrieveVerifiedRagChunks({
      supabase,
      locale: "en",
      query: "gravity",
      limit: 2,
      embedding: [0.1],
    })

    expect(chunks).toHaveLength(1)
    expect(chunks[0]?.documentTitle).toBe("Gravity and Falling Objects")
  })

  it("keeps keyword-only behavior when no embedding is provided", async () => {
    const { supabase, rpcCalls, fromCalls } = createMockSupabase({
      tables: {
        rag_chunks: [{ data: [keywordChunk] }],
      },
    })

    const chunks = await retrieveVerifiedRagChunks({
      supabase,
      locale: "en",
      query: "gravity",
      limit: 2,
    })

    expect(rpcCalls).toEqual([])
    expect(fromCalls).toContain("rag_chunks")
    expect(chunks[0]?.id).toBe("chunk-keyword")
  })
})
