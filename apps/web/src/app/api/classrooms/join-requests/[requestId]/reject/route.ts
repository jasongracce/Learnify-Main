import { NextResponse } from "next/server"
import {
  getJoinRequestById,
  getClassroomById,
  rejectJoinRequest,
  insertAuditEvent,
} from "@learnify/database"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ requestId: string }> }

// Body: { schoolId: string }
export async function POST(request: Request, { params }: Context) {
  const { requestId } = await params
  const body = await request.json().catch(() => null)
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId : null

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const joinRequest = await getJoinRequestById({
      supabase: auth.serviceSupabase,
      requestId,
    })

    if (!joinRequest || joinRequest.school_id !== schoolId) {
      return NextResponse.json({ error: "Join request not found." }, { status: 404 })
    }

    const classroom = await getClassroomById({
      supabase: auth.serviceSupabase,
      classroomId: joinRequest.classroom_id,
    })

    if (!classroom || classroom.owner_membership_id !== auth.membership.id) {
      return NextResponse.json(
        { error: "Only the classroom owner can reject join requests." },
        { status: 403 }
      )
    }

    const rejected = await rejectJoinRequest({
      supabase: auth.serviceSupabase,
      requestId,
      rejectedBy: auth.user.id,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "join_request.rejected",
      targetType: "classroom_join_request",
      targetId: requestId,
      metadata: {},
    })

    return NextResponse.json({ joinRequest: rejected })
  } catch (error) {
    console.error("rejectJoinRequest failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not reject join request." }, { status: 500 })
  }
}
