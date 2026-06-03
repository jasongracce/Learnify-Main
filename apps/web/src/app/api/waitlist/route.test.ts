import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSupabaseServiceClientFromEnv: vi.fn(),
  upsertWaitlistSignup: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createSupabaseServiceClientFromEnv: mocks.createSupabaseServiceClientFromEnv,
  upsertWaitlistSignup: mocks.upsertWaitlistSignup,
}))

const { POST } = await import("./route")

function createRequest() {
  return new Request("http://learnify.test/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "student@example.com",
      preferred_language: "en",
    }),
  })
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue({ from: vi.fn() })
    mocks.upsertWaitlistSignup.mockResolvedValue({
      email: "student@example.com",
    })
  })

  it("returns a generic error when saving fails", async () => {
    mocks.upsertWaitlistSignup.mockRejectedValueOnce(
      new Error("duplicate key value violates unique constraint")
    )

    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not save waitlist signup.")
    expect(payload.error).not.toContain("duplicate key")
  })
})
