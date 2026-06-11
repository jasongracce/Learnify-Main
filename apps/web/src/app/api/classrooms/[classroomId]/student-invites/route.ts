import { NextResponse } from "next/server"
import {
  getClassroomById,
  getSchoolById,
  getMembershipByEmailAndSchool,
  createPendingMembership,
  createClassroomStudentInvite,
  createJoinRequest,
  getOpenJoinRequestForEmail,
  insertAuditEvent,
} from "@learnify/database"
import { normalizeInviteEmail } from "@learnify/core"
import { sendStudentInvitesRequestSchema } from "@learnify/shared"
import type { ClassroomStudentInviteRecord } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"
import { inviteTokenResponse, sendInviteEmail } from "@/lib/email/invites"

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

    const school = await getSchoolById({
      supabase: auth.serviceSupabase,
      schoolId,
    })

    type InviteResult = {
      email: string
      invite: ClassroomStudentInviteRecord
      joinRequest: unknown
      inviteToken?: string
    }

    const results = await Promise.allSettled(
      parsed.data.emails.map(async (email): Promise<InviteResult> => {
        const emailNormalized = normalizeInviteEmail(email)
        const existingMembership = await getMembershipByEmailAndSchool({
          supabase: auth.serviceSupabase,
          emailNormalized,
          schoolId,
          role: "student",
        })
        const membership =
          existingMembership && existingMembership.status !== "removed"
            ? existingMembership
            : await createPendingMembership({
                supabase: auth.serviceSupabase,
                schoolId,
                emailNormalized,
                role: "student",
                invitedBy: auth.user.id,
              })

        const { invite, rawToken } = await createClassroomStudentInvite({
          supabase: auth.serviceSupabase,
          schoolId,
          classroomId,
          email,
          invitedBy: auth.user.id,
        })

        const existingJoinRequest = await getOpenJoinRequestForEmail({
          supabase: auth.serviceSupabase,
          classroomId,
          emailNormalized,
        })
        const joinRequest =
          existingJoinRequest ??
          (await createJoinRequest({
            supabase: auth.serviceSupabase,
            schoolId,
            classroomId,
            studentUserId: membership.user_id,
            studentMembershipId: membership.id,
            source: "email_invite",
            email,
            emailNormalized,
          }))

        await sendInviteEmail({
          to: email,
          token: rawToken,
          locale: parsed.data.locale,
          kind: "student",
          schoolName: school?.name,
          classroomName: classroom.name,
        })

        return {
          email,
          invite,
          joinRequest,
          ...inviteTokenResponse(rawToken),
        }
      })
    )

    const succeeded = results
      .filter(
        (r): r is PromiseFulfilledResult<InviteResult> =>
          r.status === "fulfilled"
      )
      .map((r) => r.value)

    const failed = results
      .map((result, index) => ({ result, email: parsed.data.emails[index] }))
      .filter(
        (entry): entry is { result: PromiseRejectedResult; email: string } =>
          entry.result.status === "rejected"
      )
      .map(({ result, email }) => ({
        email,
        error: result.reason?.message ?? "Unknown error",
      }))

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
