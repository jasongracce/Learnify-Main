import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  upsertStudentProfile,
  upsertWaitlistSignup,
} from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"

export function authJsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export function appUrl(request: Request, path: string) {
  return new URL(path, request.url).toString()
}

// Signup is open to anyone. We still record each registered email in
// beta_signups so the existing content/RAG RLS policies (which gate reads on
// beta_signups membership) keep working without a policy rewrite.
export async function ensureRegisteredAccess(input: {
  userId: string
  email: string
  locale: Locale
}) {
  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )

  await upsertWaitlistSignup({
    supabase: serviceSupabase,
    signup: { email: input.email, preferred_language: input.locale },
  })

  await upsertStudentProfile({
    supabase: serviceSupabase,
    userId: input.userId,
    locale: input.locale,
  })
}

export async function finishAuthenticatedAccess(input: {
  userId: string
  email: string
  locale: Locale
}) {
  await ensureRegisteredAccess(input)

  return NextResponse.json({
    ok: true,
    redirectTo: `/${input.locale}/app/dashboard`,
  })
}

export function authRedirectUrl(input: { request: Request; locale: Locale }) {
  return appUrl(input.request, `/auth/callback?locale=${input.locale}`)
}
