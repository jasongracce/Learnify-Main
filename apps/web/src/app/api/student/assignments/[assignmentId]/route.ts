import { NextResponse } from "next/server"
import { getStudentAssignmentDetail } from "@learnify/database"
import { requireApiAuth } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ assignmentId: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { assignmentId } = await params
  const auth = await requireApiAuth()
  if ("response" in auth) return auth.response

  try {
    const assignment = await getStudentAssignmentDetail({
      supabase: auth.serviceSupabase,
      assignmentId,
      studentUserId: auth.user.id,
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      )
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error("getStudentAssignmentDetail failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not load assignment." },
      { status: 500 }
    )
  }
}
