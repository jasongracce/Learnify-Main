import { NextResponse } from "next/server"
import { localeSchema, physicsFoundationsCourse } from "@learnify/shared"
import { requireApiBetaUser } from "@/lib/auth/api"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = localeSchema
    .catch("en")
    .parse(url.searchParams.get("locale") ?? "en")
  const auth = await requireApiBetaUser(locale)

  if ("response" in auth) {
    return auth.response
  }

  return NextResponse.json({
    courses: [physicsFoundationsCourse].filter(
      (course) => course.status === "published"
    ),
  })
}
