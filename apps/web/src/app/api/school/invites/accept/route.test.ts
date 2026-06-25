import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  activateMembership: vi.fn(),
  getMembershipByEmailAndSchool: vi.fn(),
  getSchoolInviteByTokenHash: vi.fn(),
  insertAuditEvent: vi.fn(),
  markSchoolInviteAccepted: vi.fn(),
  requireApiAuth: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  activateMembership: mocks.activateMembership,
  getMembershipByEmailAndSchool: mocks.getMembershipByEmailAndSchool,
  getSchoolInviteByTokenHash: mocks.getSchoolInviteByTokenHash,
  insertAuditEvent: mocks.insertAuditEvent,
  markSchoolInviteAccepted: mocks.markSchoolInviteAccepted,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { POST } = await import("./route")

function createRequest(body = { token: "raw-token" }) {
  return new Request("http://learnify.test/api/school/invites/accept", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/school/invites/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1", email: "teacher@example.com" },
    })
    mocks.getSchoolInviteByTokenHash.mockResolvedValue({
      id: "invite-1",
      school_id: "school-1",
      email_normalized: "teacher@example.com",
      role: "teacher",
      status: "pending",
      expires_at: "2099-01-01T00:00:00.000Z",
    })
    mocks.getMembershipByEmailAndSchool.mockResolvedValue({
      id: "membership-1",
      role: "teacher",
    })
    mocks.activateMembership.mockResolvedValue({
      id: "membership-1",
      status: "active",
    })
    mocks.markSchoolInviteAccepted.mockResolvedValue({})
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("rejects invite acceptance from a different signed-in email", async () => {
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "other-user-1", email: "other@example.com" },
    })

    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.error).toBe("This invite was sent to a different email address.")
    expect(mocks.activateMembership).not.toHaveBeenCalled()
    expect(mocks.markSchoolInviteAccepted).not.toHaveBeenCalled()
  })

  it("activates the matching invited membership", async () => {
    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.membership.status).toBe("active")
    expect(mocks.activateMembership).toHaveBeenCalledWith({
      supabase: expect.anything(),
      membershipId: "membership-1",
      userId: "teacher-user-1",
      schoolId: "school-1",
      role: "teacher",
    })
  })
})
