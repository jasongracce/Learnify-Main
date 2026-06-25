import { redirect } from "next/navigation"
import {
  createSupabaseServiceClientFromEnv,
  getWaitlistAccessByEmail,
} from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"
import {
  createSupabaseServerClient,
  hasSupabaseAuthCookie,
} from "@/lib/supabase/server"

export async function requireBetaUser(locale: Locale) {
  if (!(await hasSupabaseAuthCookie())) {
    redirect(`/${locale}/auth/login`)
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    redirect(`/${locale}/auth/login`)
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
    redirect(`/${locale}/waitlist`)
  }

  return user
}
