import { NextResponse } from "next/server"
import { localeSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const url = new URL(request.url)
  const locale = localeSchema
    .catch("en")
    .parse(url.searchParams.get("locale") ?? "en")
  const supabase = await createSupabaseServerClient()

  await supabase.auth.signOut()

  return NextResponse.json({
    ok: true,
    redirectTo: `/${locale}/auth/login`,
  })
}
