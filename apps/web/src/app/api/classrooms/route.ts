import { NextResponse } from "next/server"
import {
  createClassroom,
  listClassroomsForTeacher,
  insertAuditEvent,
} from "@learnify/database"
import { createClassroomRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"
import { appUrl } from "@/lib/site"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = createClassroomRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid classroom data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { schoolId } = parsed.data
  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const { classroom, rawJoinToken } = await createClassroom({
      supabase: auth.serviceSupabase,
      schoolId,
      ownerMembershipId: auth.membership.id,
      request: parsed.data,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "classroom.created",
      targetType: "classroom",
      targetId: classroom.id,
      metadata: {
        name: classroom.name,
        slug: classroom.slug,
        subjectLabel: classroom.subject_label,
      },
    })

    return NextResponse.json(
      {
        classroom,
        joinToken: rawJoinToken,
        joinUrl: `${appUrl}/${parsed.data.locale}/app/join/${rawJoinToken}`,
        qrAvailable: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("createClassroom failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not create classroom." }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const schoolId = url.searchParams.get("schoolId")

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const classrooms = await listClassroomsForTeacher({
      supabase: auth.serviceSupabase,
      ownerMembershipId: auth.membership.id,
    })

    return NextResponse.json({ classrooms })
  } catch (error) {
    console.error("listClassrooms failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not list classrooms." }, { status: 500 })
  }
}
