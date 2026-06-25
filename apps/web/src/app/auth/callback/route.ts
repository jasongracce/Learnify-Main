import { NextResponse } from "next/server"
import { localeSchema } from "@learnify/shared"
import { ensureRegisteredAccess, getDefaultAppRedirect } from "@/app/api/auth/_lib"
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

  await ensureRegisteredAccess({
    userId: user.id,
    email: user.email,
    locale,
  })
  const redirectTo = await getDefaultAppRedirect({ userId: user.id, locale })

  return NextResponse.redirect(new URL(redirectTo, request.url))
}
