import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getStudentAssignmentDetail: vi.fn(),
  recordAssignmentQuizAttempt: vi.fn(),
  requireApiAuth: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getStudentAssignmentDetail: mocks.getStudentAssignmentDetail,
  recordAssignmentQuizAttempt: mocks.recordAssignmentQuizAttempt,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { POST } = await import("./route")

const studentUserId = "00000000-0000-4000-8000-000000000001"
const assignmentId = "00000000-0000-4000-8000-000000000002"
const assignmentItemId = "00000000-0000-4000-8000-000000000003"
const questionId = "00000000-0000-4000-8000-000000000004"

function context() {
  return { params: Promise.resolve({ assignmentId }) }
}

function request(body: Record<string, unknown> | string) {
  return new Request(
    `http://learnify.test/api/student/assignments/${assignmentId}/quiz-attempt`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }
  )
}

function validBody() {
  return {
    assignmentItemId,
    questionId,
    selectedAnswer: { optionId: "b" },
    attemptNumber: 1,
    timeSpentSeconds: 12,
  }
}

describe("/api/student/assignments/[assignmentId]/quiz-attempt", () => {
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
    mocks.recordAssignmentQuizAttempt.mockResolvedValue({
      id: "item-submission-1",
      assignment_item_id: assignmentItemId,
      attempts_count: 1,
    })
  })

  it("validates request bodies", async () => {
    const response = await POST(
      request({ assignmentItemId, selectedAnswer: {} }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid quiz attempt data.")
    expect(payload.issues.questionId).toBeDefined()
    expect(mocks.recordAssignmentQuizAttempt).not.toHaveBeenCalled()
  })

  it("records a quiz attempt with the authenticated student user id", async () => {
    const response = await POST(request(validBody()), context())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.itemSubmission.id).toBe("item-submission-1")
    expect(mocks.recordAssignmentQuizAttempt).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      studentUserId,
      request: expect.objectContaining({
        assignmentItemId,
        questionId,
        selectedAnswer: { optionId: "b" },
        attemptNumber: 1,
        timeSpentSeconds: 12,
      }),
    })
  })

  it("returns 404 when the assignment is not visible to the student", async () => {
    mocks.getStudentAssignmentDetail.mockResolvedValue(null)

    const response = await POST(request(validBody()), context())
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe("Assignment not found.")
    expect(mocks.recordAssignmentQuizAttempt).not.toHaveBeenCalled()
  })
})
