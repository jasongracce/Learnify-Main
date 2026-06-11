import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClassroomStudentInvite: vi.fn(),
  createJoinRequest: vi.fn(),
  createPendingMembership: vi.fn(),
  getClassroomById: vi.fn(),
  getMembershipByEmailAndSchool: vi.fn(),
  getOpenJoinRequestForEmail: vi.fn(),
  getSchoolById: vi.fn(),
  insertAuditEvent: vi.fn(),
  inviteTokenResponse: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
  sendInviteEmail: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createClassroomStudentInvite: mocks.createClassroomStudentInvite,
  createJoinRequest: mocks.createJoinRequest,
  createPendingMembership: mocks.createPendingMembership,
  getClassroomById: mocks.getClassroomById,
  getMembershipByEmailAndSchool: mocks.getMembershipByEmailAndSchool,
  getOpenJoinRequestForEmail: mocks.getOpenJoinRequestForEmail,
  getSchoolById: mocks.getSchoolById,
  insertAuditEvent: mocks.insertAuditEvent,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

vi.mock("@/lib/email/invites", () => ({
  inviteTokenResponse: mocks.inviteTokenResponse,
  sendInviteEmail: mocks.sendInviteEmail,
}))

const { POST } = await import("./route")

const schoolId = "00000000-0000-4000-8000-000000000001"

function createRequest() {
  return new Request(
    "http://learnify.test/api/classrooms/classroom-1/student-invites",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        schoolId,
        emails: "student@example.com",
      }),
    }
  )
}

describe("POST /api/classrooms/[classroomId]/student-invites", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1" },
      membership: { id: "teacher-membership-1" },
    })
    mocks.getClassroomById.mockResolvedValue({
      id: "classroom-1",
      school_id: schoolId,
      owner_membership_id: "teacher-membership-1",
      name: "Physics 6A 2026",
    })
    mocks.getSchoolById.mockResolvedValue({ id: schoolId, name: "Demo School" })
    mocks.getMembershipByEmailAndSchool.mockResolvedValue(null)
    mocks.createPendingMembership.mockResolvedValue({
      id: "student-membership-1",
      user_id: null,
      status: "invited",
    })
    mocks.createClassroomStudentInvite.mockResolvedValue({
      invite: { id: "invite-1", email: "student@example.com" },
      rawToken: "raw-token",
    })
    mocks.getOpenJoinRequestForEmail.mockResolvedValue(null)
    mocks.createJoinRequest.mockResolvedValue({
      id: "join-request-1",
      source: "email_invite",
      status: "pending_teacher_approval",
    })
    mocks.sendInviteEmail.mockResolvedValue({ sent: true, skipped: false })
    mocks.inviteTokenResponse.mockReturnValue({ inviteToken: "raw-token" })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("creates a pending join request for each student email invite", async () => {
    const response = await POST(createRequest(), {
      params: Promise.resolve({ classroomId: "classroom-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.succeeded[0].joinRequest.id).toBe("join-request-1")
    expect(mocks.createPendingMembership).toHaveBeenCalledWith({
      supabase: expect.anything(),
      schoolId,
      emailNormalized: "student@example.com",
      role: "student",
      invitedBy: "teacher-user-1",
    })
    expect(mocks.createJoinRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "email_invite",
        studentUserId: null,
        studentMembershipId: "student-membership-1",
      })
    )
    expect(mocks.sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
        kind: "student",
        classroomName: "Physics 6A 2026",
      })
    )
  })
})
