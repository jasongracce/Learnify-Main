import { NextResponse } from "next/server"
import {
  attachUserToJoinRequest,
  attachUserToMembership,
  createJoinRequest,
  createPendingMembership,
  getClassroomStudentInviteByTokenHash,
  getMembershipByEmailAndSchool,
  getOpenJoinRequestForEmail,
  insertAuditEvent,
  markClassroomStudentInviteAccepted,
} from "@learnify/database"
import {
  hashToken,
  normalizeInviteEmail,
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
    const invite = await getClassroomStudentInviteByTokenHash({
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

    const existingMembership = await getMembershipByEmailAndSchool({
      supabase: auth.serviceSupabase,
      emailNormalized: acceptingEmailNormalized,
      schoolId: invite.school_id,
      role: "student",
    })

    if (existingMembership?.user_id && existingMembership.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "This school membership belongs to a different account." },
        { status: 422 }
      )
    }

    const membership =
      existingMembership && existingMembership.status !== "removed"
        ? existingMembership.user_id
          ? existingMembership
          : await attachUserToMembership({
              supabase: auth.serviceSupabase,
              membershipId: existingMembership.id,
              userId: auth.user.id,
            })
        : await createPendingMembership({
            supabase: auth.serviceSupabase,
            schoolId: invite.school_id,
            emailNormalized: acceptingEmailNormalized,
            role: "student",
            invitedBy: invite.invited_by,
            userId: auth.user.id,
          })

    const existingJoinRequest = await getOpenJoinRequestForEmail({
      supabase: auth.serviceSupabase,
      classroomId: invite.classroom_id,
      emailNormalized: acceptingEmailNormalized,
    })

    const joinRequest = existingJoinRequest
      ? existingJoinRequest.student_user_id === auth.user.id &&
        existingJoinRequest.student_membership_id === membership.id
        ? existingJoinRequest
        : await attachUserToJoinRequest({
            supabase: auth.serviceSupabase,
            requestId: existingJoinRequest.id,
            studentUserId: auth.user.id,
            studentMembershipId: membership.id,
          })
      : await createJoinRequest({
          supabase: auth.serviceSupabase,
          schoolId: invite.school_id,
          classroomId: invite.classroom_id,
          studentUserId: auth.user.id,
          studentMembershipId: membership.id,
          source: "email_invite",
          email: invite.email,
          emailNormalized: invite.email_normalized,
        })

    const acceptedInvite = await markClassroomStudentInviteAccepted({
      supabase: auth.serviceSupabase,
      inviteId: invite.id,
      acceptedBy: auth.user.id,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId: invite.school_id,
      actorUserId: auth.user.id,
      actorMembershipId: membership.id,
      eventType: "join_request.created",
      targetType: "classroom_join_request",
      targetId: joinRequest.id,
      metadata: { source: "email_invite", inviteId: acceptedInvite.id },
    })

    return NextResponse.json({
      invite: acceptedInvite,
      joinRequest,
      message: "Your request is pending approval.",
    })
  } catch (error) {
    console.error("acceptClassroomStudentInvite failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not accept invite." }, { status: 500 })
  }
}
