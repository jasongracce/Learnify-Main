import { NextResponse } from "next/server"
import { submitStudentAssignment } from "@learnify/database"
import { submitStudentAssignmentRequestSchema } from "@learnify/shared"
import { requireApiAuth } from "@/lib/auth/classrooms"
import {
  requireStudentAssignment,
  submissionPayload,
} from "@/app/api/student/assignments/_lib"

type Context = { params: Promise<{ assignmentId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { assignmentId } = await params
  const body = await request.json().catch(() => null)
  const parsed = submitStudentAssignmentRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid assignment submission data.",
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

    const result = await submitStudentAssignment({
      supabase: auth.serviceSupabase,
      assignmentId,
      studentUserId: auth.user.id,
      request: parsed.data,
    })

    return NextResponse.json(submissionPayload(result))
  } catch (error) {
    console.error("submitStudentAssignment failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not submit assignment." },
      { status: 500 }
    )
  }
}
