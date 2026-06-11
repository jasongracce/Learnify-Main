import { NextResponse } from "next/server"
import { getSchoolById, listAuditEventsForSchool } from "@learnify/database"
import { requireApiLearnifyAdmin } from "@/lib/auth/classrooms"

type Context = { params: Promise<{ schoolId: string }> }

export async function GET(request: Request, { params }: Context) {
  const { schoolId } = await params
  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200)
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0)

  const auth = await requireApiLearnifyAdmin()
  if ("response" in auth) return auth.response

  try {
    const school = await getSchoolById({
      supabase: auth.serviceSupabase,
      schoolId,
    })

    if (!school) {
      return NextResponse.json({ error: "School not found." }, { status: 404 })
    }

    const events = await listAuditEventsForSchool({
      supabase: auth.serviceSupabase,
      schoolId,
      limit,
      offset,
    })

    return NextResponse.json({ events, school })
  } catch (error) {
    console.error("listAuditEvents failed", {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ error: "Could not fetch audit events." }, { status: 500 })
  }
}
