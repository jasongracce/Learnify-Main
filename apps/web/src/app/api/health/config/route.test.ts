import { afterEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route"

describe("GET /api/health/config", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns only booleans and missing names without secret values", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.learnify.academy")
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "https://learnify.academy")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-secret-value")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret")
    vi.stubEnv("OPENAI_API_KEY", "openai-secret")
    vi.stubEnv("LEARNIFY_LUMI_MODE", "rag_ai")

    const response = await GET()
    const payload = await response.json()
    const serialized = JSON.stringify(payload)

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      ok: true,
      publicApp: {
        configured: true,
        missing: [],
      },
      supabase: {
        publicConfigured: true,
        serviceRoleConfigured: true,
        missing: [],
      },
      lumi: {
        mode: "rag_ai",
        openAiConfigured: true,
        missing: [],
      },
    })
    expect(serialized).not.toContain("anon-secret-value")
    expect(serialized).not.toContain("service-role-secret")
    expect(serialized).not.toContain("openai-secret")
  })

  it("reports OpenAI missing without failing config health", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.learnify.academy")
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "https://learnify.academy")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    vi.stubEnv("OPENAI_API_KEY", "")

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.lumi).toMatchObject({
      mode: "rag_ai",
      openAiConfigured: false,
      missing: ["OPENAI_API_KEY"],
    })
  })

  it("reports missing Supabase config clearly", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.learnify.academy")
    vi.stubEnv("NEXT_PUBLIC_MARKETING_URL", "https://learnify.academy")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.ok).toBe(false)
    expect(payload.publicApp.missing).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ])
    expect(payload.supabase.missing).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ])
  })
})
