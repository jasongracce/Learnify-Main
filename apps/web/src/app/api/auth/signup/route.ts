import { authPasswordRequestSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { authJsonError, authRedirectUrl, authUnexpectedError } from "../_lib"

export async function POST(request: Request) {
  try {
    const parsed = authPasswordRequestSchema.safeParse(
      await request.json().catch(() => null)
    )

    if (!parsed.success) {
      return authJsonError(
        "Enter a valid email and a password of at least 8 characters."
      )
    }

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: authRedirectUrl({ request, locale: parsed.data.locale }),
        data: {
          language_preference: parsed.data.locale,
        },
      },
    })

    if (error) {
      return authJsonError(error.message)
    }

    return Response.json({
      ok: true,
      status: "check_email",
      email: parsed.data.email,
      message: "Check your email to confirm your Learnify account.",
    })
  } catch (error) {
    return authUnexpectedError(error)
  }
}
