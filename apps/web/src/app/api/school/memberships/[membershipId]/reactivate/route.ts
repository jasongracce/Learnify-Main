import { NextResponse } from "next/server"
import {
  getMembershipById,
  reactivateMembership,
  insertAuditEvent,
} from "@learnify/database"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ membershipId: string }> }

// Body: { schoolId: string }
export async function POST(request: Request, { params }: Context) {
  const { membershipId } = await params
  const body = await request.json().catch(() => null)
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId : null

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

  const auth = await requireApiSchoolAccess(schoolId, "school_admin")
  if ("response" in auth) return auth.response

  try {
    const target = await getMembershipById({
      supabase: auth.serviceSupabase,
      membershipId,
    })

    if (!target || target.school_id !== schoolId) {
      return NextResponse.json({ error: "Membership not found." }, { status: 404 })
    }

    const reactivated = await reactivateMembership({
      supabase: auth.serviceSupabase,
      membershipId,
      userId: target.user_id!,
      schoolId,
      role: target.role,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: reactivated.status === "active" ? "membership.activated" : "membership.pending_capacity",
      targetType: "school_membership",
      targetId: membershipId,
      metadata: { role: target.role, status: reactivated.status },
    })

    return NextResponse.json({ membership: reactivated })
  } catch (error) {
    console.error("reactivateMembership failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not reactivate membership." }, { status: 500 })
  }
}
