import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  attachSchoolIdentityByEmail: vi.fn(),
  createSupabaseServiceClientFromEnv: vi.fn(),
  listCurrentSchoolMemberships: vi.fn(),
  requireSupabaseServiceEnv: vi.fn(),
  upsertStudentProfile: vi.fn(),
  upsertWaitlistSignup: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  attachSchoolIdentityByEmail: mocks.attachSchoolIdentityByEmail,
  createSupabaseServiceClientFromEnv: mocks.createSupabaseServiceClientFromEnv,
  listCurrentSchoolMemberships: mocks.listCurrentSchoolMemberships,
  upsertStudentProfile: mocks.upsertStudentProfile,
  upsertWaitlistSignup: mocks.upsertWaitlistSignup,
}))

vi.mock("@/lib/env", () => ({
  requireSupabaseServiceEnv: mocks.requireSupabaseServiceEnv,
}))

const { finishAuthenticatedAccess, getDefaultAppRedirect } = await import("./_lib")

function serviceClient(role: string | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: role ? { role } : null,
        error: null,
      }),
    })),
  }
}

describe("auth app redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireSupabaseServiceEnv.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    })
    mocks.upsertStudentProfile.mockResolvedValue({ id: "user-1" })
    mocks.upsertWaitlistSignup.mockResolvedValue({ id: "waitlist-1" })
    mocks.attachSchoolIdentityByEmail.mockResolvedValue(undefined)
  })

  it("routes Learnify admins to school administration", async () => {
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue(serviceClient("admin"))
    mocks.listCurrentSchoolMemberships.mockResolvedValue([])

    await expect(
      getDefaultAppRedirect({ userId: "user-1", locale: "en" })
    ).resolves.toBe("/en/app/admin/schools")
  })

  it("routes active school admins before teacher memberships", async () => {
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue(serviceClient("student"))
    mocks.listCurrentSchoolMemberships.mockResolvedValue([
      { role: "teacher", status: "active" },
      { role: "school_admin", status: "active" },
    ])

    await expect(
      getDefaultAppRedirect({ userId: "user-1", locale: "en" })
    ).resolves.toBe("/en/app/school")
  })

  it("routes active teachers to classrooms", async () => {
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue(serviceClient("student"))
    mocks.listCurrentSchoolMemberships.mockResolvedValue([
      { role: "teacher", status: "active" },
    ])

    await expect(
      getDefaultAppRedirect({ userId: "user-1", locale: "th" })
    ).resolves.toBe("/th/app/classrooms")
  })

  it("keeps students on the dashboard after access registration", async () => {
    mocks.createSupabaseServiceClientFromEnv.mockReturnValue(serviceClient("student"))
    mocks.listCurrentSchoolMemberships.mockResolvedValue([])

    const response = await finishAuthenticatedAccess({
      userId: "user-1",
      email: "student@example.com",
      locale: "en",
    })

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      redirectTo: "/en/app/dashboard",
    })
    expect(mocks.upsertWaitlistSignup).toHaveBeenCalled()
    expect(mocks.upsertStudentProfile).toHaveBeenCalled()
    expect(mocks.attachSchoolIdentityByEmail).toHaveBeenCalledWith({
      supabase: expect.anything(),
      email: "student@example.com",
      userId: "user-1",
    })
  })
})
