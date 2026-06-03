import { NextResponse } from "next/server"
import { completeLessonBlock } from "@learnify/database"
import { completeLessonBlockRequestSchema } from "@learnify/shared"
import { requireApiBetaUser } from "@/lib/auth/api"

type CompleteBlockRouteContext = {
  params: Promise<{
    lessonSlug: string
    blockId: string
  }>
}

export async function POST(
  request: Request,
  { params }: CompleteBlockRouteContext
) {
  const body = await request.json().catch(() => ({}))
  const parsed = completeLessonBlockRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid block completion request.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const auth = await requireApiBetaUser(parsed.data.locale)

  if ("response" in auth) {
    return auth.response
  }

  const { lessonSlug, blockId } = await params

  try {
    const result = await completeLessonBlock({
      supabase: auth.supabase,
      userId: auth.user.id,
      lessonSlug,
      blockSlug: blockId,
    })

    return NextResponse.json({
      ok: true,
      blockProgress: result.blockProgress,
      lessonProgress: result.lessonProgress,
    })
  } catch (error) {
    console.error("Lesson block completion failed", {
      lessonSlug,
      blockId,
      error: error instanceof Error ? error.message : error,
    })

    return NextResponse.json(
      {
        error: "Could not complete lesson block.",
      },
      { status: 500 }
    )
  }
}
