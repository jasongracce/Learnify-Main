import { authEmailRequestSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  authJsonError,
  authRedirectUrl,
  requireApprovedBetaEmail,
} from "../_lib"

export async function POST(request: Request) {
  const parsed = authEmailRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return authJsonError("Enter a valid email.")
  }

  const blocked = await requireApprovedBetaEmail({
    email: parsed.data.email,
    locale: parsed.data.locale,
  })

  if (blocked) {
    return blocked
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: authRedirectUrl({ request, payload: parsed.data }),
    },
  })

  if (error) {
    return authJsonError(error.message)
  }

  return Response.json({
    ok: true,
    status: "check_email",
    message: "Check your email for a Learnify sign-in link.",
  })
}
