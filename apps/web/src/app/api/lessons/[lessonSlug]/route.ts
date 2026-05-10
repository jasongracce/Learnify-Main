import { NextResponse } from "next/server"
import {
  getPhysicsLesson,
  localeSchema,
  physicsQuestions,
} from "@learnify/shared"
import { requireApiBetaUser } from "@/lib/auth/api"

type LessonRouteContext = {
  params: Promise<{
    lessonSlug: string
  }>
}

export async function GET(request: Request, { params }: LessonRouteContext) {
  const url = new URL(request.url)
  const locale = localeSchema
    .catch("en")
    .parse(url.searchParams.get("locale") ?? "en")
  const auth = await requireApiBetaUser(locale)

  if ("response" in auth) {
    return auth.response
  }

  const { lessonSlug } = await params
  const lesson = getPhysicsLesson(lessonSlug)

  if (!lesson || lesson.status !== "published") {
    return NextResponse.json(
      {
        error: "Published lesson not found.",
      },
      { status: 404 }
    )
  }

  const questionIds = new Set(
    lesson.blocks
      .filter((block) => block.type === "multiple_choice")
      .map((block) => block.question_id)
  )

  return NextResponse.json({
    lesson,
    questions: physicsQuestions.filter((question) =>
      questionIds.has(question.id)
    ),
  })
}
