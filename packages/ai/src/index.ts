import { z } from "zod"
import { localeSchema, type Locale } from "@learnify/shared"

export const aiConfidenceSchema = z.enum(["low", "medium", "high"])

export const aiSourceKindSchema = z.enum([
  "published_lesson",
  "verified_rag_chunk",
  "question",
  "skill",
  "recent_mistake",
])

export const aiSourceSchema = z.object({
  id: z.string().trim().min(1),
  kind: aiSourceKindSchema,
  content: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
  locale: localeSchema.optional(),
  lessonSlug: z.string().trim().min(1).optional(),
  courseSlug: z.string().trim().min(1).optional(),
  skillId: z.string().trim().min(1).optional(),
  status: z.enum(["draft", "in_review", "approved", "published"]).optional(),
  verified: z.boolean().optional(),
})

export const lumiAiChatInputSchema = z.object({
  userId: z.string().trim().min(1),
  message: z.string().trim().min(1).max(2000),
  locale: localeSchema.default("en"),
  conversationId: z.string().uuid().optional(),
  currentLessonSlug: z.string().trim().min(1).optional(),
  currentCourseSlug: z.string().trim().min(1).optional(),
  weakSkills: z
    .array(
      z.object({
        skillId: z.string().trim().min(1),
        title: z.string().trim().min(1),
        confidence: aiConfidenceSchema.optional(),
      })
    )
    .default([]),
  recentMistakes: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        lessonSlug: z.string().trim().min(1).optional(),
        prompt: z.string().trim().min(1),
        selectedAnswer: z.string().trim().min(1).optional(),
        correctAnswer: z.string().trim().min(1).optional(),
      })
    )
    .default([]),
  sources: z.array(aiSourceSchema).default([]),
})

export const lumiAiChatOutputSchema = z.object({
  answer: z.string().trim().min(1),
  relatedLessonSlug: z.string().trim().min(1).nullable(),
  suggestedNextAction: z.string().trim().min(1).nullable(),
  suggestedPrompts: z.array(z.string().trim().min(1)).max(4),
  confidence: aiConfidenceSchema,
  sources: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        title: z.string().trim().min(1).nullable(),
      })
    ),
  safetyNotes: z.array(z.string().trim().min(1)),
})

const lumiChatOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    relatedLessonSlug: { type: ["string", "null"] },
    suggestedNextAction: { type: ["string", "null"] },
    suggestedPrompts: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: ["string", "null"] },
        },
        required: ["id", "title"],
      },
    },
    safetyNotes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "answer",
    "relatedLessonSlug",
    "suggestedNextAction",
    "suggestedPrompts",
    "confidence",
    "sources",
    "safetyNotes",
  ],
}

export type AiConfidence = z.infer<typeof aiConfidenceSchema>
export type AiSourceKind = z.infer<typeof aiSourceKindSchema>
export type AiSource = z.infer<typeof aiSourceSchema>
export type LumiAiChatInput = z.infer<typeof lumiAiChatInputSchema>
export type LumiAiChatOutput = z.infer<typeof lumiAiChatOutputSchema>

export type LumiPromptMessage = {
  role: "system" | "user"
  content: string
}

export type LumiPromptContract = {
  locale: Locale
  messages: LumiPromptMessage[]
  eligibleSources: AiSource[]
}

export type AiProviderRequest = {
  messages: LumiPromptMessage[]
  responseFormat: "lumi_chat_json"
}

export type AiStructuredProvider = {
  completeJson(request: AiProviderRequest): Promise<unknown>
}

export type OpenAiProviderConfig = {
  apiKey: string
  model?: string
  endpoint?: string
  maxOutputTokens?: number
  fetch?: typeof fetch
}

export type OpenAiEmbeddingProviderConfig = {
  apiKey: string
  model?: string
  endpoint?: string
  dimensions?: number
  fetch?: typeof fetch
}

export type OpenAiProviderEnv = Record<string, string | undefined>

export type EmbeddingUsage = {
  promptTokens: number
  totalTokens: number
}

export type EmbeddingProviderRequest = {
  input: string | string[]
  model?: string
  dimensions?: number
  user?: string
}

export type EmbeddingProviderOutput = {
  embeddings: number[][]
  model: string
  dimensions: number
  usage?: EmbeddingUsage
}

export type EmbeddingProvider = {
  embed(request: EmbeddingProviderRequest): Promise<EmbeddingProviderOutput>
}

export type LumiAiFailureReason =
  | "provider_unavailable"
  | "provider_failed"
  | "invalid_output"
  | "invalid_citations"

export type EmbeddingFailureReason =
  | "provider_unavailable"
  | "provider_failed"
  | "invalid_input"
  | "invalid_output"

export type LumiAiResult =
  | {
      ok: true
      output: LumiAiChatOutput
      prompt: LumiPromptContract
    }
  | {
      ok: false
      reason: LumiAiFailureReason
      fallback: LumiAiChatOutput
      prompt: LumiPromptContract
    }

export function filterEligibleLumiSources(sources: AiSource[]): AiSource[] {
  return sources.filter((source) => {
    if (source.kind === "published_lesson") {
      return source.status === "published"
    }

    if (source.kind === "verified_rag_chunk") {
      return source.verified === true
    }

    if (source.kind === "question") {
      return source.status === "published"
    }

    return true
  })
}

export function buildLumiChatPrompt(input: LumiAiChatInput): LumiPromptContract {
  const parsed = lumiAiChatInputSchema.parse(input)
  const eligibleSources = orderSourcesForLumi(
    filterEligibleLumiSources(parsed.sources),
    parsed.currentLessonSlug
  )

  const sourceText =
    eligibleSources.length > 0
      ? eligibleSources
          .map(
            (source, index) =>
              `${index + 1}. [${source.id}] ${source.title ?? source.kind}: ${
                source.content
              }`
          )
          .join("\n")
      : "No verified or published sources were provided."

  const weakSkills =
    parsed.weakSkills.length > 0
      ? parsed.weakSkills
          .map((skill) => `${skill.title} (${skill.confidence ?? "unknown"})`)
          .join(", ")
      : "None provided."

  const recentMistakes =
    parsed.recentMistakes.length > 0
      ? parsed.recentMistakes
          .map((mistake) => {
            const selected = mistake.selectedAnswer
              ? ` selected: ${mistake.selectedAnswer};`
              : ""
            const correct = mistake.correctAnswer
              ? ` correct: ${mistake.correctAnswer};`
              : ""

            return `- ${mistake.prompt};${selected}${correct}`
          })
          .join("\n")
      : "None provided."

  const responseLanguage =
    parsed.locale === "th" ? "Thai" : "English"

  return {
    locale: parsed.locale,
    eligibleSources,
    messages: [
      {
        role: "system",
        content: [
          "You are Lumi, Learnify's learning assistant.",
          `Respond in ${responseLanguage}.`,
          "Use age-appropriate, encouraging explanations.",
          "Ground answers in published lessons, verified RAG chunks, questions, skills, and recent mistakes provided below.",
          "Do not rely on unverified draft content.",
          "If the sources do not support an answer, say you are unsure and give a safe next step.",
          "Return JSON that matches the Lumi chat output schema.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Student question: ${parsed.message}`,
          `Current lesson slug: ${parsed.currentLessonSlug ?? "none"}`,
          `Current course slug: ${parsed.currentCourseSlug ?? "none"}`,
          `Weak skills: ${weakSkills}`,
          `Recent mistakes:\n${recentMistakes}`,
          `Eligible sources:\n${sourceText}`,
        ].join("\n\n"),
      },
    ],
  }
}

export function createUnavailableAiProvider(): AiStructuredProvider {
  return {
    async completeJson() {
      throw new LumiAiError("provider_unavailable")
    },
  }
}

export function resolveOpenAiProviderConfig(
  env: OpenAiProviderEnv
): OpenAiProviderConfig | null {
  const apiKey = env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    return null
  }

  return {
    apiKey,
    model:
      env.OPENAI_MODEL?.trim() || env.LEARNIFY_OPENAI_MODEL?.trim() || "gpt-5.4",
    endpoint:
      env.OPENAI_API_URL?.trim() || "https://api.openai.com/v1/responses",
    maxOutputTokens: parsePositiveInteger(env.OPENAI_MAX_OUTPUT_TOKENS) ?? 900,
  }
}

export function createOpenAiLumiProvider(
  config: OpenAiProviderConfig
): AiStructuredProvider {
  return {
    async completeJson(request) {
      const fetcher = config.fetch ?? fetch
      const instructions = request.messages
        .filter((message) => message.role === "system")
        .map((message) => message.content)
        .join("\n\n")
      const userContent = request.messages
        .filter((message) => message.role === "user")
        .map((message) => message.content)
        .join("\n\n")

      const response = await fetcher(
        config.endpoint ?? "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: config.model ?? "gpt-5.4",
            max_output_tokens: config.maxOutputTokens ?? 900,
            instructions,
            input: [
              {
                role: "user",
                content: [
                  userContent,
                  "Return only valid JSON with this shape:",
                  JSON.stringify({
                    answer: "string",
                    relatedLessonSlug: "string or null",
                    suggestedNextAction: "string or null",
                    suggestedPrompts: ["string"],
                    confidence: "low | medium | high",
                    sources: [
                      {
                        id: "source id from eligible sources",
                        title: "string or null",
                      },
                    ],
                    safetyNotes: ["string"],
                  }),
                ].join("\n\n"),
              },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "lumi_chat_response",
                description: "A grounded Lumi lesson chat response.",
                strict: true,
                schema: lumiChatOutputJsonSchema,
              },
            },
          }),
        }
      )

      if (!response.ok) {
        throw new LumiAiError(
          "provider_failed",
          `OpenAI request failed with status ${response.status}`
        )
      }

      const json = await response.json()
      const text = extractOpenAiText(json)
      const output = parseJsonObjectFromText(text)

      return lumiAiChatOutputSchema.parse(output)
    },
  }
}

export function createOpenAiLumiProviderFromEnv(
  env: OpenAiProviderEnv
): AiStructuredProvider {
  const config = resolveOpenAiProviderConfig(env)

  return config
    ? createOpenAiLumiProvider(config)
    : createUnavailableAiProvider()
}

export function resolveOpenAiEmbeddingProviderConfig(
  env: OpenAiProviderEnv
): OpenAiEmbeddingProviderConfig | null {
  const apiKey = env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    return null
  }

  return {
    apiKey,
    model:
      env.OPENAI_EMBEDDING_MODEL?.trim() ||
      env.LEARNIFY_OPENAI_EMBEDDING_MODEL?.trim() ||
      "text-embedding-3-small",
    endpoint:
      env.OPENAI_EMBEDDINGS_API_URL?.trim() ||
      env.OPENAI_EMBEDDING_API_URL?.trim() ||
      "https://api.openai.com/v1/embeddings",
    dimensions:
      parsePositiveInteger(env.OPENAI_EMBEDDING_DIMENSIONS) ?? undefined,
  }
}

export function createUnavailableEmbeddingProvider(): EmbeddingProvider {
  return {
    async embed() {
      throw new EmbeddingProviderError("provider_unavailable")
    },
  }
}

export function createOpenAiEmbeddingProvider(
  config: OpenAiEmbeddingProviderConfig
): EmbeddingProvider {
  return {
    async embed(request) {
      const normalizedInput = normalizeEmbeddingInput(request.input)
      const model =
        request.model?.trim() || config.model?.trim() || "text-embedding-3-small"
      const dimensions = request.dimensions ?? config.dimensions
      const fetcher = config.fetch ?? fetch

      const body: Record<string, unknown> = {
        input: normalizedInput.length === 1 ? normalizedInput[0] : normalizedInput,
        model,
        encoding_format: "float",
      }

      if (dimensions) {
        body.dimensions = dimensions
      }

      if (request.user?.trim()) {
        body.user = request.user.trim()
      }

      const response = await fetcher(
        config.endpoint ?? "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        throw new EmbeddingProviderError(
          "provider_failed",
          `OpenAI embeddings request failed with status ${response.status}`
        )
      }

      const json = await response.json()

      return parseOpenAiEmbeddingResponse({
        response: json,
        expectedCount: normalizedInput.length,
        expectedDimensions: dimensions,
      })
    },
  }
}

export function createOpenAiEmbeddingProviderFromEnv(
  env: OpenAiProviderEnv
): EmbeddingProvider {
  const config = resolveOpenAiEmbeddingProviderConfig(env)

  return config
    ? createOpenAiEmbeddingProvider(config)
    : createUnavailableEmbeddingProvider()
}

export class LumiAiError extends Error {
  readonly reason: LumiAiFailureReason

  constructor(reason: LumiAiFailureReason, message: string = reason) {
    super(message)
    this.name = "LumiAiError"
    this.reason = reason
  }
}

export class EmbeddingProviderError extends Error {
  readonly reason: EmbeddingFailureReason

  constructor(reason: EmbeddingFailureReason, message: string = reason) {
    super(message)
    this.name = "EmbeddingProviderError"
    this.reason = reason
  }
}

export async function chatWithLumiAi(input: {
  request: LumiAiChatInput
  provider: AiStructuredProvider
}): Promise<LumiAiResult> {
  const request = lumiAiChatInputSchema.parse(input.request)
  const prompt = buildLumiChatPrompt(request)
  const fallback = buildGroundedFallback(request, prompt.eligibleSources)

  try {
    const rawOutput = await input.provider.completeJson({
      messages: prompt.messages,
      responseFormat: "lumi_chat_json",
    })
    const output = lumiAiChatOutputSchema.parse(rawOutput)

    if (!hasValidCitations(output, prompt.eligibleSources)) {
      return {
        ok: false,
        reason: "invalid_citations",
        fallback,
        prompt,
      }
    }

    return {
      ok: true,
      output,
      prompt,
    }
  } catch (error) {
    const reason =
      error instanceof LumiAiError
        ? error.reason
        : error instanceof z.ZodError
          ? "invalid_output"
          : "provider_failed"

    return {
      ok: false,
      reason,
      fallback,
      prompt,
    }
  }
}

function orderSourcesForLumi(
  sources: AiSource[],
  currentLessonSlug?: string
): AiSource[] {
  const priority: Record<AiSourceKind, number> = {
    published_lesson: 1,
    verified_rag_chunk: 2,
    question: 3,
    skill: 4,
    recent_mistake: 5,
  }

  return [...sources].sort((a, b) => {
    const aCurrent = a.lessonSlug === currentLessonSlug ? 0 : 1
    const bCurrent = b.lessonSlug === currentLessonSlug ? 0 : 1

    if (aCurrent !== bCurrent) {
      return aCurrent - bCurrent
    }

    return priority[a.kind] - priority[b.kind]
  })
}

function hasValidCitations(
  output: LumiAiChatOutput,
  eligibleSources: AiSource[]
): boolean {
  const sourceIds = new Set(eligibleSources.map((source) => source.id))

  if (output.sources.length === 0) {
    return output.confidence !== "high"
  }

  return output.sources.every((source) => sourceIds.has(source.id))
}

function buildGroundedFallback(
  request: LumiAiChatInput,
  eligibleSources: AiSource[]
): LumiAiChatOutput {
  const hasSources = eligibleSources.length > 0

  if (request.locale === "th") {
    return {
      answer: hasSources
        ? "Lumi ยังตอบจาก AI ไม่ได้ตอนนี้ แต่มีเนื้อหาที่ตรวจสอบแล้วให้ใช้ทบทวนบทเรียนนี้"
        : "Lumi ยังไม่มีแหล่งข้อมูลที่ตรวจสอบแล้วพอสำหรับตอบคำถามนี้ ลองถามเกี่ยวกับบทเรียนปัจจุบันหรือกลับไปทบทวนตัวอย่างในบทเรียน",
      suggestedPrompts: ["ช่วยอธิบายแนวคิดหลักของบทเรียนนี้", "ฉันควรทบทวนเรื่องไหนก่อน"],
      relatedLessonSlug: null,
      suggestedNextAction: null,
      confidence: hasSources ? "medium" : "low",
      sources: eligibleSources.slice(0, 2).map((source) => ({
        id: source.id,
        title: source.title ?? null,
      })),
      safetyNotes: ["fallback_response"],
    }
  }

  return {
    answer: hasSources
      ? "Lumi cannot use the AI provider right now, but there is verified lesson context available for review."
      : "Lumi does not have enough verified context to answer this safely yet. Try asking about the current lesson or review the lesson examples.",
    relatedLessonSlug: null,
    suggestedNextAction: null,
    suggestedPrompts: [
      "Explain the main idea of this lesson",
      "What should I review first?",
    ],
    confidence: hasSources ? "medium" : "low",
    sources: eligibleSources.slice(0, 2).map((source) => ({
      id: source.id,
      title: source.title ?? null,
    })),
    safetyNotes: ["fallback_response"],
  }
}

function parsePositiveInteger(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeEmbeddingInput(input: string | string[]): string[] {
  const values = Array.isArray(input) ? input : [input]
  const normalized = values.map((value) => value.trim())

  if (
    normalized.length === 0 ||
    normalized.length > 2048 ||
    normalized.some((value) => value.length === 0)
  ) {
    throw new EmbeddingProviderError("invalid_input")
  }

  return normalized
}

export function parseOpenAiEmbeddingResponse(input: {
  response: unknown
  expectedCount: number
  expectedDimensions?: number
}): EmbeddingProviderOutput {
  if (!input.response || typeof input.response !== "object") {
    throw new EmbeddingProviderError("invalid_output")
  }

  const record = input.response as Record<string, unknown>
  const data = record.data

  if (!Array.isArray(data) || data.length !== input.expectedCount) {
    throw new EmbeddingProviderError("invalid_output")
  }

  const embeddings = data
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const embedding = (item as Record<string, unknown>).embedding

      if (
        !Array.isArray(embedding) ||
        embedding.length === 0 ||
        !embedding.every((value) => typeof value === "number" && Number.isFinite(value))
      ) {
        return null
      }

      return embedding
    })
    .filter((embedding): embedding is number[] => Boolean(embedding))

  if (embeddings.length !== data.length) {
    throw new EmbeddingProviderError("invalid_output")
  }

  const dimensions = embeddings[0]?.length ?? 0

  if (
    dimensions === 0 ||
    embeddings.some((embedding) => embedding.length !== dimensions) ||
    (input.expectedDimensions && dimensions !== input.expectedDimensions)
  ) {
    throw new EmbeddingProviderError("invalid_output")
  }

  return {
    embeddings,
    model: typeof record.model === "string" ? record.model : "unknown",
    dimensions,
    usage: parseEmbeddingUsage(record.usage),
  }
}

function parseEmbeddingUsage(value: unknown): EmbeddingUsage | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const record = value as Record<string, unknown>
  const promptTokens = record.prompt_tokens
  const totalTokens = record.total_tokens

  if (typeof promptTokens !== "number" || typeof totalTokens !== "number") {
    return undefined
  }

  return {
    promptTokens,
    totalTokens,
  }
}

export function extractOpenAiText(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new LumiAiError("invalid_output")
  }

  const record = response as Record<string, unknown>

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text.trim()
  }

  const output = record.output

  if (!Array.isArray(output)) {
    throw new LumiAiError("invalid_output")
  }

  const text = output.flatMap(extractTextFromOpenAiOutputItem).join("\n").trim()

  if (!text) {
    throw new LumiAiError("invalid_output")
  }

  return text
}

function extractTextFromOpenAiOutputItem(item: unknown): string[] {
  if (!item || typeof item !== "object") {
    return []
  }

  const content = (item as Record<string, unknown>).content

  if (!Array.isArray(content)) {
    return []
  }

  return content
    .map((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") {
        return null
      }

      const record = contentItem as Record<string, unknown>

      if (
        (record.type === "output_text" || record.type === "text") &&
        typeof record.text === "string"
      ) {
        return record.text
      }

      return null
    })
    .filter((text): text is string => Boolean(text))
}

export function parseJsonObjectFromText(text: string): unknown {
  const trimmed = text.trim()

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return parseJson(trimmed)
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)

  if (fenced?.[1]) {
    return parseJsonObjectFromText(fenced[1])
  }

  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return parseJson(trimmed.slice(firstBrace, lastBrace + 1))
  }

  throw new LumiAiError("invalid_output")
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new LumiAiError("invalid_output")
  }
}
