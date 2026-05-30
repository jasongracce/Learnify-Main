import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  createLiveLumiAiProvider: vi.fn(),
  createMockLumiAiProvider: vi.fn(),
  createOpenAiEmbeddingProviderFromEnv: vi.fn(),
  createSupabaseServiceClientFromEnv: vi.fn(),
  generateLumiAiRouteResponse: vi.fn(),
  generateRuleBasedLumiChatResponse: vi.fn(),
  getLessonProgressForUser: vi.fn(),
  getOrCreateLumiConversation: vi.fn(),
  getRecentQuestionAttemptsForUser: vi.fn(),
  getRequestIpAddress: vi.fn(),
  getStudentSkillMasteryForUser: vi.fn(),
  insertLumiMessage: vi.fn(),
  requireApiBetaUser: vi.fn(),
  retrieveVerifiedRagChunks: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  createSupabaseServiceClientFromEnv: mocks.createSupabaseServiceClientFromEnv,
  getLessonProgressForUser: mocks.getLessonProgressForUser,
  getOrCreateLumiConversation: mocks.getOrCreateLumiConversation,
  getRecentQuestionAttemptsForUser: mocks.getRecentQuestionAttemptsForUser,
  getStudentSkillMasteryForUser: mocks.getStudentSkillMasteryForUser,
  insertLumiMessage: mocks.insertLumiMessage,
  retrieveVerifiedRagChunks: mocks.retrieveVerifiedRagChunks,
}))

vi.mock("@learnify/ai", () => ({
  createOpenAiEmbeddingProviderFromEnv:
    mocks.createOpenAiEmbeddingProviderFromEnv,
  EmbeddingProviderError: class EmbeddingProviderError extends Error {
    readonly reason: string

    constructor(reason: string, message: string = reason) {
      super(message)
      this.name = "EmbeddingProviderError"
      this.reason = reason
    }
  },
}))

vi.mock("@learnify/core", () => ({
  generateRuleBasedLumiChatResponse: mocks.generateRuleBasedLumiChatResponse,
}))

vi.mock("@/lib/auth/api", () => ({
  requireApiBetaUser: mocks.requireApiBetaUser,
}))

vi.mock("@/lib/in-memory-rate-limit", () => ({
  getRequestIpAddress: mocks.getRequestIpAddress,
}))

vi.mock("@/lib/lumi-ai-route-adapter", () => ({
  createLiveLumiAiProvider: mocks.createLiveLumiAiProvider,
  createMockLumiAiProvider: mocks.createMockLumiAiProvider,
  generateLumiAiRouteResponse: mocks.generateLumiAiRouteResponse,
}))

const { POST } = await import("./route")

const conversationId = "00000000-0000-4000-8000-000000000001"
const userId = "00000000-0000-4000-8000-000000000002"
const supabase = { from: vi.fn() }
const limiterSupabase = { rpc: vi.fn() }

function createLumiRequest(body: Record<string, unknown> = {}) {
  return new Request("http://learnify.test/api/lumi/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify({
      message: "Why does gravity make objects accelerate?",
      locale: "en",
      currentLessonSlug: "gravity-and-falling-objects",
      ...body,
    }),
  })
}

function assistantInsertMetadata() {
  const assistantInsert = mocks.insertLumiMessage.mock.calls.find(
    ([input]) => input.role === "assistant"
  )

  expect(assistantInsert).toBeDefined()

  return assistantInsert?.[0].retrievedContextIds
}

async function postLumiChat(body: Record<string, unknown> = {}) {
  return (await POST(createLumiRequest(body))) as Response
}

function setDefaultMocks() {
  vi.stubEnv("LEARNIFY_LUMI_MODE", "rule")
  vi.stubEnv("OPENAI_API_KEY", "")
  vi.stubEnv("OPENAI_MODEL", "gpt-5.4")
  vi.stubEnv("OPENAI_MAX_OUTPUT_TOKENS", "900")
  vi.stubEnv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
  vi.stubEnv("OPENAI_EMBEDDING_DIMENSIONS", "1536")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
  mocks.createSupabaseServiceClientFromEnv.mockReturnValue(limiterSupabase)
  mocks.consumeRateLimit.mockResolvedValue({
    allowed: true,
    limit: 60,
    remaining: 59,
    resetAtMs: Date.now() + 60_000,
    retryAfterSeconds: 0,
  })
  mocks.getRequestIpAddress.mockReturnValue("203.0.113.10")
  mocks.requireApiBetaUser.mockResolvedValue({
    supabase,
    user: {
      id: userId,
      email: "student@example.com",
    },
  })
  mocks.getOrCreateLumiConversation.mockResolvedValue({
    id: conversationId,
    user_id: userId,
    lesson_id: null,
    course_id: null,
    language: "en",
    title: "Why does gravity make objects accelerate?",
    created_at: "2026-05-20T00:00:00.000Z",
  })
  mocks.insertLumiMessage.mockResolvedValue({
    id: "00000000-0000-4000-8000-000000000003",
  })
  mocks.getLessonProgressForUser.mockResolvedValue([])
  mocks.getStudentSkillMasteryForUser.mockResolvedValue([])
  mocks.getRecentQuestionAttemptsForUser.mockResolvedValue([])
  mocks.retrieveVerifiedRagChunks.mockResolvedValue([
    {
      id: "rag-1",
      documentId: "doc-1",
      documentTitle: "Verified Physics RAG: Gravity and Falling Objects",
      content: "Gravity creates downward acceleration.",
      locale: "en",
      subject: "Physics",
      sourceType: "learnify_verified_seed",
      sourceUrl: null,
      chunkIndex: 1,
      metadata: {
        course_slug: "physics-foundations",
        lesson_slug: "gravity-and-falling-objects",
      },
      score: 3,
      createdAt: "2026-05-20T00:00:00.000Z",
    },
  ])
  mocks.generateRuleBasedLumiChatResponse.mockReturnValue({
    answer: "Rule-based Lumi answer.",
    conversationId,
    suggestedPrompts: ["What is acceleration?"],
    relatedLessonSlug: "gravity-and-falling-objects",
    confidence: "medium",
  })
  mocks.createMockLumiAiProvider.mockReturnValue({ provider: "mock" })
  mocks.createLiveLumiAiProvider.mockReturnValue({ provider: "live" })
  mocks.createOpenAiEmbeddingProviderFromEnv.mockReturnValue({
    embed: vi.fn().mockResolvedValue({
      embeddings: [Array.from({ length: 1536 }, (_, index) => index / 1536)],
      model: "text-embedding-3-small",
      dimensions: 1536,
    }),
  })
  mocks.generateLumiAiRouteResponse.mockResolvedValue({
    ok: true,
    response: {
      answer: "AI Lumi answer.",
      conversationId,
      suggestedPrompts: ["What should I review?"],
      relatedLessonSlug: "gravity-and-falling-objects",
      suggestedNextAction: "Review the gravity slider.",
      confidence: "high",
      sources: [
        {
          id: "rag:rag-1",
          title: "Verified Physics RAG: Gravity and Falling Objects",
          kind: "verified_rag_chunk",
          lessonSlug: "gravity-and-falling-objects",
          courseSlug: "physics-foundations",
        },
      ],
    },
    metadata: {
      mode: "rag_ai",
      sourceIds: ["rag:rag-1"],
    },
  })
}

describe("POST /api/lumi/chat", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    setDefaultMocks()
  })

  it("uses rule mode without calling the AI route adapter", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rule")

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toBe("Rule-based Lumi answer.")
    expect(mocks.generateLumiAiRouteResponse).not.toHaveBeenCalled()
    expect(mocks.createOpenAiEmbeddingProviderFromEnv).not.toHaveBeenCalled()
    expect(mocks.retrieveVerifiedRagChunks).toHaveBeenCalledWith(
      expect.not.objectContaining({
        embedding: expect.anything(),
      })
    )
    expect(assistantInsertMetadata()).toMatchObject({
      mode: "rule",
      ragRetrieval: {
        ok: true,
        chunkCount: 1,
      },
      queryEmbedding: {
        attempted: false,
        ok: false,
      },
    })
  })

  it("uses mock AI mode and saves source metadata", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "mock")

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toBe("AI Lumi answer.")
    expect(payload.sources).toHaveLength(1)
    expect(mocks.createMockLumiAiProvider).toHaveBeenCalledOnce()
    expect(mocks.createLiveLumiAiProvider).not.toHaveBeenCalled()
    expect(mocks.createOpenAiEmbeddingProviderFromEnv).not.toHaveBeenCalled()
    expect(mocks.retrieveVerifiedRagChunks).toHaveBeenCalledWith(
      expect.not.objectContaining({
        embedding: expect.anything(),
      })
    )
    expect(assistantInsertMetadata()).toMatchObject({
      mode: "rag_ai",
      sourceIds: ["rag:rag-1"],
      ragRetrieval: {
        ok: true,
        chunkCount: 1,
      },
      queryEmbedding: {
        attempted: false,
        ok: false,
      },
    })
  })

  it("uses rag_ai mode query embeddings for verified RAG retrieval", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")
    vi.stubEnv("OPENAI_API_KEY", "openai-key")
    const embedding = Array.from({ length: 1536 }, (_, index) => index / 1536)
    const embed = vi.fn().mockResolvedValue({
      embeddings: [embedding],
      model: "text-embedding-3-small",
      dimensions: 1536,
    })
    mocks.createOpenAiEmbeddingProviderFromEnv.mockReturnValue({ embed })

    const response = await postLumiChat()

    expect(response.status).toBe(200)
    expect(mocks.createOpenAiEmbeddingProviderFromEnv).toHaveBeenCalledWith(
      expect.objectContaining({
        OPENAI_API_KEY: "openai-key",
        OPENAI_MODEL: "gpt-5.4",
        OPENAI_MAX_OUTPUT_TOKENS: "900",
        OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
        OPENAI_EMBEDDING_DIMENSIONS: "1536",
      })
    )
    expect(embed).toHaveBeenCalledWith({
      input: "Why does gravity make objects accelerate?",
      user: userId,
      dimensions: 1536,
    })
    expect(mocks.retrieveVerifiedRagChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        embedding,
      })
    )
    expect(assistantInsertMetadata()).toMatchObject({
      queryEmbedding: {
        attempted: true,
        ok: true,
        model: "text-embedding-3-small",
        dimensions: 1536,
      },
    })
  })

  it("uses the AI fallback when the live provider is unavailable", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")
    vi.stubEnv("OPENAI_API_KEY", "openai-key")
    mocks.generateLumiAiRouteResponse.mockResolvedValue({
      ok: false,
      reason: "provider_unavailable",
      fallback: {
        answer: "AI fallback answer.",
        conversationId,
        suggestedPrompts: [],
        confidence: "low",
      },
      metadata: {
        mode: "rag_ai",
        fallbackReason: "provider_unavailable",
        sourceIds: ["rag:rag-1"],
      },
    })

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toBe("AI fallback answer.")
    expect(mocks.createLiveLumiAiProvider).toHaveBeenCalledOnce()
    expect(mocks.createOpenAiEmbeddingProviderFromEnv).toHaveBeenCalledOnce()
    expect(assistantInsertMetadata()).toMatchObject({
      mode: "rag_ai",
      fallbackReason: "provider_unavailable",
      ruleBasedFallback: true,
    })
  })

  it("falls back to keyword retrieval when the embedding provider is unavailable", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")
    vi.stubEnv("OPENAI_API_KEY", "openai-key")
    mocks.createOpenAiEmbeddingProviderFromEnv.mockReturnValue({
      embed: vi.fn().mockRejectedValue(new Error("provider_unavailable")),
    })

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toBe("AI Lumi answer.")
    expect(mocks.retrieveVerifiedRagChunks).toHaveBeenCalledWith(
      expect.not.objectContaining({
        embedding: expect.anything(),
      })
    )
    expect(assistantInsertMetadata()).toMatchObject({
      queryEmbedding: {
        attempted: true,
        ok: false,
        failureReason: "provider_unavailable",
      },
      ragRetrieval: {
        ok: true,
        chunkCount: 1,
      },
    })
  })

  it("falls back to keyword retrieval when the query embedding has the wrong dimensions", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")
    vi.stubEnv("OPENAI_API_KEY", "openai-key")
    mocks.createOpenAiEmbeddingProviderFromEnv.mockReturnValue({
      embed: vi.fn().mockResolvedValue({
        embeddings: [[0.1, 0.2, 0.3]],
        model: "text-embedding-3-small",
        dimensions: 3,
      }),
    })

    const response = await postLumiChat()

    expect(response.status).toBe(200)
    expect(mocks.retrieveVerifiedRagChunks).toHaveBeenCalledWith(
      expect.not.objectContaining({
        embedding: expect.anything(),
      })
    )
    expect(assistantInsertMetadata()).toMatchObject({
      queryEmbedding: {
        attempted: true,
        ok: false,
        model: "text-embedding-3-small",
        dimensions: 3,
        failureReason: "Expected 1536 embedding dimensions, got 3.",
      },
    })
  })

  it("falls back to keyword retrieval when the query embedding is missing", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")
    vi.stubEnv("OPENAI_API_KEY", "openai-key")
    mocks.createOpenAiEmbeddingProviderFromEnv.mockReturnValue({
      embed: vi.fn().mockResolvedValue({
        embeddings: [],
        model: "text-embedding-3-small",
        dimensions: 1536,
      }),
    })

    const response = await postLumiChat()

    expect(response.status).toBe(200)
    expect(mocks.retrieveVerifiedRagChunks).toHaveBeenCalledWith(
      expect.not.objectContaining({
        embedding: expect.anything(),
      })
    )
    expect(assistantInsertMetadata()).toMatchObject({
      queryEmbedding: {
        attempted: true,
        ok: false,
        model: "text-embedding-3-small",
        dimensions: 1536,
        failureReason: "Embedding provider returned no query embedding.",
      },
    })
  })

  it("rejects invalid AI citations through fallback metadata", async () => {
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")
    vi.stubEnv("OPENAI_API_KEY", "openai-key")
    mocks.generateLumiAiRouteResponse.mockResolvedValue({
      ok: false,
      reason: "invalid_citations",
      fallback: {
        answer: "Invalid citation fallback.",
        conversationId,
        suggestedPrompts: [],
        confidence: "low",
      },
      metadata: {
        mode: "rag_ai",
        fallbackReason: "invalid_citations",
        sourceIds: ["draft-source"],
      },
    })

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toBe("Invalid citation fallback.")
    expect(assistantInsertMetadata()).toMatchObject({
      fallbackReason: "invalid_citations",
      ruleBasedFallback: true,
    })
  })

  it("saves RAG retrieval failure metadata instead of hiding the failure", async () => {
    mocks.retrieveVerifiedRagChunks.mockRejectedValue(
      new Error("RAG table unavailable")
    )

    const response = await postLumiChat()

    expect(response.status).toBe(200)
    expect(assistantInsertMetadata()).toMatchObject({
      ragRetrieval: {
        ok: false,
        chunkCount: 0,
        fallbackToPublishedContent: true,
        failureReason: "RAG table unavailable",
      },
    })
  })

  it("marks published lesson context fallback when no same-locale RAG chunks are found", async () => {
    mocks.retrieveVerifiedRagChunks.mockResolvedValue([])

    const response = await postLumiChat({ locale: "th" })

    expect(response.status).toBe(200)
    expect(assistantInsertMetadata()).toMatchObject({
      ragRetrieval: {
        ok: true,
        chunkCount: 0,
        fallbackToPublishedContent: true,
      },
    })
  })

  it("returns 429 when the IP rate limit is exceeded", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAtMs: Date.now() + 10_000,
      retryAfterSeconds: 10,
    })

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("10")
    expect(payload.retryAfterSeconds).toBe(10)
    expect(mocks.requireApiBetaUser).not.toHaveBeenCalled()
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith({
      supabase: limiterSupabase,
      key: "203.0.113.10",
      namespace: "lumi-chat-ip",
      limit: 60,
      windowSeconds: 60,
    })
  })

  it("returns 429 when the user rate limit is exceeded after auth", async () => {
    mocks.consumeRateLimit
      .mockResolvedValueOnce({
        allowed: true,
        limit: 60,
        remaining: 59,
        resetAtMs: Date.now() + 60_000,
        retryAfterSeconds: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        limit: 20,
        remaining: 0,
        resetAtMs: Date.now() + 12_000,
        retryAfterSeconds: 12,
      })

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(response.headers.get("Retry-After")).toBe("12")
    expect(payload.retryAfterSeconds).toBe(12)
    expect(mocks.consumeRateLimit).toHaveBeenNthCalledWith(2, {
      supabase: limiterSupabase,
      key: userId,
      namespace: "lumi-chat-user",
      limit: 20,
      windowSeconds: 60,
    })
    expect(mocks.getOrCreateLumiConversation).not.toHaveBeenCalled()
  })

  it("returns generic 503 when the rate limiter service fails", async () => {
    mocks.consumeRateLimit.mockRejectedValueOnce(new Error("rpc unavailable"))

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.error).toBe("Lumi is temporarily unavailable. Please try again soon.")
    expect(payload.error).not.toContain("rpc unavailable")
    expect(mocks.requireApiBetaUser).not.toHaveBeenCalled()
  })

  it("returns a generic error when internal route work fails", async () => {
    mocks.getOrCreateLumiConversation.mockRejectedValueOnce(
      new Error("raw database failure")
    )

    const response = await postLumiChat()
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not save the Lumi chat response.")
    expect(payload.error).not.toContain("raw database failure")
  })
})
