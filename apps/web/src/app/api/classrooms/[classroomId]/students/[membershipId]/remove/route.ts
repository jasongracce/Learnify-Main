import { NextResponse } from "next/server"
import {
  getClassroomById,
  getClassroomMembershipById,
  insertAuditEvent,
  removeStudentFromClassroom,
} from "@learnify/database"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ classroomId: string; membershipId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { classroomId, membershipId } = await params
  const body = await request.json().catch(() => null)
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId : null

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const classroom = await getClassroomById({
      supabase: auth.serviceSupabase,
      classroomId,
    })

    if (!classroom || classroom.school_id !== schoolId) {
      return NextResponse.json({ error: "Classroom not found." }, { status: 404 })
    }

    if (classroom.owner_membership_id !== auth.membership.id) {
      return NextResponse.json(
        { error: "Only the classroom owner can remove students." },
        { status: 403 }
      )
    }

    const classroomMembership = await getClassroomMembershipById({
      supabase: auth.serviceSupabase,
      classroomMembershipId: membershipId,
    })

    if (
      !classroomMembership ||
      classroomMembership.classroom_id !== classroomId ||
      classroomMembership.school_id !== schoolId
    ) {
      return NextResponse.json(
        { error: "Classroom membership not found." },
        { status: 404 }
      )
    }

    const removed = await removeStudentFromClassroom({
      supabase: auth.serviceSupabase,
      classroomMembershipId: membershipId,
      removedBy: auth.user.id,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "membership.deactivated",
      targetType: "classroom_membership",
      targetId: membershipId,
      metadata: { classroomId, studentUserId: removed.student_user_id },
    })

    return NextResponse.json({ classroomMembership: removed })
  } catch (error) {
    console.error("removeStudentFromClassroom failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not remove student." }, { status: 500 })
  }
}
