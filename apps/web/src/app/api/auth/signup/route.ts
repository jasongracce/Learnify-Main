import { authPasswordRequestSchema } from "@learnify/shared"
import { createSupabaseServiceClientFromEnv } from "@learnify/database"
import { requireSupabaseServiceEnv } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { authJsonError, finishAuthenticatedAccess } from "../_lib"

export async function POST(request: Request) {
  const parsed = authPasswordRequestSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return authJsonError(
      "Enter a valid email and a password of at least 8 characters."
    )
  }

  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )
  const { error: createError } = await serviceSupabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      language_preference: parsed.data.locale,
    },
  })

  const supabase = await createSupabaseServerClient()
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (createError && signInError) {
    return authJsonError(
      isExistingUserError(createError.message)
        ? "This email already has a Learnify account. Sign in instead."
        : createError.message,
      isExistingUserError(createError.message) ? 409 : 400
    )
  }

  if (signInError || !data.user?.email) {
    return authJsonError("Could not sign in after creating your account.", 500)
  }

  return finishAuthenticatedAccess({
    userId: data.user.id,
    email: data.user.email,
    locale: parsed.data.locale,
  })
}

function isExistingUserError(message: string) {
  return /already|registered|exists/i.test(message)
}
