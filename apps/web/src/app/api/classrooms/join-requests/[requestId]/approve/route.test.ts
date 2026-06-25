import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  approveJoinRequest: vi.fn(),
  getClassroomById: vi.fn(),
  getJoinRequestById: vi.fn(),
  insertAuditEvent: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  approveJoinRequest: mocks.approveJoinRequest,
  getClassroomById: mocks.getClassroomById,
  getJoinRequestById: mocks.getJoinRequestById,
  insertAuditEvent: mocks.insertAuditEvent,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { POST } = await import("./route")

function createRequest(body = { schoolId: "school-1" }) {
  return new Request(
    "http://learnify.test/api/classrooms/join-requests/request-1/approve",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  )
}

const context = { params: Promise.resolve({ requestId: "request-1" }) }

describe("POST /api/classrooms/join-requests/[requestId]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1" },
      membership: { id: "teacher-membership-1" },
    })
    mocks.getJoinRequestById.mockResolvedValue({
      id: "request-1",
      school_id: "school-1",
      classroom_id: "classroom-1",
    })
    mocks.getClassroomById.mockResolvedValue({
      id: "classroom-1",
      owner_membership_id: "teacher-membership-1",
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("returns the approved copy when the student is added", async () => {
    mocks.approveJoinRequest.mockResolvedValue({
      activated: true,
      request: { id: "request-1", status: "approved" },
    })

    const response = await POST(createRequest(), context)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe("Approved. Student added.")
    expect(mocks.approveJoinRequest).toHaveBeenCalledWith({
      supabase: expect.anything(),
      requestId: "request-1",
      approvedBy: "teacher-user-1",
      schoolId: "school-1",
    })
  })

  it("uses capacity-pending copy without exposing billing or overage details", async () => {
    mocks.approveJoinRequest.mockResolvedValue({
      activated: false,
      request: { id: "request-1", status: "pending_capacity" },
    })

    const response = await POST(createRequest(), context)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.message).toBe(
      "Approval pending. Your school has reached its student account limit."
    )
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("billing")
    expect(JSON.stringify(payload).toLowerCase()).not.toContain("overage")
  })
})
