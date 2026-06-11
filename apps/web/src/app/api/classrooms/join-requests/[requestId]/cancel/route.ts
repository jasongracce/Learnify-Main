import { NextResponse } from "next/server"
import {
  getJoinRequestById,
  cancelJoinRequest,
  insertAuditEvent,
} from "@learnify/database"
import { requireApiAuth } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ requestId: string }> }

// Students cancel their own pending join requests.
// No schoolId needed — ownership validated via student_user_id.
export async function POST(request: Request, { params }: Context) {
  const { requestId } = await params

  const auth = await requireApiAuth()
  if ("response" in auth) return auth.response

  try {
    const joinRequest = await getJoinRequestById({
      supabase: auth.serviceSupabase,
      requestId,
    })

    if (!joinRequest) {
      return NextResponse.json({ error: "Join request not found." }, { status: 404 })
    }

    if (joinRequest.student_user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own join requests." },
        { status: 403 }
      )
    }

    const cancelled = await cancelJoinRequest({
      supabase: auth.serviceSupabase,
      requestId,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId: joinRequest.school_id,
      actorUserId: auth.user.id,
      actorMembershipId: joinRequest.student_membership_id,
      eventType: "join_request.cancelled",
      targetType: "classroom_join_request",
      targetId: requestId,
      metadata: {},
    })

    return NextResponse.json({ joinRequest: cancelled })
  } catch (error) {
    console.error("cancelJoinRequest failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not cancel join request." }, { status: 500 })
  }
}
