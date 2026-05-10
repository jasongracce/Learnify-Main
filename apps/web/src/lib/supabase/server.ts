import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"

function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  return { url, anonKey }
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseBrowserEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options: CookieOptions
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies; route handlers can.
        }
      },
    },
  })
}
