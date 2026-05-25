import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  getWaitlistAccessByEmail,
  upsertStudentProfile,
} from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function requireApiBetaUser(locale: Locale) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return {
      response: NextResponse.json(
        {
          error: "Authentication is required.",
          redirectTo: `/${locale}/auth/login`,
        },
        { status: 401 }
      ),
    }
  }

  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )
  const access = await getWaitlistAccessByEmail({
    supabase: serviceSupabase,
    email: user.email,
  })

  if (access !== "approved") {
    await supabase.auth.signOut()

    return {
      response: NextResponse.json(
        {
          error: "This email is not approved for the private beta yet.",
          redirectTo: `/${locale}/waitlist`,
        },
        { status: 403 }
      ),
    }
  }

  await upsertStudentProfile({
    supabase: serviceSupabase,
    userId: user.id,
    locale,
  })

  return {
    supabase,
    user,
  }
}
