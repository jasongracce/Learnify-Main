import { authPasswordRequestSchema } from "@learnify/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  authJsonError,
  authUnexpectedError,
  finishAuthenticatedAccess,
} from "../_lib"

export async function POST(request: Request) {
  try {
    const parsed = authPasswordRequestSchema.safeParse(
      await request.json().catch(() => null)
    )

    if (!parsed.success) {
      return authJsonError("Enter a valid email and password.")
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      return authJsonError(error.message, 401)
    }

    if (!data.user?.email) {
      return authJsonError("Could not sign in. Try again.", 401)
    }

    return finishAuthenticatedAccess({
      userId: data.user.id,
      email: data.user.email,
      locale: parsed.data.locale,
    })
  } catch (error) {
    return authUnexpectedError(error)
  }
}
