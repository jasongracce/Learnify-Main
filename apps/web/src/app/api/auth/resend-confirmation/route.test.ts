import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  resend: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}))

const { POST } = await import("./route")

function createResendRequest(body: Record<string, unknown> = {}) {
  return new Request("https://app.learnify.academy/api/auth/resend-confirmation", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "student@example.com",
      locale: "en",
      ...body,
    }),
  })
}

describe("POST /api/auth/resend-confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        resend: mocks.resend,
      },
    })
    mocks.resend.mockResolvedValue({
      data: {},
      error: null,
    })
  })

  it("resends signup confirmation email", async () => {
    const response = await POST(createResendRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      ok: true,
      message: "We sent another confirmation email.",
    })
    expect(mocks.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "student@example.com",
      options: {
        emailRedirectTo:
          "https://app.learnify.academy/auth/callback?locale=en",
      },
    })
  })

  it("rejects malformed email input", async () => {
    const response = await POST(createResendRequest({ email: "bad-email" }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Enter a valid email address.")
    expect(mocks.resend).not.toHaveBeenCalled()
  })
})
