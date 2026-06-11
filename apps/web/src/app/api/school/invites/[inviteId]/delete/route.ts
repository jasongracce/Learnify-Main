import { NextResponse } from "next/server"
import {
  deleteSchoolInvite,
  insertAuditEvent,
} from "@learnify/database"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ inviteId: string }> }

// Invite delete/revoke — school admin only
// Body: { schoolId: string }
export async function POST(request: Request, { params }: Context) {
  const { inviteId } = await params
  const body = await request.json().catch(() => null)
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId : null

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

  const auth = await requireApiSchoolAccess(schoolId, "school_admin")
  if ("response" in auth) return auth.response

  try {
    // Fetch invite directly by id from the DB
    const { data: invite, error } = await auth.serviceSupabase
      .from("school_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("school_id", schoolId)
      .maybeSingle<{ id: string; status: string; email: string; role: string }>()

    if (error) throw new Error(error.message)

    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 })
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending invites can be deleted." },
        { status: 409 }
      )
    }

    const deleted = await deleteSchoolInvite({
      supabase: auth.serviceSupabase,
      inviteId,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "invite.deleted",
      targetType: "school_invite",
      targetId: inviteId,
      metadata: { email: invite.email, role: invite.role },
    })

    return NextResponse.json({ invite: deleted })
  } catch (error) {
    console.error("deleteInvite failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not delete invite." }, { status: 500 })
  }
}
