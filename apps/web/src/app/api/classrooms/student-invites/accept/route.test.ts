import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  attachUserToJoinRequest: vi.fn(),
  attachUserToMembership: vi.fn(),
  createJoinRequest: vi.fn(),
  createPendingMembership: vi.fn(),
  getClassroomStudentInviteByTokenHash: vi.fn(),
  getMembershipByEmailAndSchool: vi.fn(),
  getOpenJoinRequestForEmail: vi.fn(),
  insertAuditEvent: vi.fn(),
  markClassroomStudentInviteAccepted: vi.fn(),
  requireApiAuth: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  attachUserToJoinRequest: mocks.attachUserToJoinRequest,
  attachUserToMembership: mocks.attachUserToMembership,
  createJoinRequest: mocks.createJoinRequest,
  createPendingMembership: mocks.createPendingMembership,
  getClassroomStudentInviteByTokenHash: mocks.getClassroomStudentInviteByTokenHash,
  getMembershipByEmailAndSchool: mocks.getMembershipByEmailAndSchool,
  getOpenJoinRequestForEmail: mocks.getOpenJoinRequestForEmail,
  insertAuditEvent: mocks.insertAuditEvent,
  markClassroomStudentInviteAccepted: mocks.markClassroomStudentInviteAccepted,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { POST } = await import("./route")

function createRequest() {
  return new Request("http://learnify.test/api/classrooms/student-invites/accept", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "raw-token" }),
  })
}

describe("POST /api/classrooms/student-invites/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "student-user-1", email: "student@example.com" },
    })
    mocks.getClassroomStudentInviteByTokenHash.mockResolvedValue({
      id: "invite-1",
      school_id: "school-1",
      classroom_id: "classroom-1",
      email: "student@example.com",
      email_normalized: "student@example.com",
      status: "pending",
      expires_at: "2099-01-01T00:00:00.000Z",
      invited_by: "teacher-user-1",
    })
    mocks.getMembershipByEmailAndSchool.mockResolvedValue({
      id: "student-membership-1",
      user_id: null,
      status: "invited",
    })
    mocks.attachUserToMembership.mockResolvedValue({
      id: "student-membership-1",
      user_id: "student-user-1",
      status: "invited",
    })
    mocks.getOpenJoinRequestForEmail.mockResolvedValue({
      id: "join-request-1",
      student_user_id: null,
      student_membership_id: "student-membership-1",
      status: "pending_teacher_approval",
    })
    mocks.attachUserToJoinRequest.mockResolvedValue({
      id: "join-request-1",
      student_user_id: "student-user-1",
      student_membership_id: "student-membership-1",
      status: "pending_teacher_approval",
    })
    mocks.markClassroomStudentInviteAccepted.mockResolvedValue({
      id: "invite-1",
      status: "accepted",
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("attaches the signed-in student while keeping teacher approval pending", async () => {
    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe("Your request is pending approval.")
    expect(mocks.attachUserToMembership).toHaveBeenCalledWith({
      supabase: expect.anything(),
      membershipId: "student-membership-1",
      userId: "student-user-1",
    })
    expect(mocks.attachUserToJoinRequest).toHaveBeenCalledWith({
      supabase: expect.anything(),
      requestId: "join-request-1",
      studentUserId: "student-user-1",
      studentMembershipId: "student-membership-1",
    })
    expect(mocks.markClassroomStudentInviteAccepted).toHaveBeenCalled()
    expect(mocks.createJoinRequest).not.toHaveBeenCalled()
  })

  it("rejects a signed-in email that does not match the invite", async () => {
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "other-user-1", email: "other@example.com" },
    })

    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.error).toBe("This invite was sent to a different email address.")
    expect(mocks.attachUserToMembership).not.toHaveBeenCalled()
  })
})
