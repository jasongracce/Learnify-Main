import { NextResponse } from "next/server"
import {
  getClassroomByJoinTokenHash,
  getMembershipByUserAndSchool,
  getOpenJoinRequestForStudent,
  createJoinRequest,
  insertAuditEvent,
} from "@learnify/database"
import { normalizeInviteEmail, hashToken } from "@learnify/core"
import { joinByTokenRequestSchema } from "@learnify/shared"
import { requireApiAuth } from "@/lib/auth/classrooms"

export async function POST(request: Request) {
  const parsed = joinByTokenRequestSchema.safeParse(
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
    const tokenHash = hashToken(parsed.data.joinToken)
    const classroom = await getClassroomByJoinTokenHash({
      supabase: auth.serviceSupabase,
      tokenHash,
    })

    if (!classroom || !classroom.join_enabled || classroom.status !== "active") {
      return NextResponse.json(
        { error: "Invalid or disabled join link." },
        { status: 404 }
      )
    }

    const schoolId = classroom.school_id

    const membership = await getMembershipByUserAndSchool({
      supabase: auth.serviceSupabase,
      userId: auth.user.id,
      schoolId,
      role: "student",
    })

    const openRequest = await getOpenJoinRequestForStudent({
      supabase: auth.serviceSupabase,
      classroomId: classroom.id,
      studentUserId: auth.user.id,
    })

    if (openRequest) {
      return NextResponse.json(
        { error: "You already have a pending join request for this classroom." },
        { status: 409 }
      )
    }

    const emailNormalized = normalizeInviteEmail(auth.user.email!)

    const joinRequest = await createJoinRequest({
      supabase: auth.serviceSupabase,
      schoolId,
      classroomId: classroom.id,
      studentUserId: auth.user.id,
      studentMembershipId: membership?.id ?? null,
      source: "qr",
      email: auth.user.email!,
      emailNormalized,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: membership?.id ?? null,
      eventType: "join_request.created",
      targetType: "classroom_join_request",
      targetId: joinRequest.id,
      metadata: { source: "qr", classroomId: classroom.id },
    })

    return NextResponse.json({ joinRequest }, { status: 201 })
  } catch (error) {
    console.error("joinByToken failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not process join request." }, { status: 500 })
  }
}
