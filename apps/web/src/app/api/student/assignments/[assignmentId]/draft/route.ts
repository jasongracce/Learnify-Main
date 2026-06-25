import { NextResponse } from "next/server"
import { saveStudentAssignmentDraft } from "@learnify/database"
import { saveStudentAssignmentDraftRequestSchema } from "@learnify/shared"
import { requireApiAuth } from "@/lib/auth/classrooms"
import {
  requireStudentAssignment,
  submissionPayload,
} from "@/app/api/student/assignments/_lib"

type Context = { params: Promise<{ assignmentId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { assignmentId } = await params
  const body = await request.json().catch(() => null)
  const parsed = saveStudentAssignmentDraftRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid assignment draft data.",
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

    const result = await saveStudentAssignmentDraft({
      supabase: auth.serviceSupabase,
      assignmentId,
      studentUserId: auth.user.id,
      request: parsed.data,
    })

    return NextResponse.json(submissionPayload(result))
  } catch (error) {
    console.error("saveStudentAssignmentDraft failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not save assignment draft." },
      { status: 500 }
    )
  }
}
