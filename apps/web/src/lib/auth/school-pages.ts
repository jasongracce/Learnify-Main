import { redirect } from "next/navigation"
import {
  createSupabaseServiceClientFromEnv,
  getMembershipByUserAndSchool,
  listCurrentSchoolMemberships,
} from "@learnify/database"
import type { Locale, SchoolMembershipRecord, SchoolMembershipRole } from "@learnify/shared"
import { requireSupabaseServiceEnv } from "@/lib/env"
import {
  createSupabaseServerClient,
  hasSupabaseAuthCookie,
} from "@/lib/supabase/server"

export async function requireSchoolPageUser(locale: Locale) {
  if (!(await hasSupabaseAuthCookie())) redirect(`/${locale}/auth/login`)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) redirect(`/${locale}/auth/login`)

  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )

  return { serviceSupabase, user }
}

export async function requireLearnifyAdminPage(locale: Locale) {
  const auth = await requireSchoolPageUser(locale)
  const { data: profile } = await auth.serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single<{ role: string }>()

  if (profile?.role !== "admin") redirect(`/${locale}/app/dashboard`)
  return auth
}

export async function getPreferredSchoolMembership(input: {
  locale: Locale
  roles: SchoolMembershipRole[]
}): Promise<{
  serviceSupabase: ReturnType<typeof createSupabaseServiceClientFromEnv>
  user: Awaited<ReturnType<typeof requireSchoolPageUser>>["user"]
  membership: SchoolMembershipRecord
}> {
  const auth = await requireSchoolPageUser(input.locale)
  const memberships = await listCurrentSchoolMemberships({
    supabase: auth.serviceSupabase,
    userId: auth.user.id,
  })
  const membership = memberships.find(
    (item) => item.status === "active" && input.roles.includes(item.role)
  )

  if (!membership) redirect(`/${input.locale}/app/dashboard`)
  return { ...auth, membership }
}

export async function requireSchoolMembershipPage(input: {
  locale: Locale
  schoolId: string
  roles: SchoolMembershipRole[]
}) {
  const auth = await requireSchoolPageUser(input.locale)

  for (const role of input.roles) {
    const membership = await getMembershipByUserAndSchool({
      supabase: auth.serviceSupabase,
      schoolId: input.schoolId,
      userId: auth.user.id,
      role,
    })

    if (membership?.status === "active") {
      return { ...auth, membership }
    }
  }

  redirect(`/${input.locale}/app/dashboard`)
}
