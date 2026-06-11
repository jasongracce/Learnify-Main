import { NextResponse } from "next/server"
import {
  createSchool,
  getSchoolBySlug,
  insertAuditEvent,
} from "@learnify/database"
import { createSchoolRequestSchema } from "@learnify/shared"
import { requireApiLearnifyAdmin } from "@/lib/auth/classrooms"

export async function POST(request: Request) {
  const parsed = createSchoolRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid school data.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const auth = await requireApiLearnifyAdmin()
  if ("response" in auth) return auth.response

  try {
    const existing = await getSchoolBySlug({
      supabase: auth.serviceSupabase,
      slug: parsed.data.slug,
    })

    if (existing) {
      return NextResponse.json(
        { error: "A school with this slug already exists." },
        { status: 409 }
      )
    }

    const school = await createSchool({
      supabase: auth.serviceSupabase,
      createdBy: auth.user.id,
      request: parsed.data,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId: school.id,
      actorUserId: auth.user.id,
      actorMembershipId: null,
      eventType: "school.created",
      targetType: "school",
      targetId: school.id,
      metadata: {
        name: school.name,
        slug: school.slug,
        adminSeatLimit: school.admin_seat_limit,
        teacherSeatLimit: school.teacher_seat_limit,
        studentSeatLimit: school.student_seat_limit,
      },
    })

    return NextResponse.json({ school }, { status: 201 })
  } catch (error) {
    console.error("createSchool failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not create school." }, { status: 500 })
  }
}
