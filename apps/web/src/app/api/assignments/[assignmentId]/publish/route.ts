import { NextResponse } from "next/server"
import { insertAuditEvent, publishAssignmentToActiveStudents } from "@learnify/database"
import { publishAssignmentRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"
import {
  assignmentAuditMetadata,
  requireOwnedAssignment,
} from "@/app/api/assignments/_lib"

type Context = { params: Promise<{ assignmentId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { assignmentId } = await params
  const body = await request.json().catch(() => null)
  const schoolId =
    body && typeof body === "object" && typeof body.schoolId === "string"
      ? body.schoolId
      : null
  const parsed = publishAssignmentRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid publish data.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

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

    const result = await publishAssignmentToActiveStudents({
      supabase: auth.serviceSupabase,
      assignmentId,
      recipientStudentUserIds: parsed.data.recipientStudentUserIds,
      dueAt: parsed.data.dueAt,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "assignment.published",
      targetType: "assignment",
      targetId: result.assignment.id,
      metadata: assignmentAuditMetadata({
        classroomId: result.assignment.classroom_id,
        assignmentType: result.assignment.assignment_type,
        status: result.assignment.status,
        recipientCount: result.recipients.length,
      }),
    })

    return NextResponse.json({
      assignment: result.assignment,
      recipients: result.recipients,
    })
  } catch (error) {
    console.error("publishAssignmentToActiveStudents failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not publish assignment." },
      { status: 500 }
    )
  }
}
