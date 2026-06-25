import { NextResponse } from "next/server"
import { listStudentAssignments } from "@learnify/database"
import { requireApiAuth } from "@/lib/auth/classrooms"

export async function GET() {
  const auth = await requireApiAuth()
  if ("response" in auth) return auth.response

  try {
    const assignments = await listStudentAssignments({
      supabase: auth.serviceSupabase,
      studentUserId: auth.user.id,
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("listStudentAssignments failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { error: "Could not list assignments." },
      { status: 500 }
    )
  }
}
