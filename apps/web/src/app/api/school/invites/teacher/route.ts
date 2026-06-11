import { NextResponse } from "next/server"
import {
  getMembershipByEmailAndSchool,
  createPendingMembership,
  createSchoolInvite,
  insertAuditEvent,
} from "@learnify/database"
import { normalizeInviteEmail } from "@learnify/core"
import { sendTeacherInviteRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = sendTeacherInviteRequestSchema.safeParse(body)

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

    // Check for duplicate
    const existing = await getMembershipByEmailAndSchool({
      supabase: auth.serviceSupabase,
      emailNormalized,
      schoolId,
      role: "teacher",
    })

    if (existing && (existing.status === "active" || existing.status === "invited")) {
      return NextResponse.json(
        { error: "This email already has a teacher membership or pending invite." },
        { status: 409 }
      )
    }

    const membership = await createPendingMembership({
      supabase: auth.serviceSupabase,
      schoolId,
      emailNormalized,
      role: "teacher",
      invitedBy: auth.user.id,
    })

    const { invite, rawToken } = await createSchoolInvite({
      supabase: auth.serviceSupabase,
      schoolId,
      email: parsed.data.email,
      role: "teacher",
      invitedBy: auth.user.id,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "teacher.invited",
      targetType: "school_invite",
      targetId: invite.id,
      metadata: { email: parsed.data.email },
    })

    return NextResponse.json({ invite, membership, inviteToken: rawToken }, { status: 201 })
  } catch (error) {
    console.error("sendTeacherInvite failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not send teacher invite." }, { status: 500 })
  }
}
