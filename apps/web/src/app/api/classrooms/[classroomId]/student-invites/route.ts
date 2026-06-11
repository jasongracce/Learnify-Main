import { NextResponse } from "next/server"
import {
  getClassroomById,
  createClassroomStudentInvite,
  insertAuditEvent,
} from "@learnify/database"
import { sendStudentInvitesRequestSchema } from "@learnify/shared"
import type { ClassroomStudentInviteRecord } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ classroomId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { classroomId } = await params
  const body = await request.json().catch(() => null)
  const parsed = sendStudentInvitesRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { schoolId } = parsed.data
  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const classroom = await getClassroomById({
      supabase: auth.serviceSupabase,
      classroomId,
    })

    if (!classroom || classroom.school_id !== schoolId) {
      return NextResponse.json({ error: "Classroom not found." }, { status: 404 })
    }

    if (classroom.owner_membership_id !== auth.membership.id) {
      return NextResponse.json(
        { error: "Only the classroom owner can invite students." },
        { status: 403 }
      )
    }

    const results = await Promise.allSettled(
      parsed.data.emails.map(async (email) => {
        const { invite, rawToken } = await createClassroomStudentInvite({
          supabase: auth.serviceSupabase,
          schoolId,
          classroomId,
          email,
          invitedBy: auth.user.id,
        })
        return { email, invite, rawToken }
      })
    )

    type InviteResult = {
      email: string
      invite: ClassroomStudentInviteRecord
      rawToken: string
    }

    const succeeded = results
      .filter(
        (r): r is PromiseFulfilledResult<InviteResult> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value)

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r, i) => ({ email: parsed.data.emails[i], error: r.reason?.message ?? "Unknown error" }))

    if (succeeded.length > 0) {
      await insertAuditEvent({
        supabase: auth.serviceSupabase,
        schoolId,
        actorUserId: auth.user.id,
        actorMembershipId: auth.membership.id,
        eventType: "join_request.created",
        targetType: "classroom",
        targetId: classroomId,
        metadata: { emailCount: succeeded.length, source: "email_invite" },
      })
    }

    return NextResponse.json({ succeeded, failed }, { status: 201 })
  } catch (error) {
    console.error("sendStudentInvites failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not send student invites." }, { status: 500 })
  }
}
