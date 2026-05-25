import { describe, expect, it, vi } from "vitest"
import {
  getLumiEnv,
  getProductionConfigHealth,
  getSupabaseServiceEnvStatus,
  requirePublicAppEnv,
} from "./env"

const completeEnv = {
  NEXT_PUBLIC_APP_URL: "https://app.learnify.academy",
  NEXT_PUBLIC_MARKETING_URL: "https://learnify.academy",
  NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  LEARNIFY_LUMI_MODE: "rag_ai",
  OPENAI_API_KEY: "openai-key",
  OPENAI_MODEL: "gpt-test",
  OPENAI_MAX_OUTPUT_TOKENS: "1200",
  OPENAI_EMBEDDING_MODEL: "text-embedding-test",
  OPENAI_EMBEDDING_DIMENSIONS: "2048",
}

describe("server env parsing", () => {
  it("parses complete production env", () => {
    expect(requirePublicAppEnv(completeEnv)).toEqual({
      NEXT_PUBLIC_APP_URL: "https://app.learnify.academy",
      NEXT_PUBLIC_MARKETING_URL: "https://learnify.academy",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    })

    expect(getSupabaseServiceEnvStatus(completeEnv)).toEqual({
      configured: true,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      },
      missing: [],
    })

    expect(getLumiEnv(completeEnv)).toMatchObject({
      LEARNIFY_LUMI_MODE: "rag_ai",
      OPENAI_API_KEY: "openai-key",
      OPENAI_MODEL: "gpt-test",
      OPENAI_MAX_OUTPUT_TOKENS: "1200",
      OPENAI_EMBEDDING_MODEL: "text-embedding-test",
      OPENAI_EMBEDDING_DIMENSIONS: "2048",
      openAiConfigured: true,
    })
  })

  it("reports missing Supabase service role without exposing values", () => {
    const status = getSupabaseServiceEnvStatus({
      ...completeEnv,
      SUPABASE_SERVICE_ROLE_KEY: "",
    })

    expect(status).toEqual({
      configured: false,
      missing: ["SUPABASE_SERVICE_ROLE_KEY"],
    })
  })

  it("keeps Lumi fallback-safe when OpenAI key is missing", () => {
    const lumi = getLumiEnv({
      ...completeEnv,
      OPENAI_API_KEY: "",
    })

    expect(lumi.openAiConfigured).toBe(false)
    expect(lumi.OPENAI_API_KEY).toBeUndefined()
    expect(lumi.LEARNIFY_LUMI_MODE).toBe("rag_ai")
  })

  it("defaults invalid Lumi mode to rag_ai and warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)

    expect(
      getLumiEnv({
        ...completeEnv,
        LEARNIFY_LUMI_MODE: "live",
      }).LEARNIFY_LUMI_MODE
    ).toBe("rag_ai")
    expect(warn).toHaveBeenCalledWith(
      "Invalid LEARNIFY_LUMI_MODE; defaulting to rag_ai"
    )

    warn.mockRestore()
  })

  it("uses safe defaults for invalid numeric Lumi config", () => {
    const lumi = getLumiEnv({
      ...completeEnv,
      OPENAI_MODEL: "",
      OPENAI_MAX_OUTPUT_TOKENS: "-1",
      OPENAI_EMBEDDING_DIMENSIONS: "many",
    })

    expect(lumi.OPENAI_MODEL).toBe("gpt-5.4")
    expect(lumi.OPENAI_MAX_OUTPUT_TOKENS).toBe("900")
    expect(lumi.OPENAI_EMBEDDING_DIMENSIONS).toBe("1536")
  })

  it("returns non-secret production health details", () => {
    const health = getProductionConfigHealth({
      ...completeEnv,
      OPENAI_API_KEY: "super-secret-openai",
      SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-role",
    })

    const serialized = JSON.stringify(health)

    expect(health.ok).toBe(true)
    expect(serialized).not.toContain("super-secret-openai")
    expect(serialized).not.toContain("super-secret-service-role")
  })
})
