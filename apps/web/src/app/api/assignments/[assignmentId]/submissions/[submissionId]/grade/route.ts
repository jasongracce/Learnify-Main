import { NextResponse } from "next/server"
import { gradeAssignmentSubmission, insertAuditEvent } from "@learnify/database"
import { gradeAssignmentSubmissionRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"
import {
  assignmentAuditMetadata,
  requireOwnedAssignment,
} from "@/app/api/assignments/_lib"

type Context = {
  params: Promise<{ assignmentId: string; submissionId: string }>
}

export async function POST(request: Request, { params }: Context) {
  const { assignmentId, submissionId } = await params
  const body = await request.json().catch(() => null)
  const parsed = gradeAssignmentSubmissionRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid grading data.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { schoolId } = parsed.data
  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const ownerCheck = await requireOwnedAssignment({
      supabase: auth.serviceSupabase,
      assignmentId,
      schoolId,
      membership: auth.membership,
    })
    if ("response" in ownerCheck) return ownerCheck.response

    if (
      !ownerCheck.assignment.submissions.some(
        (submission) => submission.id === submissionId
      )
    ) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      )
    }

    const result = await gradeAssignmentSubmission({
      supabase: auth.serviceSupabase,
      assignmentId,
      submissionId,
      gradedBy: auth.user.id,
      request: parsed.data,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "assignment.submission_graded",
      targetType: "assignment_submission",
      targetId: result.submission.id,
      metadata: assignmentAuditMetadata({
        classroomId: ownerCheck.assignment.assignment.classroom_id,
        assignmentType: ownerCheck.assignment.assignment.assignment_type,
        status: result.submission.status,
      }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("gradeAssignmentSubmission failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not grade submission." },
      { status: 500 }
    )
  }
}
