import { NextResponse } from "next/server"
import {
  getClassroomById,
  disableJoinCode,
  insertAuditEvent,
} from "@learnify/database"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ classroomId: string }> }

// Body: { schoolId: string }
export async function POST(request: Request, { params }: Context) {
  const { classroomId } = await params
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
        { error: "Only the classroom owner can disable the join code." },
        { status: 403 }
      )
    }

    const updated = await disableJoinCode({
      supabase: auth.serviceSupabase,
      classroomId,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "classroom.join_code_disabled",
      targetType: "classroom",
      targetId: classroomId,
      metadata: {},
    })

    return NextResponse.json({ classroom: updated })
  } catch (error) {
    console.error("disableJoinCode failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not disable join code." }, { status: 500 })
  }
}
