import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  upsertWaitlistSignup,
} from "@learnify/database"
import { waitlistSignupSchema } from "@learnify/shared"
import {
  getSupabaseServiceEnvStatus,
  requireSupabaseServiceEnv,
} from "@/lib/env"

export async function POST(request: Request) {
  const config = getSupabaseServiceEnvStatus()

  if (!config.configured) {
    console.error("Waitlist API Supabase config is missing", {
      missing: config.missing,
    })

    return NextResponse.json(
      {
        error: "Could not save waitlist signup.",
      },
      { status: 503 }
    )
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = waitlistSignupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid waitlist signup.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  try {
    const supabase = createSupabaseServiceClientFromEnv(
      requireSupabaseServiceEnv()
    )
    const signup = await upsertWaitlistSignup({
      supabase,
      signup: parsed.data,
    })

    return NextResponse.json({
      status: "approved",
      email: signup.email,
    })
  } catch (error) {
    console.error("Waitlist signup failed", {
      error: error instanceof Error ? error.message : error,
    })

    return NextResponse.json(
      {
        error: "Could not save waitlist signup.",
      },
      { status: 500 }
    )
  }
}
