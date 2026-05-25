import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  getWaitlistAccessByEmail,
  upsertStudentProfile,
} from "@learnify/database"
import type { AuthEmailRequestInput, Locale } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export function authJsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export function appUrl(request: Request, path: string) {
  return new URL(path, request.url).toString()
}

export async function finishAuthenticatedAccess(input: {
  request: Request
  userId: string
  email: string
  locale: Locale
}) {
  const authSupabase = await createSupabaseServerClient()
  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )
  const access = await getWaitlistAccessByEmail({
    supabase: serviceSupabase,
    email: input.email,
  })

  if (access !== "approved") {
    await authSupabase.auth.signOut()

    return NextResponse.json(
      {
        error: "This email is not approved for the private beta yet.",
        redirectTo: `/${input.locale}/waitlist`,
      },
      { status: 403 }
    )
  }

  await upsertStudentProfile({
    supabase: serviceSupabase,
    userId: input.userId,
    locale: input.locale,
  })

  return NextResponse.json({
    ok: true,
    redirectTo: `/${input.locale}/app/dashboard`,
  })
}

export function authRedirectUrl(input: {
  request: Request
  payload: AuthEmailRequestInput
}) {
  return appUrl(input.request, `/auth/callback?locale=${input.payload.locale}`)
}

export async function requireApprovedBetaEmail(input: {
  email: string
  locale: Locale
}) {
  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )
  const access = await getWaitlistAccessByEmail({
    supabase: serviceSupabase,
    email: input.email,
  })

  if (access === "approved") {
    return null
  }

  return NextResponse.json(
    {
      error: "This email is not on the private beta list yet.",
      redirectTo: `/${input.locale}/waitlist`,
    },
    { status: 403 }
  )
}
