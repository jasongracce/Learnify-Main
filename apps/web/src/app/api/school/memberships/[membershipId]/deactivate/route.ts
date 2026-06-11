import { NextResponse } from "next/server"
import {
  getMembershipById,
  deactivateMembership,
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

    // Prevent self-deactivation
    if (target.user_id === auth.user.id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own membership." },
        { status: 422 }
      )
    }

    const deactivated = await deactivateMembership({
      supabase: auth.serviceSupabase,
      membershipId,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "membership.deactivated",
      targetType: "school_membership",
      targetId: membershipId,
      metadata: { role: target.role },
    })

    return NextResponse.json({ membership: deactivated })
  } catch (error) {
    console.error("deactivateMembership failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not deactivate membership." }, { status: 500 })
  }
}
