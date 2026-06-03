import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  checkSupabaseWaitlistTable: vi.fn(),
  createSupabaseServiceClientFromEnv: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  checkSupabaseWaitlistTable: mocks.checkSupabaseWaitlistTable,
  createSupabaseServiceClientFromEnv: mocks.createSupabaseServiceClientFromEnv,
}))

const { GET } = await import("./route")

describe("GET /api/health/supabase", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue({ from: vi.fn() })
    mocks.checkSupabaseWaitlistTable.mockResolvedValue({
      reachable: true,
      waitlistCount: 42,
    })
  })

  it("does not expose waitlist counts on success", async () => {
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      ok: true,
      configured: true,
      source: "beta_signups",
    })
    expect(payload.waitlistCount).toBeUndefined()
  })

  it("does not expose raw Supabase errors on failure", async () => {
    mocks.checkSupabaseWaitlistTable.mockRejectedValueOnce(
      new Error("permission denied for table beta_signups")
    )

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not reach Supabase.")
    expect(payload.error).not.toContain("permission denied")
  })
})
