import { NextResponse } from "next/server"
import {
  attachSchoolIdentityByEmail,
  createSupabaseServiceClientFromEnv,
  listCurrentSchoolMemberships,
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

  await attachSchoolIdentityByEmail({
    supabase: serviceSupabase,
    email: input.email,
    userId: input.userId,
  })
}

export async function finishAuthenticatedAccess(input: {
  userId: string
  email: string
  locale: Locale
}) {
  await ensureRegisteredAccess(input)
  const redirectTo = await getDefaultAppRedirect({
    userId: input.userId,
    locale: input.locale,
  })

  return NextResponse.json({
    ok: true,
    redirectTo,
  })
}

export async function getDefaultAppRedirect(input: {
  userId: string
  locale: Locale
}) {
  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )

  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", input.userId)
    .maybeSingle<{ role: string }>()

  if (profile?.role === "admin") {
    return `/${input.locale}/app/admin/schools`
  }

  const memberships = await listCurrentSchoolMemberships({
    supabase: serviceSupabase,
    userId: input.userId,
  })
  const activeMemberships = memberships.filter((item) => item.status === "active")

  if (activeMemberships.some((item) => item.role === "school_admin")) {
    return `/${input.locale}/app/school`
  }

  if (activeMemberships.some((item) => item.role === "teacher")) {
    return `/${input.locale}/app/classrooms`
  }

  return `/${input.locale}/app/dashboard`
}

export function authRedirectUrl(input: { request: Request; locale: Locale }) {
  return appUrl(input.request, `/auth/callback?locale=${input.locale}`)
}
