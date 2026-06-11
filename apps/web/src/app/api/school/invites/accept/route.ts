import { NextResponse } from "next/server"
import {
  getSchoolInviteByTokenHash,
  getMembershipByEmailAndSchool,
  activateMembership,
  markSchoolInviteAccepted,
  insertAuditEvent,
} from "@learnify/database"
import {
  normalizeInviteEmail,
  hashToken,
  validateInviteAcceptance,
} from "@learnify/core"
import { acceptInviteRequestSchema } from "@learnify/shared"
import { requireApiAuth } from "@/lib/auth/classrooms"

export async function POST(request: Request) {
  const parsed = acceptInviteRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const auth = await requireApiAuth()
  if ("response" in auth) return auth.response

  try {
    const tokenHash = hashToken(parsed.data.token)
    const invite = await getSchoolInviteByTokenHash({
      supabase: auth.serviceSupabase,
      tokenHash,
    })

    if (!invite) {
      return NextResponse.json({ error: "Invite not found or already used." }, { status: 404 })
    }

    const acceptingEmailNormalized = normalizeInviteEmail(auth.user.email!)
    const validation = validateInviteAcceptance({
      inviteEmailNormalized: invite.email_normalized,
      acceptingEmailNormalized,
      inviteStatus: invite.status,
      expiresAt: invite.expires_at,
    })

    if (!validation.valid) {
      const messages: Record<string, string> = {
        expired: "This invite has expired.",
        already_used: "This invite has already been accepted.",
        revoked: "This invite has been revoked.",
        email_mismatch: "This invite was sent to a different email address.",
      }
      return NextResponse.json(
        { error: messages[validation.reason] ?? "Invite is not valid." },
        { status: 422 }
      )
    }

    // Find the pending membership for this email/school/role
    const membership = await getMembershipByEmailAndSchool({
      supabase: auth.serviceSupabase,
      emailNormalized: acceptingEmailNormalized,
      schoolId: invite.school_id,
      role: invite.role,
    })

    if (!membership) {
      return NextResponse.json(
        { error: "No matching membership found for this invite." },
        { status: 404 }
      )
    }

    // Activate membership (handles seat capacity)
    const activated = await activateMembership({
      supabase: auth.serviceSupabase,
      membershipId: membership.id,
      userId: auth.user.id,
      schoolId: invite.school_id,
      role: invite.role,
    })

    await markSchoolInviteAccepted({
      supabase: auth.serviceSupabase,
      inviteId: invite.id,
      acceptedBy: auth.user.id,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId: invite.school_id,
      actorUserId: auth.user.id,
      actorMembershipId: activated.id,
      eventType: activated.status === "active" ? "membership.activated" : "membership.pending_capacity",
      targetType: "school_membership",
      targetId: activated.id,
      metadata: { role: invite.role, status: activated.status },
    })

    return NextResponse.json({ membership: activated })
  } catch (error) {
    console.error("acceptInvite failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not accept invite." }, { status: 500 })
  }
}
