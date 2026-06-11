import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClassroomById: vi.fn(),
  getClassroomMembershipById: vi.fn(),
  insertAuditEvent: vi.fn(),
  removeStudentFromClassroom: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getClassroomById: mocks.getClassroomById,
  getClassroomMembershipById: mocks.getClassroomMembershipById,
  insertAuditEvent: mocks.insertAuditEvent,
  removeStudentFromClassroom: mocks.removeStudentFromClassroom,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { POST } = await import("./route")

function createRequest() {
  return new Request(
    "http://learnify.test/api/classrooms/classroom-1/students/cm-1/remove",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schoolId: "school-1" }),
    }
  )
}

describe("POST /api/classrooms/[classroomId]/students/[membershipId]/remove", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1" },
      membership: { id: "teacher-membership-1" },
    })
    mocks.getClassroomById.mockResolvedValue({
      id: "classroom-1",
      school_id: "school-1",
      owner_membership_id: "teacher-membership-1",
    })
    mocks.getClassroomMembershipById.mockResolvedValue({
      id: "cm-1",
      school_id: "school-1",
      classroom_id: "classroom-1",
      student_user_id: "student-user-1",
      student_membership_id: "school-student-membership-1",
      status: "active",
    })
    mocks.removeStudentFromClassroom.mockResolvedValue({
      id: "cm-1",
      student_user_id: "student-user-1",
      status: "removed",
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("removes the classroom membership by id", async () => {
    const response = await POST(createRequest(), {
      params: Promise.resolve({ classroomId: "classroom-1", membershipId: "cm-1" }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.classroomMembership.status).toBe("removed")
    expect(mocks.removeStudentFromClassroom).toHaveBeenCalledWith({
      supabase: expect.anything(),
      classroomMembershipId: "cm-1",
      removedBy: "teacher-user-1",
    })
  })
})
