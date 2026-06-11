import { NextResponse } from "next/server"
import {
  getSchoolById,
  getMembershipByEmailAndSchool,
  createPendingMembership,
  createSchoolInvite,
  insertAuditEvent,
} from "@learnify/database"
import { normalizeInviteEmail } from "@learnify/core"
import { sendSchoolAdminInviteRequestSchema } from "@learnify/shared"
import { requireApiLearnifyAdmin } from "@/lib/auth/classrooms"
import { inviteTokenResponse, sendInviteEmail } from "@/lib/email/invites"

type Context = { params: Promise<{ schoolId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { schoolId } = await params

  const parsed = sendSchoolAdminInviteRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invite data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const auth = await requireApiLearnifyAdmin()
  if ("response" in auth) return auth.response

  try {
    const school = await getSchoolById({
      supabase: auth.serviceSupabase,
      schoolId,
    })

    if (!school) {
      return NextResponse.json({ error: "School not found." }, { status: 404 })
    }

    const emailNormalized = normalizeInviteEmail(parsed.data.email)

    // Check for existing active/invited membership
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

    // Create pending membership
    const membership = await createPendingMembership({
      supabase: auth.serviceSupabase,
      schoolId,
      emailNormalized,
      role: "school_admin",
      invitedBy: auth.user.id,
    })

    // Create invite token
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
      actorMembershipId: null,
      eventType: "school_admin.invited",
      targetType: "school_invite",
      targetId: invite.id,
      metadata: { email: parsed.data.email, role: "school_admin" },
    })

    await sendInviteEmail({
      to: parsed.data.email,
      token: rawToken,
      locale: parsed.data.locale,
      kind: "school_admin",
      schoolName: school.name,
    })

    return NextResponse.json(
      {
        invite,
        membership,
        ...inviteTokenResponse(rawToken),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("sendSchoolAdminInvite failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not send school admin invite." }, { status: 500 })
  }
}
