export type LumiMode = "rule" | "mock" | "rag_ai"

export type PublicAppEnv = {
  NEXT_PUBLIC_APP_URL: string
  NEXT_PUBLIC_MARKETING_URL: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

export type SupabaseServiceEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

export type LumiEnv = {
  LEARNIFY_LUMI_MODE: LumiMode
  OPENAI_API_KEY?: string
  OPENAI_MODEL: string
  OPENAI_MAX_OUTPUT_TOKENS: string
  OPENAI_EMBEDDING_MODEL: string
  OPENAI_EMBEDDING_DIMENSIONS: string
  openAiConfigured: boolean
}

export type EnvStatus<T> =
  | {
      configured: true
      env: T
      missing: []
    }
  | {
      configured: false
      missing: string[]
    }

export const DEFAULT_LUMI_MODE: LumiMode = "rag_ai"
export const DEFAULT_OPENAI_MODEL = "gpt-5.4"
export const DEFAULT_OPENAI_MAX_OUTPUT_TOKENS = 900
export const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
export const DEFAULT_OPENAI_EMBEDDING_DIMENSIONS = 1536

const PUBLIC_APP_ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_MARKETING_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const

const SUPABASE_SERVICE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export function getPublicAppEnvStatus(
  env: Record<string, string | undefined> = process.env
): EnvStatus<PublicAppEnv> {
  return readRequiredEnv(env, PUBLIC_APP_ENV_KEYS)
}

export function requirePublicAppEnv(
  env: Record<string, string | undefined> = process.env
): PublicAppEnv {
  const status = getPublicAppEnvStatus(env)

  if (!status.configured) {
    throw new Error(`Missing public app env: ${status.missing.join(", ")}`)
  }

  return status.env
}

export function getSupabaseServiceEnvStatus(
  env: Record<string, string | undefined> = process.env
): EnvStatus<SupabaseServiceEnv> {
  return readRequiredEnv(env, SUPABASE_SERVICE_ENV_KEYS)
}

export function requireSupabaseServiceEnv(
  env: Record<string, string | undefined> = process.env
): SupabaseServiceEnv {
  const status = getSupabaseServiceEnvStatus(env)

  if (!status.configured) {
    throw new Error(`Missing Supabase env: ${status.missing.join(", ")}`)
  }

  return status.env
}

export function getLumiEnv(
  env: Record<string, string | undefined> = process.env
): LumiEnv {
  const lumiMode = parseLumiMode(env.LEARNIFY_LUMI_MODE, {
    warn: true,
  })
  const openAiApiKey = trimValue(env.OPENAI_API_KEY)
  const maxOutputTokens =
    parsePositiveInteger(env.OPENAI_MAX_OUTPUT_TOKENS) ??
    DEFAULT_OPENAI_MAX_OUTPUT_TOKENS
  const embeddingDimensions =
    parsePositiveInteger(env.OPENAI_EMBEDDING_DIMENSIONS) ??
    DEFAULT_OPENAI_EMBEDDING_DIMENSIONS

  return {
    LEARNIFY_LUMI_MODE: lumiMode,
    ...(openAiApiKey ? { OPENAI_API_KEY: openAiApiKey } : {}),
    OPENAI_MODEL: trimValue(env.OPENAI_MODEL) ?? DEFAULT_OPENAI_MODEL,
    OPENAI_MAX_OUTPUT_TOKENS: String(maxOutputTokens),
    OPENAI_EMBEDDING_MODEL:
      trimValue(env.OPENAI_EMBEDDING_MODEL) ?? DEFAULT_OPENAI_EMBEDDING_MODEL,
    OPENAI_EMBEDDING_DIMENSIONS: String(embeddingDimensions),
    openAiConfigured: Boolean(openAiApiKey),
  }
}

export function getProductionConfigHealth(
  env: Record<string, string | undefined> = process.env
) {
  const publicApp = getPublicAppEnvStatus(env)
  const supabaseService = getSupabaseServiceEnvStatus(env)
  const lumi = getLumiEnv(env)

  return {
    ok: publicApp.configured && supabaseService.configured,
    publicApp: {
      configured: publicApp.configured,
      missing: publicApp.configured ? [] : publicApp.missing,
    },
    supabase: {
      publicConfigured:
        Boolean(trimValue(env.NEXT_PUBLIC_SUPABASE_URL)) &&
        Boolean(trimValue(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)),
      serviceRoleConfigured: Boolean(
        trimValue(env.SUPABASE_SERVICE_ROLE_KEY)
      ),
      missing: supabaseService.configured ? [] : supabaseService.missing,
    },
    lumi: {
      mode: lumi.LEARNIFY_LUMI_MODE,
      openAiConfigured: lumi.openAiConfigured,
      missing: lumi.openAiConfigured ? [] : ["OPENAI_API_KEY"],
      modelConfigured: Boolean(trimValue(env.OPENAI_MODEL)),
      maxOutputTokensConfigured: Boolean(
        trimValue(env.OPENAI_MAX_OUTPUT_TOKENS)
      ),
      embeddingModelConfigured: Boolean(
        trimValue(env.OPENAI_EMBEDDING_MODEL)
      ),
      embeddingDimensionsConfigured: Boolean(
        trimValue(env.OPENAI_EMBEDDING_DIMENSIONS)
      ),
    },
  }
}

function readRequiredEnv<const TKeys extends readonly string[]>(
  env: Record<string, string | undefined>,
  keys: TKeys
): EnvStatus<{ [Key in TKeys[number]]: string }> {
  const entries = keys.map((key) => [key, trimValue(env[key])] as const)
  const missing = entries
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    return {
      configured: false,
      missing,
    }
  }

  return {
    configured: true,
    env: Object.fromEntries(entries) as { [Key in TKeys[number]]: string },
    missing: [],
  }
}

function parseLumiMode(
  value: string | undefined,
  input: { warn: boolean }
): LumiMode {
  const normalized = trimValue(value)

  if (!normalized) {
    return DEFAULT_LUMI_MODE
  }

  if (
    normalized === "rule" ||
    normalized === "mock" ||
    normalized === "rag_ai"
  ) {
    return normalized
  }

  if (input.warn) {
    console.warn("Invalid LEARNIFY_LUMI_MODE; defaulting to rag_ai")
  }

  return DEFAULT_LUMI_MODE
}

function parsePositiveInteger(value: string | undefined): number | null {
  const trimmed = trimValue(value)

  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function trimValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()

  return trimmed ? trimmed : undefined
}
