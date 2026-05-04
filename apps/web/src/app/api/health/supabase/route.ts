import { NextResponse } from "next/server"
import {
  checkSupabaseWaitlistTable,
  createSupabaseServiceClientFromEnv,
  getSupabaseServerConfig,
} from "@learnify/database"

export async function GET() {
  const config = getSupabaseServerConfig(process.env)

  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        missing: config.missing,
      },
      { status: 503 }
    )
  }

  try {
    const supabase = createSupabaseServiceClientFromEnv(process.env)
    const result = await checkSupabaseWaitlistTable({ supabase })

    return NextResponse.json({
      ok: true,
      configured: true,
      source: "beta_signups",
      waitlistCount: result.waitlistCount,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error:
          error instanceof Error
            ? error.message
            : "Could not reach Supabase.",
      },
      { status: 500 }
    )
  }
}
