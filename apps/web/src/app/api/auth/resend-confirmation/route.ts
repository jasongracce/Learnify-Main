import { authEmailRequestSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { authJsonError, authRedirectUrl } from "../_lib"

export async function POST(request: Request) {
  const parsed = authEmailRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return authJsonError("Enter a valid email address.")
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: authRedirectUrl({ request, locale: parsed.data.locale }),
    },
  })

  if (error) {
    return authJsonError(error.message)
  }

  return Response.json({
    ok: true,
    message: "We sent another confirmation email.",
  })
}
