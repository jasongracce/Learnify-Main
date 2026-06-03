import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  getWaitlistAccessByEmail,
} from "@learnify/database"
import { accessStatusQuerySchema } from "@learnify/shared"
import {
  getSupabaseServiceEnvStatus,
  requireSupabaseServiceEnv,
} from "@/lib/env"

export async function GET(request: Request) {
  const config = getSupabaseServiceEnvStatus()

  if (!config.configured) {
    console.error("Access status API Supabase config is missing", {
      missing: config.missing,
    })

    return NextResponse.json(
      {
        error: "Could not check access status.",
      },
      { status: 503 }
    )
  }

  const url = new URL(request.url)
  const parsed = accessStatusQuerySchema.safeParse({
    email: url.searchParams.get("email"),
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "A valid email query parameter is required.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  try {
    const supabase = createSupabaseServiceClientFromEnv(
      requireSupabaseServiceEnv()
    )
    const status = await getWaitlistAccessByEmail({
      supabase,
      email: parsed.data.email,
    })

    return NextResponse.json({
      status,
    })
  } catch (error) {
    console.error("Access status check failed", {
      error: error instanceof Error ? error.message : error,
    })

    return NextResponse.json(
      {
        error: "Could not check access status.",
      },
      { status: 500 }
    )
  }
}
