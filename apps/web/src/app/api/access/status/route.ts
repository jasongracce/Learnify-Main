import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  getSupabaseServerConfig,
  getWaitlistAccessByEmail,
} from "@learnify/database"
import { accessStatusQuerySchema } from "@learnify/shared"

export async function GET(request: Request) {
  const config = getSupabaseServerConfig(process.env)

  if (!config.configured) {
    return NextResponse.json(
      {
        error: "Supabase is not configured.",
        missing: config.missing,
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
    const supabase = createSupabaseServiceClientFromEnv(process.env)
    const status = await getWaitlistAccessByEmail({
      supabase,
      email: parsed.data.email,
    })

    return NextResponse.json({
      status,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not check access status.",
      },
      { status: 500 }
    )
  }
}
