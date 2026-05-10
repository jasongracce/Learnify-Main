import { NextResponse } from "next/server"
import { localeSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = localeSchema
    .catch("en")
    .parse(url.searchParams.get("locale") ?? "en")
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL(`/auth/callback?locale=${locale}`, request.url).toString(),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  return NextResponse.redirect(data.url)
}
