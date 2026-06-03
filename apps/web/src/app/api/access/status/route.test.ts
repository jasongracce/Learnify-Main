import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSupabaseServiceClientFromEnv: vi.fn(),
  getWaitlistAccessByEmail: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createSupabaseServiceClientFromEnv: mocks.createSupabaseServiceClientFromEnv,
  getWaitlistAccessByEmail: mocks.getWaitlistAccessByEmail,
}))

const { GET } = await import("./route")

describe("GET /api/access/status", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue({ from: vi.fn() })
    mocks.getWaitlistAccessByEmail.mockResolvedValue("approved")
  })

  it("returns a generic error when access lookup fails", async () => {
    mocks.getWaitlistAccessByEmail.mockRejectedValueOnce(
      new Error("relation beta_signups does not exist")
    )

    const response = await GET(
      new Request("http://learnify.test/api/access/status?email=student@example.com")
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not check access status.")
    expect(payload.error).not.toContain("beta_signups")
  })
})
