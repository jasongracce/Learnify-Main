import { NextResponse } from "next/server"
import {
  getLessonBlockBySlug,
  getPublishedLessonBySlug,
  getQuestionForLesson,
  recordQuestionAttempt,
} from "@learnify/database"
import { submitQuestionAttemptRequestSchema } from "@learnify/shared"
import { requireApiBetaUser } from "@/lib/auth/api"

function getCorrectOptionId(correctAnswer: unknown) {
  if (typeof correctAnswer === "string") {
    return correctAnswer
  }

  if (!correctAnswer || typeof correctAnswer !== "object") {
    return null
  }

  const answer = correctAnswer as Record<string, unknown>
  const candidates = [
    answer.option_id,
    answer.optionId,
    answer.correct_option_id,
    answer.correctOptionId,
    answer.id,
  ]

  return candidates.find((candidate): candidate is string => {
    return typeof candidate === "string"
  }) ?? null
}

export async function POST(request: Request) {
  const parsed = submitQuestionAttemptRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid question attempt.",
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
    const lesson = await getPublishedLessonBySlug({
      supabase: auth.supabase,
      lessonSlug: parsed.data.lessonSlug,
    })

    if (!lesson) {
      return NextResponse.json(
        { error: "Published lesson not found." },
        { status: 404 }
      )
    }

    const block = await getLessonBlockBySlug({
      supabase: auth.supabase,
      lessonId: lesson.id,
      blockSlug: parsed.data.blockId,
    })

    if (!block) {
      return NextResponse.json(
        { error: "Lesson block not found." },
        { status: 404 }
      )
    }

    if (block.type !== "multiple_choice") {
      return NextResponse.json(
        { error: "Only multiple choice blocks can record question attempts." },
        { status: 400 }
      )
    }

    const question = await getQuestionForLesson({
      supabase: auth.supabase,
      lessonId: lesson.id,
      questionSlugOrId: parsed.data.questionId,
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 })
    }

    const correctOptionId = getCorrectOptionId(question.correct_answer)

    if (!correctOptionId) {
      console.error("Question answer key is not configured", {
        lessonSlug: parsed.data.lessonSlug,
        blockId: parsed.data.blockId,
        questionId: parsed.data.questionId,
      })

      return NextResponse.json(
        { error: "Could not record question attempt." },
        { status: 500 }
      )
    }

    const isCorrect = parsed.data.selectedOptionId === correctOptionId
    const result = await recordQuestionAttempt({
      supabase: auth.supabase,
      userId: auth.user.id,
      lessonSlug: parsed.data.lessonSlug,
      blockSlug: parsed.data.blockId,
      questionSlugOrId: parsed.data.questionId,
      selectedAnswer: {
        option_id: parsed.data.selectedOptionId,
      },
      isCorrect,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
    })

    return NextResponse.json({
      ok: true,
      isCorrect,
      correctOptionId,
      attempt: result.attempt,
      skillMastery: result.skillMastery,
      blockProgress: result.blockProgress,
      lessonProgress: result.lessonProgress,
    })
  } catch (error) {
    console.error("Question attempt failed", {
      error: error instanceof Error ? error.message : error,
    })

    return NextResponse.json(
      {
        error: "Could not record question attempt.",
      },
      { status: 500 }
    )
  }
}
