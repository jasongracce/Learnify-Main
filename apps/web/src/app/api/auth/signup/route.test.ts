import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseServiceClientFromEnv: vi.fn(),
  signInWithPassword: vi.fn(),
  createUser: vi.fn(),
  upsertStudentProfile: vi.fn(),
  upsertWaitlistSignup: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}))

vi.mock("@learnify/database", () => ({
  createSupabaseServiceClientFromEnv:
    mocks.createSupabaseServiceClientFromEnv,
  upsertStudentProfile: mocks.upsertStudentProfile,
  upsertWaitlistSignup: mocks.upsertWaitlistSignup,
}))

const { POST } = await import("./route")

const userId = "00000000-0000-4000-8000-000000000001"

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

function setDefaultMocks() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test")
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
  mocks.createSupabaseServiceClientFromEnv.mockReturnValue({
    auth: {
      admin: {
        createUser: mocks.createUser,
      },
    },
  })
  mocks.createSupabaseServerClient.mockResolvedValue({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
    },
  })
  mocks.createUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: "student@example.com",
      },
    },
    error: null,
  })
  mocks.signInWithPassword.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: "student@example.com",
      },
    },
    error: null,
  })
  mocks.upsertWaitlistSignup.mockResolvedValue({
    id: "signup-1",
    email: "student@example.com",
  })
  mocks.upsertStudentProfile.mockResolvedValue({
    id: userId,
    role: "student",
    language_preference: "en",
  })
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    setDefaultMocks()
  })

  it("creates a confirmed user and signs in without sending verification email", async () => {
    const response = await POST(createSignupRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      ok: true,
      redirectTo: "/en/app/dashboard",
    })
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "strong-password",
      email_confirm: true,
      user_metadata: {
        language_preference: "en",
      },
    })
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "student@example.com",
      password: "strong-password",
    })
    expect(payload.status).not.toBe("check_email")
  })

  it("lets an existing confirmed user continue through normal sign in", async () => {
    mocks.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("User already registered"),
    })

    const response = await POST(createSignupRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.redirectTo).toBe("/en/app/dashboard")
  })

  it("returns sign-in guidance for an existing user with the wrong password", async () => {
    mocks.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("User already registered"),
    })
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Invalid login credentials"),
    })

    const response = await POST(createSignupRequest())
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error).toBe(
      "This email already has a Learnify account. Sign in instead."
    )
  })
})
