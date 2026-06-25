import { NextResponse } from "next/server"
import {
  createAssignmentDraft,
  insertAuditEvent,
  listAssignmentsForClassroom,
} from "@learnify/database"
import { createAssignmentDraftRequestSchema } from "@learnify/shared"
import { requireApiSchoolAccess } from "@/lib/auth/classrooms"
import {
  assignmentAuditMetadata,
  requireOwnedClassroom,
} from "@/app/api/assignments/_lib"

type Context = { params: Promise<{ classroomId: string }> }

export async function POST(request: Request, { params }: Context) {
  const { classroomId } = await params
  const body = await request.json().catch(() => null)

  if (
    body &&
    typeof body === "object" &&
    "classroomId" in body &&
    body.classroomId !== classroomId
  ) {
    return NextResponse.json(
      { error: "classroomId must match the route." },
      { status: 400 }
    )
  }

  const parsed = createAssignmentDraftRequestSchema.safeParse({
    ...(body && typeof body === "object" ? body : {}),
    classroomId,
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid assignment data.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { schoolId } = parsed.data
  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const classroomCheck = await requireOwnedClassroom({
      supabase: auth.serviceSupabase,
      classroomId,
      schoolId,
      membership: auth.membership,
    })
    if ("response" in classroomCheck) return classroomCheck.response

    const assignment = await createAssignmentDraft({
      supabase: auth.serviceSupabase,
      createdBy: auth.user.id,
      request: parsed.data,
    })

    await insertAuditEvent({
      supabase: auth.serviceSupabase,
      schoolId,
      actorUserId: auth.user.id,
      actorMembershipId: auth.membership.id,
      eventType: "assignment.created",
      targetType: "assignment",
      targetId: assignment.assignment.id,
      metadata: assignmentAuditMetadata({
        classroomId,
        assignmentType: assignment.assignment.assignment_type,
        status: assignment.assignment.status,
      }),
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error("createAssignmentDraft failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not create assignment." },
      { status: 500 }
    )
  }
}

export async function GET(request: Request, { params }: Context) {
  const { classroomId } = await params
  const url = new URL(request.url)
  const schoolId = url.searchParams.get("schoolId")

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required." }, { status: 400 })
  }

  const auth = await requireApiSchoolAccess(schoolId, "teacher")
  if ("response" in auth) return auth.response

  try {
    const classroomCheck = await requireOwnedClassroom({
      supabase: auth.serviceSupabase,
      classroomId,
      schoolId,
      membership: auth.membership,
    })
    if ("response" in classroomCheck) return classroomCheck.response

    const assignments = await listAssignmentsForClassroom({
      supabase: auth.serviceSupabase,
      classroomId,
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("listAssignmentsForClassroom failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not list assignments." },
      { status: 500 }
    )
  }
}
