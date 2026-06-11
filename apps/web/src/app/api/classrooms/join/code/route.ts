import { NextResponse } from "next/server"
import {
  getClassroomByJoinCode,
  getMembershipByUserAndSchool,
  getOpenJoinRequestForStudent,
  createJoinRequest,
  insertAuditEvent,
} from "@learnify/database"
import { normalizeInviteEmail } from "@learnify/core"
import { joinByCodeRequestSchema } from "@learnify/shared"
import { requireApiAuth } from "@/lib/auth/classrooms"

export async function POST(request: Request) {
  const parsed = joinByCodeRequestSchema.safeParse(
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
    const classroom = await getClassroomByJoinCode({
      supabase: auth.serviceSupabase,
      joinCode: parsed.data.joinCode,
    })

    if (!classroom || !classroom.join_enabled || classroom.status !== "active") {
      return NextResponse.json(
        { error: "Invalid or disabled join code." },
        { status: 404 }
      )
    }

    const schoolId = classroom.school_id

    // Get or create school membership for student
    const membership = await getMembershipByUserAndSchool({
      supabase: auth.serviceSupabase,
      userId: auth.user.id,
      schoolId,
      role: "student",
    })

    // Check for duplicate open request
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
      source: "code",
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
      metadata: { source: "code", classroomId: classroom.id },
    })

    return NextResponse.json({ joinRequest }, { status: 201 })
  } catch (error) {
    console.error("joinByCode failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not process join request." }, { status: 500 })
  }
}
