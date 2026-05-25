import {
  chatWithLumiAi,
  createOpenAiLumiProviderFromEnv,
  createUnavailableAiProvider,
  type AiSource,
  type AiStructuredProvider,
  type LumiAiChatInput,
  type LumiAiChatOutput,
} from "@learnify/ai"
import type {
  LearnifyLesson,
  LumiChatResponse,
  Locale,
} from "@learnify/shared"
import type {
  QuestionAttemptSummary,
  RetrievedRagChunk,
  StudentSkillMasterySummary,
} from "@learnify/database"
import {
  getPhysicsQuestion,
  physicsFoundationsCourse,
  physicsQuestions,
  physicsSkills,
} from "@learnify/shared"

export type LumiAiRouteContext = {
  userId: string
  message: string
  locale: Locale
  conversationId: string
  currentLessonSlug?: string
  mastery: StudentSkillMasterySummary[]
  recentAttempts: QuestionAttemptSummary[]
  ragChunks: RetrievedRagChunk[]
}

export async function generateLumiAiRouteResponse(input: {
  context: LumiAiRouteContext
  provider?: AiStructuredProvider
}): Promise<
  | {
      ok: true
      response: LumiChatResponse
      metadata: Record<string, unknown>
    }
  | {
      ok: false
      reason: string
      fallback: LumiChatResponse
      metadata: Record<string, unknown>
    }
> {
  const request = buildLumiAiChatInput(input.context)
  const result = await chatWithLumiAi({
    request,
    provider: input.provider ?? createUnavailableAiProvider(),
  })

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      fallback: mapAiOutputToChatResponse({
        output: result.fallback,
        conversationId: input.context.conversationId,
        eligibleSources: result.prompt.eligibleSources,
      }),
      metadata: {
        mode: "rag_ai",
        fallbackReason: result.reason,
        sourceIds: result.prompt.eligibleSources.map((source) => source.id),
      },
    }
  }

  return {
    ok: true,
    response: mapAiOutputToChatResponse({
      output: result.output,
      conversationId: input.context.conversationId,
      eligibleSources: result.prompt.eligibleSources,
    }),
    metadata: {
      mode: "rag_ai",
      sourceIds: result.output.sources.map((source) => source.id),
    },
  }
}

export function createMockLumiAiProvider(): AiStructuredProvider {
  return {
    async completeJson(request) {
      const userMessage =
        request.messages.find((message) => message.role === "user")?.content ??
        ""
      const lessonMatch = userMessage.match(/Current lesson slug: ([^\n]+)/)
      const currentLessonSlug =
        lessonMatch?.[1] && lessonMatch[1] !== "none"
          ? lessonMatch[1]
          : undefined
      const sourceMatch = userMessage.match(/\[([^\]]+)\]/)
      const sourceId = sourceMatch?.[1]

      return {
        answer:
          "Gravity makes falling objects speed up because it creates downward acceleration while they fall.",
        relatedLessonSlug: currentLessonSlug ?? null,
        suggestedNextAction: "Review the gravity slider and compare two gravity values.",
        suggestedPrompts: [
          "What does acceleration mean?",
          "Why does stronger gravity change speed faster?",
        ],
        confidence: sourceId ? "high" : "low",
        sources: sourceId ? [{ id: sourceId, title: null }] : [],
        safetyNotes: [],
      } satisfies LumiAiChatOutput
    },
  }
}

export function createLiveLumiAiProvider(
  env: Record<string, string | undefined>
): AiStructuredProvider {
  return createOpenAiLumiProviderFromEnv(env)
}

function buildLumiAiChatInput(context: LumiAiRouteContext): LumiAiChatInput {
  const weakSkills = context.mastery
    .filter((item) => item.confidenceLevel === "low")
    .map((item) => {
      const skill = physicsSkills.find(
        (candidate) =>
          candidate.id === item.skillId || candidate.slug === item.skillSlug
      )

      return {
        skillId: item.skillId,
        title: selectLocalizedText(
          {
            en: skill?.title_en ?? item.skillSlug,
            th: skill?.title_th,
          },
          context.locale
        ),
        confidence: item.confidenceLevel,
      }
    })

  const recentMistakes = context.recentAttempts
    .filter((attempt) => !attempt.isCorrect)
    .map((attempt) => {
      const question = getPhysicsQuestion(attempt.questionId)

      return {
        questionId: attempt.questionId,
        lessonSlug: attempt.lessonSlug,
        prompt: question
          ? selectLocalizedText(
              {
                en: question.question_en,
                th: question.question_th,
              },
              context.locale
            )
          : `Question ${attempt.questionId}`,
      }
    })

  return {
    userId: context.userId,
    message: context.message,
    locale: context.locale,
    conversationId: context.conversationId,
    currentLessonSlug: context.currentLessonSlug,
    currentCourseSlug: physicsFoundationsCourse.slug,
    weakSkills,
    recentMistakes,
    sources: buildLumiSources(context),
  }
}

function buildLumiSources(context: LumiAiRouteContext): AiSource[] {
  const lessons = physicsFoundationsCourse.modules.flatMap(
    (module) => module.lessons
  )
  const currentLesson = context.currentLessonSlug
    ? lessons.find((lesson) => lesson.slug === context.currentLessonSlug)
    : undefined

  return [
    ...lessons.flatMap((lesson) =>
      buildLessonSources({
        lesson,
        locale: context.locale,
        includeAllBlocks: lesson.slug === currentLesson?.slug,
      })
    ),
    ...context.ragChunks.map((chunk) => {
      const lessonSlug = getStringMetadata(chunk.metadata, "lesson_slug")
      const courseSlug =
        getStringMetadata(chunk.metadata, "course_slug") ??
        physicsFoundationsCourse.slug

      return {
        id: `rag:${chunk.id}`,
        kind: "verified_rag_chunk" as const,
        title: chunk.documentTitle,
        content: chunk.content,
        locale: chunk.locale,
        lessonSlug,
        courseSlug,
        verified: true,
      }
    }),
    ...physicsQuestions.map((question) => ({
      id: `question:${question.id}`,
      kind: "question" as const,
      title: selectLocalizedText(
        { en: question.question_en, th: question.question_th },
        context.locale
      ),
      content: selectLocalizedText(
        { en: question.explanation_en, th: question.explanation_th },
        context.locale
      ),
      lessonSlug: question.lesson_slug,
      courseSlug: physicsFoundationsCourse.slug,
      skillId: question.skill_id,
      status: "published" as const,
    })),
    ...physicsSkills.map((skill) => ({
      id: `skill:${skill.id}`,
      kind: "skill" as const,
      title: selectLocalizedText(
        { en: skill.title_en, th: skill.title_th },
        context.locale
      ),
      content: selectLocalizedText(
        { en: skill.description_en, th: skill.description_th },
        context.locale
      ),
      courseSlug: physicsFoundationsCourse.slug,
      skillId: skill.id,
    })),
    ...context.recentAttempts
      .filter((attempt) => !attempt.isCorrect)
      .map((attempt) => ({
        id: `mistake:${attempt.id}`,
        kind: "recent_mistake" as const,
        title: "Recent mistake",
        content: `The student missed ${attempt.questionId} in ${attempt.lessonSlug}.`,
        lessonSlug: attempt.lessonSlug,
        courseSlug: physicsFoundationsCourse.slug,
      })),
  ]
}

function buildLessonSources(input: {
  lesson: LearnifyLesson
  locale: Locale
  includeAllBlocks: boolean
}): AiSource[] {
  const blockSources: Array<AiSource | null> = input.lesson.blocks
    .filter((block) => input.includeAllBlocks || block.type === "text")
    .map((block) => {
      if (block.type === "text") {
        return {
          id: `lesson:${input.lesson.slug}:block:${block.id}`,
          kind: "published_lesson" as const,
          title: selectLocalizedText(
            { en: input.lesson.title_en, th: input.lesson.title_th },
            input.locale
          ),
          content: selectLocalizedText(
            { en: block.content_en, th: block.content_th },
            input.locale
          ),
          lessonSlug: input.lesson.slug,
          courseSlug: physicsFoundationsCourse.slug,
          status: "published" as const,
        }
      }

      if (block.type === "visual" && block.title_en) {
        return {
          id: `lesson:${input.lesson.slug}:block:${block.id}`,
          kind: "published_lesson" as const,
          title: selectLocalizedText(
            { en: input.lesson.title_en, th: input.lesson.title_th },
            input.locale
          ),
          content: selectLocalizedText(
            { en: block.title_en, th: block.title_th },
            input.locale
          ),
          lessonSlug: input.lesson.slug,
          courseSlug: physicsFoundationsCourse.slug,
          status: "published" as const,
        }
      }

      return null
    })

  return [
    {
      id: `lesson:${input.lesson.slug}:summary`,
      kind: "published_lesson" as const,
      title: selectLocalizedText(
        { en: input.lesson.title_en, th: input.lesson.title_th },
        input.locale
      ),
      content: selectLocalizedText(
        { en: input.lesson.summary_en, th: input.lesson.summary_th },
        input.locale
      ),
      lessonSlug: input.lesson.slug,
      courseSlug: physicsFoundationsCourse.slug,
      status: "published" as const,
    },
    ...blockSources.filter(isAiSource),
  ]
}

function isAiSource(source: AiSource | null): source is AiSource {
  return Boolean(source)
}

function mapAiOutputToChatResponse(input: {
  output: LumiAiChatOutput
  conversationId: string
  eligibleSources: AiSource[]
}): LumiChatResponse {
  const sourceById = new Map(
    input.eligibleSources.map((source) => [source.id, source])
  )

  return {
    answer: input.output.answer,
    conversationId: input.conversationId,
    suggestedPrompts: input.output.suggestedPrompts,
    relatedLessonSlug: input.output.relatedLessonSlug ?? undefined,
    suggestedNextAction: input.output.suggestedNextAction ?? undefined,
    confidence: input.output.confidence,
    sources: input.output.sources.map((source) => {
      const hydratedSource = sourceById.get(source.id)
      const title = source.title ?? hydratedSource?.title

      return {
        id: source.id,
        ...(title ? { title } : {}),
        ...(hydratedSource?.kind ? { kind: hydratedSource.kind } : {}),
        ...(hydratedSource?.lessonSlug
          ? { lessonSlug: hydratedSource.lessonSlug }
          : {}),
        ...(hydratedSource?.courseSlug
          ? { courseSlug: hydratedSource.courseSlug }
          : {}),
      }
    }),
  }
}

function selectLocalizedText(
  record: { en: string; th?: string | null },
  locale: Locale
) {
  if (locale === "th" && record.th) {
    return record.th
  }

  return record.en
}

function getStringMetadata(
  metadata: Record<string, unknown>,
  key: string
): string | undefined {
  const value = metadata[key]

  return typeof value === "string" && value.trim() ? value : undefined
}
