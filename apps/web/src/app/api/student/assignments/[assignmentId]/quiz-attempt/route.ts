import { NextResponse } from "next/server"
import { recordAssignmentQuizAttempt } from "@learnify/database"
import { recordAssignmentQuizAttemptRequestSchema } from "@learnify/shared"
import { requireApiAuth } from "@/lib/auth/classrooms"
import { requireStudentAssignment } from "@/app/api/student/assignments/_lib"

type Context = { params: Promise<{ assignmentId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { assignmentId } = await params
  const body = await request.json().catch(() => null)
  const parsed = recordAssignmentQuizAttemptRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid quiz attempt data.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const auth = await requireApiAuth()
  if ("response" in auth) return auth.response

  try {
    const assignmentCheck = await requireStudentAssignment({
      supabase: auth.serviceSupabase,
      assignmentId,
      studentUserId: auth.user.id,
    })
    if ("response" in assignmentCheck) return assignmentCheck.response

    const itemSubmission = await recordAssignmentQuizAttempt({
      supabase: auth.serviceSupabase,
      assignmentId,
      studentUserId: auth.user.id,
      request: parsed.data,
    })

    return NextResponse.json({ itemSubmission })
  } catch (error) {
    console.error("recordAssignmentQuizAttempt failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not record quiz attempt." },
      { status: 500 }
    )
  }
}
