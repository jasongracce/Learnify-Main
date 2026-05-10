import { NextResponse } from "next/server"
import {
  createSupabaseServiceClientFromEnv,
  getWaitlistAccessByEmail,
  upsertStudentProfile,
} from "@learnify/database"
import { localeSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const locale = localeSchema
    .catch("en")
    .parse(requestUrl.searchParams.get("locale") ?? "en")

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  const authSupabase = await createSupabaseServerClient()
  const { error } = await authSupabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  const serviceSupabase = createSupabaseServiceClientFromEnv(process.env)
  const access = await getWaitlistAccessByEmail({
    supabase: serviceSupabase,
    email: user.email,
  })

  if (access !== "approved") {
    await authSupabase.auth.signOut()
    return NextResponse.redirect(new URL(`/${locale}/waitlist`, request.url))
  }

  await upsertStudentProfile({
    supabase: serviceSupabase,
    userId: user.id,
    locale,
  })

  return NextResponse.redirect(
    new URL(`/${locale}/app/dashboard`, request.url)
  )
}
