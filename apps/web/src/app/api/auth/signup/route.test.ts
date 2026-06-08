import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  signUp: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}))

const { POST } = await import("./route")

function createSignupRequest(body: Record<string, unknown> = {}) {
  return new Request("https://app.learnify.academy/api/auth/signup", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "student@example.com",
      password: "strong-password",
      locale: "en",
      ...body,
    }),
  })
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        signUp: mocks.signUp,
      },
    })
    mocks.signUp.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "student@example.com",
        },
        session: null,
      },
      error: null,
    })
  })

  it("starts Supabase email confirmation signup", async () => {
    const response = await POST(createSignupRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      ok: true,
      status: "check_email",
      email: "student@example.com",
      message: "Check your email to confirm your Learnify account.",
    })
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "strong-password",
      options: {
        emailRedirectTo:
          "https://app.learnify.academy/auth/callback?locale=en",
        data: {
          language_preference: "en",
        },
      },
    })
  })

  it("does not expose malformed signup input", async () => {
    const response = await POST(
      createSignupRequest({
        email: "not-an-email",
        password: "short",
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe(
      "Enter a valid email and a password of at least 8 characters."
    )
    expect(mocks.signUp).not.toHaveBeenCalled()
  })
})
