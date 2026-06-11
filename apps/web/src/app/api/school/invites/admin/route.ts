import { NextResponse } from "next/server"
import {
  getSchoolSeatSummary,
  getMembershipByEmailAndSchool,
  createPendingMembership,
  createSchoolInvite,
  insertAuditEvent,
} from "@learnify/database"
import { normalizeInviteEmail, checkAdminSeatCapacity } from "@learnify/core"
import { inviteSchoolAdminRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = inviteSchoolAdminRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invite data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { schoolId } = parsed.data
  const auth = await requireApiSchoolAccess(schoolId, "school_admin")
  if ("response" in auth) return auth.response

  try {
    const emailNormalized = normalizeInviteEmail(parsed.data.email)

    const existing = await getMembershipByEmailAndSchool({
      supabase: auth.serviceSupabase,
      emailNormalized,
      schoolId,
      role: "school_admin",
    })

    if (existing && (existing.status === "active" || existing.status === "invited")) {
      return NextResponse.json(
        { error: "This email already has a school admin membership or pending invite." },
        { status: 409 }
      )
    }

    const summary = await getSchoolSeatSummary({
      supabase: auth.serviceSupabase,
      schoolId,
    })

    const capacity = checkAdminSeatCapacity(summary)
    if (!capacity.allowed) {
      return NextResponse.json(
        { error: "No admin seats available." },
        { status: 422 }
      )
    }

    const membership = await createPendingMembership({
      supabase: auth.serviceSupabase,
      schoolId,
      emailNormalized,
      role: "school_admin",
      invitedBy: auth.user.id,
    })

    const { invite, rawToken } = await createSchoolInvite({
      supabase: auth.serviceSupabase,
      schoolId,
      email: parsed.data.email,
      role: "school_admin",
      invitedBy: auth.user.id,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "school_admin.invited",
      targetType: "school_invite",
      targetId: invite.id,
      metadata: { email: parsed.data.email },
    })

    return NextResponse.json({ invite, membership, inviteToken: rawToken }, { status: 201 })
  } catch (error) {
    console.error("sendAdminInvite failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not send admin invite." }, { status: 500 })
  }
}
