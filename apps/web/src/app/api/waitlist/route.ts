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
    return NextResponse.json(
      {
        error: "Supabase is not configured.",
        missing: config.missing,
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save waitlist signup.",
      },
      { status: 500 }
    )
  }
}
