import { NextResponse } from "next/server"
import { insertAuditEvent, updateAssignmentDraft } from "@learnify/database"
import { updateAssignmentDraftRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"
import {
  assignmentAuditMetadata,
  requireOwnedAssignment,
} from "@/app/api/assignments/_lib"

type Context = { params: Promise<{ assignmentId: string }> }

export async function GET(request: Request, { params }: Context) {
  const { assignmentId } = await params
  const url = new URL(request.url)
  const schoolId = url.searchParams.get("schoolId")

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

    return NextResponse.json({ assignment: ownerCheck.assignment })
  } catch (error) {
    console.error("getTeacherAssignmentDetail failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not load assignment." },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { assignmentId } = await params
  const body = await request.json().catch(() => null)
  const schoolId =
    body && typeof body === "object" && typeof body.schoolId === "string"
      ? body.schoolId
      : null
  const parsed = updateAssignmentDraftRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid assignment data.",
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

    const assignment = await updateAssignmentDraft({
      supabase: auth.serviceSupabase,
      assignmentId,
      request: parsed.data,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "assignment.updated",
      targetType: "assignment",
      targetId: assignment.assignment.id,
      metadata: assignmentAuditMetadata({
        classroomId: assignment.assignment.classroom_id,
        assignmentType: assignment.assignment.assignment_type,
        status: assignment.assignment.status,
      }),
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error("updateAssignmentDraft failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not update assignment." },
      { status: 500 }
    )
  }
}
