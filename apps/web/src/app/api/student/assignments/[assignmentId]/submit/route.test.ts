import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getStudentAssignmentDetail: vi.fn(),
  requireApiAuth: vi.fn(),
  submitStudentAssignment: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getStudentAssignmentDetail: mocks.getStudentAssignmentDetail,
  submitStudentAssignment: mocks.submitStudentAssignment,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { POST } = await import("./route")

const studentUserId = "00000000-0000-4000-8000-000000000001"
const assignmentId = "00000000-0000-4000-8000-000000000002"
const assignmentItemId = "00000000-0000-4000-8000-000000000003"
const submittedAt = "2026-06-25T10:00:00.000Z"

function context() {
  return { params: Promise.resolve({ assignmentId }) }
}

function request(body: Record<string, unknown> | string) {
  return new Request(
    `http://learnify.test/api/student/assignments/${assignmentId}/submit`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }
  )
}

function validBody() {
  return {
    submittedAt,
    itemSubmissions: [
      {
        assignmentItemId,
        answerJson: { text: "Final answer" },
      },
    ],
  }
}

describe("/api/student/assignments/[assignmentId]/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: studentUserId },
    })
    mocks.getStudentAssignmentDetail.mockResolvedValue({
      assignment: { id: assignmentId, status: "published" },
      items: [],
      quizQuestions: [],
      recipient: { id: "recipient-1" },
      submission: null,
      itemSubmissions: [],
      attachments: [],
    })
    mocks.submitStudentAssignment.mockResolvedValue({
      submission: {
        id: "submission-1",
        assignment_id: assignmentId,
        status: "submitted",
        submitted_at: submittedAt,
        late: false,
        score: 8,
        max_score: 10,
      },
      itemSubmissions: [{ id: "item-submission-1" }],
      version: { version_number: 2 },
    })
  })

  it("validates request bodies", async () => {
    const response = await POST(request("{"), context())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid assignment submission data.")
    expect(mocks.submitStudentAssignment).not.toHaveBeenCalled()
  })

  it("submits work and returns receipt fields", async () => {
    const response = await POST(request(validBody()), context())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.receipt).toEqual({
      submissionId: "submission-1",
      assignmentId,
      status: "submitted",
      submittedAt,
      late: false,
      score: 8,
      maxScore: 10,
      versionNumber: 2,
    })
    expect(mocks.submitStudentAssignment).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      studentUserId,
      request: expect.objectContaining({
        submittedAt,
      }),
    })
  })

  it("returns a generic 500 when the repository fails", async () => {
    mocks.submitStudentAssignment.mockRejectedValue(new Error("incomplete"))

    const response = await POST(request(validBody()), context())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not submit assignment.")
  })
})
