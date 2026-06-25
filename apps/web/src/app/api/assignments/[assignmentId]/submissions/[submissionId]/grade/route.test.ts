import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClassroomById: vi.fn(),
  getTeacherAssignmentDetail: vi.fn(),
  gradeAssignmentSubmission: vi.fn(),
  insertAuditEvent: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getClassroomById: mocks.getClassroomById,
  getTeacherAssignmentDetail: mocks.getTeacherAssignmentDetail,
  gradeAssignmentSubmission: mocks.gradeAssignmentSubmission,
  insertAuditEvent: mocks.insertAuditEvent,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { POST } = await import("./route")

const schoolId = "00000000-0000-4000-8000-000000000001"
const classroomId = "00000000-0000-4000-8000-000000000002"
const assignmentId = "00000000-0000-4000-8000-000000000003"
const submissionId = "00000000-0000-4000-8000-000000000004"
const itemId = "00000000-0000-4000-8000-000000000005"

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

function request(body: Record<string, unknown> | string) {
  return new Request(
    `http://learnify.test/api/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }
  )
}

describe("POST /api/assignments/[assignmentId]/submissions/[submissionId]/grade", () => {
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
    mocks.gradeAssignmentSubmission.mockResolvedValue({
      submission: { id: submissionId, status: "graded" },
      itemSubmissions: [],
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("validates request bodies", async () => {
    const response = await POST(
      request({ schoolId, itemGrades: [{ assignmentItemId: itemId, score: -1 }] }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid grading data.")
    expect(mocks.requireApiSchoolAccess).not.toHaveBeenCalled()
  })

  it("passes through auth helper responses", async () => {
    mocks.requireApiSchoolAccess.mockResolvedValue({
      response: Response.json({ error: "Nope" }, { status: 401 }),
    })

    const response = await POST(request({ schoolId }), context())

    expect(response.status).toBe(401)
    expect(mocks.gradeAssignmentSubmission).not.toHaveBeenCalled()
  })

  it("blocks non-owner access through requireOwnedAssignment", async () => {
    mocks.getClassroomById.mockResolvedValue({
      id: classroomId,
      school_id: schoolId,
      owner_membership_id: "another-membership",
    })

    const response = await POST(request({ schoolId }), context())

    expect(response.status).toBe(403)
    expect(mocks.gradeAssignmentSubmission).not.toHaveBeenCalled()
  })

  it("returns 404 when the submission is outside the assignment", async () => {
    const response = await POST(
      request({ schoolId }),
      context("00000000-0000-4000-8000-000000000099")
    )

    expect(response.status).toBe(404)
    expect(mocks.gradeAssignmentSubmission).not.toHaveBeenCalled()
  })

  it("grades with the authenticated teacher id and writes an audit event", async () => {
    const response = await POST(
      request({
        schoolId,
        feedback: { en: "Good work." },
        itemGrades: [{ assignmentItemId: itemId, score: 2 }],
      }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.submission.status).toBe("graded")
    expect(mocks.gradeAssignmentSubmission).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      submissionId,
      gradedBy: "teacher-user-1",
      request: expect.objectContaining({ feedback: { en: "Good work." } }),
    })
    expect(mocks.insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "assignment.submission_graded",
        targetId: submissionId,
      })
    )
  })

  it("returns a generic 500 when grading fails", async () => {
    mocks.gradeAssignmentSubmission.mockRejectedValue(new Error("bad transition"))

    const response = await POST(request({ schoolId }), context())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not grade submission.")
  })
})
