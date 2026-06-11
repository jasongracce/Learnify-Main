import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createPendingMembership: vi.fn(),
  createSchoolInvite: vi.fn(),
  getMembershipByEmailAndSchool: vi.fn(),
  insertAuditEvent: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createPendingMembership: mocks.createPendingMembership,
  createSchoolInvite: mocks.createSchoolInvite,
  getMembershipByEmailAndSchool: mocks.getMembershipByEmailAndSchool,
  insertAuditEvent: mocks.insertAuditEvent,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { POST } = await import("./route")

function createRequest() {
  return new Request("http://learnify.test/api/school/invites/teacher", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      schoolId: "00000000-0000-4000-8000-000000000001",
      email: "teacher@example.com",
      locale: "en",
    }),
  })
}

describe("POST /api/school/invites/teacher", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "school-admin-user-1" },
      membership: { id: "school-admin-membership-1" },
    })
    mocks.getMembershipByEmailAndSchool.mockResolvedValue(null)
    mocks.createPendingMembership.mockResolvedValue({
      id: "teacher-membership-1",
      status: "invited",
    })
    mocks.createSchoolInvite.mockResolvedValue({
      invite: { id: "invite-1", status: "pending" },
      rawToken: "raw-token",
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("creates a pending teacher invite without checking teacher seat capacity", async () => {
    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.membership).toMatchObject({
      id: "teacher-membership-1",
      status: "invited",
    })
    expect(mocks.createPendingMembership).toHaveBeenCalledWith({
      supabase: expect.anything(),
      schoolId: "00000000-0000-4000-8000-000000000001",
      emailNormalized: "teacher@example.com",
      role: "teacher",
      invitedBy: "school-admin-user-1",
    })
    expect(mocks.createSchoolInvite).toHaveBeenCalled()
  })
})
