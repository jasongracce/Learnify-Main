import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createJoinRequest: vi.fn(),
  getClassroomByJoinCode: vi.fn(),
  getOrCreateStudentMembershipForJoin: vi.fn(),
  getOpenJoinRequestForStudent: vi.fn(),
  insertAuditEvent: vi.fn(),
  requireApiAuth: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createJoinRequest: mocks.createJoinRequest,
  getClassroomByJoinCode: mocks.getClassroomByJoinCode,
  getOrCreateStudentMembershipForJoin: mocks.getOrCreateStudentMembershipForJoin,
  getOpenJoinRequestForStudent: mocks.getOpenJoinRequestForStudent,
  insertAuditEvent: mocks.insertAuditEvent,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { POST } = await import("./route")

function createRequest(body = { joinCode: "ABC234" }) {
  return new Request("http://learnify.test/api/classrooms/join/code", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/classrooms/join/code", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "student-user-1", email: "student@example.com" },
    })
    mocks.getClassroomByJoinCode.mockResolvedValue({
      id: "classroom-1",
      school_id: "school-1",
      status: "active",
      join_enabled: true,
    })
    mocks.getOpenJoinRequestForStudent.mockResolvedValue(null)
    mocks.getOrCreateStudentMembershipForJoin.mockResolvedValue({
      id: "student-membership-1",
    })
    mocks.createJoinRequest.mockResolvedValue({
      id: "join-request-1",
      student_membership_id: "student-membership-1",
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("creates or reuses a student membership before creating the join request", async () => {
    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.joinRequest.student_membership_id).toBe(
      "student-membership-1"
    )
    expect(mocks.getOrCreateStudentMembershipForJoin).toHaveBeenCalledWith({
      supabase: expect.anything(),
      schoolId: "school-1",
      userId: "student-user-1",
      email: "student@example.com",
      invitedBy: "student-user-1",
    })
    expect(mocks.createJoinRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        studentMembershipId: "student-membership-1",
        source: "code",
      })
    )
  })
})
