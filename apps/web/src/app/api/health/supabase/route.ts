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
    console.error("Supabase health check is not configured", {
      missing: config.missing,
    })

    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "Supabase health check is unavailable.",
      },
      { status: 503 }
    )
  }

  try {
    const supabase = createSupabaseServiceClientFromEnv(
      requireSupabaseServiceEnv()
    )
    await checkSupabaseWaitlistTable({ supabase })

    return NextResponse.json({
      ok: true,
      configured: true,
      source: "beta_signups",
    })
  } catch (error) {
    console.error("Supabase health check failed", {
      error: error instanceof Error ? error.message : error,
    })

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: "Could not reach Supabase.",
      },
      { status: 500 }
    )
  }
}
