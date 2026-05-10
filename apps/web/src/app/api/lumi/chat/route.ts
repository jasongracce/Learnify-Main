import { NextResponse } from "next/server"
import {
  getLessonProgressForUser,
  getOrCreateLumiConversation,
  getStudentSkillMasteryForUser,
  insertLumiMessage,
} from "@learnify/database"
import {
  lumiChatRequestSchema,
  physicsFoundationsCourse,
} from "@learnify/shared"
import { generateRuleBasedLumiChatResponse } from "@learnify/core"
import { requireApiBetaUser } from "@/lib/auth/api"

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

  const auth = await requireApiBetaUser(parsed.data.locale)

  if ("response" in auth) {
    return auth.response
  }

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

    const [progress, mastery] = await Promise.all([
      getLessonProgressForUser({
        supabase: auth.supabase,
        userId: auth.user.id,
      }),
      getStudentSkillMasteryForUser({
        supabase: auth.supabase,
        userId: auth.user.id,
      }),
    ])
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

    const response = generateRuleBasedLumiChatResponse({
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

    await insertLumiMessage({
      supabase: auth.supabase,
      conversationId: conversation.id,
      role: "assistant",
      message: response.answer,
      retrievedContextIds: {
        relatedLessonSlug: response.relatedLessonSlug ?? null,
        confidence: response.confidence,
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
