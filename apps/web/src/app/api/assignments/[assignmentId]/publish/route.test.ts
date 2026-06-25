import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClassroomById: vi.fn(),
  getTeacherAssignmentDetail: vi.fn(),
  insertAuditEvent: vi.fn(),
  publishAssignmentToActiveStudents: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getClassroomById: mocks.getClassroomById,
  getTeacherAssignmentDetail: mocks.getTeacherAssignmentDetail,
  insertAuditEvent: mocks.insertAuditEvent,
  publishAssignmentToActiveStudents: mocks.publishAssignmentToActiveStudents,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { POST } = await import("./route")

const schoolId = "00000000-0000-4000-8000-000000000001"
const classroomId = "00000000-0000-4000-8000-000000000002"
const assignmentId = "00000000-0000-4000-8000-000000000003"
const studentUserId = "00000000-0000-4000-8000-000000000004"

function assignmentDetail(status = "draft") {
  return {
    assignment: {
      id: assignmentId,
      school_id: schoolId,
      classroom_id: classroomId,
      assignment_type: "quiz",
      status,
    },
    items: [],
    quizQuestions: [],
    recipients: [],
    submissions: [],
    itemSubmissions: [],
    attachments: [],
  }
}

function context() {
  return { params: Promise.resolve({ assignmentId }) }
}

function request(body: Record<string, unknown>) {
  return new Request(
    `http://learnify.test/api/assignments/${assignmentId}/publish`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  )
}

describe("POST /api/assignments/[assignmentId]/publish", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1" },
      membership: { id: "teacher-membership-1" },
    })
    mocks.getTeacherAssignmentDetail.mockResolvedValue(assignmentDetail())
    mocks.getClassroomById.mockResolvedValue({
      id: classroomId,
      school_id: schoolId,
      owner_membership_id: "teacher-membership-1",
    })
    mocks.publishAssignmentToActiveStudents.mockResolvedValue({
      assignment: assignmentDetail("published").assignment,
      recipients: [
        {
          id: "recipient-1",
          assignment_id: assignmentId,
          student_user_id: studentUserId,
        },
      ],
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("validates publish recipients", async () => {
    const response = await POST(
      request({ schoolId, recipientStudentUserIds: [] }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid publish data.")
    expect(payload.issues.recipientStudentUserIds).toBeDefined()
    expect(mocks.publishAssignmentToActiveStudents).not.toHaveBeenCalled()
  })

  it("publishes to requested active classroom students and writes an audit event", async () => {
    const response = await POST(
      request({ schoolId, recipientStudentUserIds: [studentUserId] }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assignment.status).toBe("published")
    expect(payload.recipients).toHaveLength(1)
    expect(mocks.publishAssignmentToActiveStudents).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      recipientStudentUserIds: [studentUserId],
      dueAt: undefined,
    })
    expect(mocks.insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "assignment.published",
        targetType: "assignment",
        targetId: assignmentId,
        metadata: {
          classroomId,
          assignmentType: "quiz",
          status: "published",
          recipientCount: 1,
        },
      })
    )
  })

  it("returns a generic 500 when publishing fails", async () => {
    mocks.publishAssignmentToActiveStudents.mockRejectedValue(
      new Error("cannot publish")
    )

    const response = await POST(
      request({ schoolId, recipientStudentUserIds: [studentUserId] }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not publish assignment.")
  })
})
