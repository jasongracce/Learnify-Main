import {
  createClient,
  type SupabaseClient as SupabaseJsClient,
} from "@supabase/supabase-js"
import type { WaitlistSignupInput } from "@learnify/shared"
import { normalizeEmail, resolveWaitlistAccess } from "@learnify/core"

export type SupabaseClient = SupabaseJsClient<any>

export type SupabaseServerEnv = Record<string, string | undefined> & {
  NEXT_PUBLIC_SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

export type WaitlistSignupRecord = {
  id: string
  email: string
  response_id: string | null
  created_at: string
}

export function getSupabaseServerConfig(env: SupabaseServerEnv) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return {
      configured: false as const,
      missing: [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      ].filter(Boolean) as string[],
    }
  }

  return {
    configured: true as const,
    url,
    serviceRoleKey,
  }
}

export function createSupabaseBrowserClient(input: {
  url: string
  anonKey: string
}) {
  return createClient<any>(input.url, input.anonKey)
}

export function createSupabaseServiceClient(input: {
  url: string
  serviceRoleKey: string
}) {
  return createClient<any>(input.url, input.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function createSupabaseServiceClientFromEnv(env: SupabaseServerEnv) {
  const config = getSupabaseServerConfig(env)

  if (!config.configured) {
    throw new Error(`Missing Supabase env: ${config.missing.join(", ")}`)
  }

  return createSupabaseServiceClient({
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
  })
}

export async function upsertWaitlistSignup(input: {
  supabase: SupabaseClient
  signup: WaitlistSignupInput
}) {
  const normalizedEmail = normalizeEmail(input.signup.email)
  const { data, error } = await input.supabase
    .from("beta_signups")
    .upsert(
      {
        email: normalizedEmail,
        response_id: null,
      },
      {
        onConflict: "email",
      }
    )
    .select("id,email,response_id,created_at")
    .single<WaitlistSignupRecord>()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getWaitlistAccessByEmail(input: {
  supabase: SupabaseClient
  email: string
}) {
  const normalizedEmail = normalizeEmail(input.email)
  const { data, error } = await input.supabase
    .from("beta_signups")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle<{ id: string }>()

  if (error) {
    throw new Error(error.message)
  }

  return resolveWaitlistAccess({
    exists: Boolean(data),
    betaAccess: Boolean(data),
  })
}

export async function checkSupabaseWaitlistTable(input: {
  supabase: SupabaseClient
}) {
  const { error, count } = await input.supabase
    .from("beta_signups")
    .select("id", { count: "exact", head: true })

  if (error) {
    throw new Error(error.message)
  }

  return {
    reachable: true,
    waitlistCount: count ?? 0,
  }
}
