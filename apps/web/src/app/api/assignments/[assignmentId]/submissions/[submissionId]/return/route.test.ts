import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClassroomById: vi.fn(),
  getTeacherAssignmentDetail: vi.fn(),
  insertAuditEvent: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
  returnAssignmentSubmission: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getClassroomById: mocks.getClassroomById,
  getTeacherAssignmentDetail: mocks.getTeacherAssignmentDetail,
  insertAuditEvent: mocks.insertAuditEvent,
  returnAssignmentSubmission: mocks.returnAssignmentSubmission,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { POST } = await import("./route")

const schoolId = "00000000-0000-4000-8000-000000000001"
const classroomId = "00000000-0000-4000-8000-000000000002"
const assignmentId = "00000000-0000-4000-8000-000000000003"
const submissionId = "00000000-0000-4000-8000-000000000004"

function assignmentDetail() {
  return {
    assignment: {
      id: assignmentId,
      school_id: schoolId,
      classroom_id: classroomId,
      assignment_type: "mixed",
      status: "published",
    },
    items: [],
    quizQuestions: [],
    recipients: [],
    submissions: [{ id: submissionId }],
    itemSubmissions: [],
    attachments: [],
  }
}

function context(id = submissionId) {
  return { params: Promise.resolve({ assignmentId, submissionId: id }) }
}

function request(body: Record<string, unknown>) {
  return new Request(
    `http://learnify.test/api/assignments/${assignmentId}/submissions/${submissionId}/return`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  )
}

describe("POST /api/assignments/[assignmentId]/submissions/[submissionId]/return", () => {
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
    mocks.returnAssignmentSubmission.mockResolvedValue({
      submission: { id: submissionId, status: "returned" },
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("validates return feedback", async () => {
    const response = await POST(request({ schoolId, feedback: {} }), context())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid return data.")
    expect(mocks.returnAssignmentSubmission).not.toHaveBeenCalled()
  })

  it("returns 404 when the submission is outside the assignment", async () => {
    const response = await POST(
      request({ schoolId, feedback: { en: "Revise." } }),
      context("00000000-0000-4000-8000-000000000099")
    )

    expect(response.status).toBe(404)
    expect(mocks.returnAssignmentSubmission).not.toHaveBeenCalled()
  })

  it("returns work with the authenticated teacher id and writes an audit event", async () => {
    const response = await POST(
      request({ schoolId, feedback: { en: "Please revise." } }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.submission.status).toBe("returned")
    expect(mocks.returnAssignmentSubmission).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      submissionId,
      returnedBy: "teacher-user-1",
      request: expect.objectContaining({ feedback: { en: "Please revise." } }),
    })
    expect(mocks.insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "assignment.submission_returned",
        targetId: submissionId,
      })
    )
  })

  it("returns a generic 500 when returning fails", async () => {
    mocks.returnAssignmentSubmission.mockRejectedValue(new Error("bad transition"))

    const response = await POST(
      request({ schoolId, feedback: { en: "Please revise." } }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not return submission.")
  })
})
