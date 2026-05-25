import { NextResponse } from "next/server"
import {
  createOpenAiEmbeddingProviderFromEnv,
  type EmbeddingProvider,
  type EmbeddingProviderOutput,
  type OpenAiProviderEnv,
  type EmbeddingFailureReason,
  EmbeddingProviderError,
} from "@learnify/ai"
import {
  getRecentQuestionAttemptsForUser,
  getLessonProgressForUser,
  getOrCreateLumiConversation,
  getStudentSkillMasteryForUser,
  insertLumiMessage,
  retrieveVerifiedRagChunks,
  type RetrievedRagChunk,
  type SupabaseClient,
} from "@learnify/database"
import {
  lumiChatRequestSchema,
  physicsFoundationsCourse,
} from "@learnify/shared"
import { generateRuleBasedLumiChatResponse } from "@learnify/core"
import { requireApiBetaUser } from "@/lib/auth/api"
import {
  checkInMemoryRateLimit,
  getRequestIpAddress,
} from "@/lib/in-memory-rate-limit"
import { getLumiEnv, type LumiEnv } from "@/lib/env"
import {
  createLiveLumiAiProvider,
  createMockLumiAiProvider,
  generateLumiAiRouteResponse,
} from "@/lib/lumi-ai-route-adapter"

const LUMI_CHAT_IP_RATE_LIMIT = {
  limit: 60,
  windowMs: 60_000,
}

const LUMI_CHAT_USER_RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000,
}

type RagRetrievalMetadata = {
  ok: boolean
  chunkCount: number
  fallbackToPublishedContent?: boolean
  failureReason?: string
}

type QueryEmbeddingMetadata = {
  attempted: boolean
  ok: boolean
  model?: string
  dimensions?: number
  failureReason?: string
}

export async function POST(request: Request) {
  const parsed = lumiChatRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid Lumi chat request.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const ipLimit = checkInMemoryRateLimit({
    identifier: getRequestIpAddress(request),
    namespace: "lumi-chat-ip",
    ...LUMI_CHAT_IP_RATE_LIMIT,
  })

  if (!ipLimit.allowed) {
    return createRateLimitResponse(ipLimit.retryAfterSeconds)
  }

  const auth = await requireApiBetaUser(parsed.data.locale)

  if ("response" in auth) {
    return auth.response
  }

  const userLimit = checkInMemoryRateLimit({
    identifier: auth.user.id || getRequestIpAddress(request),
    namespace: "lumi-chat-user",
    ...LUMI_CHAT_USER_RATE_LIMIT,
  })

  if (!userLimit.allowed) {
    return createRateLimitResponse(userLimit.retryAfterSeconds)
  }

  const lumiEnv = getLumiEnv()
  const mode = lumiEnv.LEARNIFY_LUMI_MODE

  try {
    const conversation = await getOrCreateLumiConversation({
      supabase: auth.supabase,
      userId: auth.user.id,
      locale: parsed.data.locale,
      conversationId: parsed.data.conversationId,
      currentLessonSlug: parsed.data.currentLessonSlug,
      titleSource: parsed.data.message,
    })

    await insertLumiMessage({
      supabase: auth.supabase,
      conversationId: conversation.id,
      role: "user",
      message: parsed.data.message,
    })

    const queryEmbeddingResult =
      mode === "rag_ai"
        ? await createQueryEmbeddingForLumi({
            env: getOpenAiProviderEnv(lumiEnv),
            message: parsed.data.message,
            userId: auth.user.id,
          })
        : {
            embedding: undefined,
            metadata: {
              attempted: false,
              ok: false,
            },
          }

    const [progress, mastery, recentAttempts, ragRetrieval] = await Promise.all([
      getLessonProgressForUser({
        supabase: auth.supabase,
        userId: auth.user.id,
      }),
      getStudentSkillMasteryForUser({
        supabase: auth.supabase,
        userId: auth.user.id,
      }),
      getRecentQuestionAttemptsForUser({
        supabase: auth.supabase,
        userId: auth.user.id,
      }),
      retrieveRagChunksForLumi({
        supabase: auth.supabase,
        locale: parsed.data.locale,
        query: parsed.data.message,
        subject: "Physics",
        courseSlug: physicsFoundationsCourse.slug,
        lessonSlug: parsed.data.currentLessonSlug,
        limit: 4,
        embedding: queryEmbeddingResult.embedding,
      }),
    ])
    const ragChunks = ragRetrieval.chunks
    const lessonSlugs = new Set(
      physicsFoundationsCourse.modules.flatMap((module) =>
        module.lessons.map((lesson) => lesson.slug)
      )
    )
    const completedLessonSlugs = progress
      .filter(
        (item) =>
          item.status === "completed" &&
          item.progressPercent === 100 &&
          lessonSlugs.has(item.lessonSlug)
      )
      .map((item) => item.lessonSlug)
    const weakSkillIds = mastery
      .filter((item) => item.confidenceLevel === "low")
      .map((item) => item.skillId)

    const ruleBasedResponse = generateRuleBasedLumiChatResponse({
      message: parsed.data.message,
      locale: parsed.data.locale,
      conversationId: conversation.id,
      currentLessonSlug: parsed.data.currentLessonSlug,
      completedLessonSlugs,
      weakSkillIds,
      lessons: physicsFoundationsCourse.modules.flatMap(
        (module) => module.lessons
      ),
    })
    const aiResult =
      mode === "rule"
        ? null
        : await generateLumiAiRouteResponse({
            context: {
              userId: auth.user.id,
              message: parsed.data.message,
              locale: parsed.data.locale,
              conversationId: conversation.id,
              currentLessonSlug: parsed.data.currentLessonSlug,
              mastery,
              recentAttempts,
              ragChunks,
            },
            provider:
              mode === "mock"
                ? createMockLumiAiProvider()
                : createLiveLumiAiProvider(getOpenAiProviderEnv(lumiEnv)),
          })

    if (aiResult && !aiResult.ok) {
      console.warn("Lumi AI response fell back to rule-based mode", {
        reason: aiResult.reason,
        mode,
        sourceIds: aiResult.metadata.sourceIds,
      })
    }

    const response =
      aiResult && aiResult.ok ? aiResult.response : ruleBasedResponse
    const responseMetadata = aiResult
      ? aiResult.ok
        ? aiResult.metadata
        : {
            ...aiResult.metadata,
            ruleBasedFallback: true,
          }
      : {
          mode: "rule",
        }

    await insertLumiMessage({
      supabase: auth.supabase,
      conversationId: conversation.id,
      role: "assistant",
      message: response.answer,
      retrievedContextIds: {
        relatedLessonSlug: response.relatedLessonSlug ?? null,
        confidence: response.confidence,
        ragRetrieval: ragRetrieval.metadata,
        queryEmbedding: queryEmbeddingResult.metadata,
        ...responseMetadata,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save the Lumi chat response.",
      },
      { status: 500 }
    )
  }
}

function createRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Too many Lumi chat messages. Please wait and try again.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  )
}

async function retrieveRagChunksForLumi(input: {
  supabase: SupabaseClient
  locale: "en" | "th"
  query: string
  subject: string
  courseSlug: string
  lessonSlug?: string
  limit: number
  embedding?: number[]
}): Promise<{
  chunks: RetrievedRagChunk[]
  metadata: RagRetrievalMetadata
}> {
  try {
    const chunks = await retrieveVerifiedRagChunks(input)

    return {
      chunks,
      metadata: {
        ok: true,
        chunkCount: chunks.length,
        fallbackToPublishedContent: chunks.length === 0,
      },
    }
  } catch (error) {
    const failureReason =
      error instanceof Error ? error.message : "Unknown RAG retrieval error."

    console.warn("Lumi RAG retrieval failed", {
      failureReason,
      locale: input.locale,
      lessonSlug: input.lessonSlug,
    })

    return {
      chunks: [],
      metadata: {
        ok: false,
        chunkCount: 0,
        fallbackToPublishedContent: true,
        failureReason,
      },
    }
  }
}

async function createQueryEmbeddingForLumi(input: {
  env: OpenAiProviderEnv
  message: string
  userId: string
  provider?: EmbeddingProvider
}): Promise<{
  embedding?: number[]
  metadata: QueryEmbeddingMetadata
}> {
  try {
    const dimensions = getLumiEmbeddingDimensions(input.env)
    const provider =
      input.provider ?? createOpenAiEmbeddingProviderFromEnv(input.env)
    const output = await provider.embed({
      input: input.message,
      user: input.userId,
      dimensions,
    })
    const embedding = output.embeddings[0]
    const validationFailure = getEmbeddingValidationFailure(
      output,
      embedding,
      dimensions
    )

    if (validationFailure) {
      return {
        embedding: undefined,
        metadata: {
          attempted: true,
          ok: false,
          model: output.model,
          dimensions: output.dimensions,
          failureReason: validationFailure,
        },
      }
    }

    return {
      embedding,
      metadata: {
        attempted: true,
        ok: true,
        model: output.model,
        dimensions: embedding.length,
      },
    }
  } catch (error) {
    const failureReason =
      error instanceof EmbeddingProviderError
        ? formatEmbeddingProviderFailure(error.reason, error.message)
        : error instanceof Error
          ? error.message
          : "Unknown embedding error."

    console.warn("Lumi query embedding generation failed", {
      failureReason,
    })

    return {
      embedding: undefined,
      metadata: {
        attempted: true,
        ok: false,
        failureReason,
      },
    }
  }
}

function getEmbeddingValidationFailure(
  output: EmbeddingProviderOutput,
  embedding: number[] | undefined,
  expectedDimensions: number
) {
  if (!embedding) {
    return "Embedding provider returned no query embedding."
  }

  if (embedding.length !== expectedDimensions) {
    return `Expected ${expectedDimensions} embedding dimensions, got ${embedding.length}.`
  }

  if (output.dimensions !== expectedDimensions) {
    return `Expected ${expectedDimensions} embedding dimensions, got ${output.dimensions}.`
  }

  return null
}

function getOpenAiProviderEnv(env: LumiEnv): OpenAiProviderEnv {
  return {
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    OPENAI_MODEL: env.OPENAI_MODEL,
    OPENAI_MAX_OUTPUT_TOKENS: env.OPENAI_MAX_OUTPUT_TOKENS,
    OPENAI_EMBEDDING_MODEL: env.OPENAI_EMBEDDING_MODEL,
    OPENAI_EMBEDDING_DIMENSIONS: env.OPENAI_EMBEDDING_DIMENSIONS,
  }
}

function getLumiEmbeddingDimensions(env: OpenAiProviderEnv) {
  const parsed = Number.parseInt(env.OPENAI_EMBEDDING_DIMENSIONS ?? "", 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1536
}

function formatEmbeddingProviderFailure(
  reason: EmbeddingFailureReason,
  message: string
) {
  return message === reason ? reason : `${reason}: ${message}`
}
