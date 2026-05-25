import { NextResponse } from "next/server"
import {
  checkSupabaseWaitlistTable,
  createSupabaseServiceClientFromEnv,
} from "@learnify/database"
import {
  getSupabaseServiceEnvStatus,
  requireSupabaseServiceEnv,
} from "@/lib/env"

export async function GET() {
  const config = getSupabaseServiceEnvStatus()

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
    const supabase = createSupabaseServiceClientFromEnv(
      requireSupabaseServiceEnv()
    )
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
