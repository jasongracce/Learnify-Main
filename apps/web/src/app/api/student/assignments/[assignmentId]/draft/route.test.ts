import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getStudentAssignmentDetail: vi.fn(),
  requireApiAuth: vi.fn(),
  saveStudentAssignmentDraft: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getStudentAssignmentDetail: mocks.getStudentAssignmentDetail,
  saveStudentAssignmentDraft: mocks.saveStudentAssignmentDraft,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { POST } = await import("./route")

const studentUserId = "00000000-0000-4000-8000-000000000001"
const assignmentId = "00000000-0000-4000-8000-000000000002"
const assignmentItemId = "00000000-0000-4000-8000-000000000003"

function context() {
  return { params: Promise.resolve({ assignmentId }) }
}

function request(body: Record<string, unknown> | string) {
  return new Request(
    `http://learnify.test/api/student/assignments/${assignmentId}/draft`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }
  )
}

function validBody() {
  return {
    itemSubmissions: [
      {
        assignmentItemId,
        answerJson: { text: "My draft answer" },
      },
    ],
  }
}

describe("/api/student/assignments/[assignmentId]/draft", () => {
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
    mocks.saveStudentAssignmentDraft.mockResolvedValue({
      submission: {
        id: "submission-1",
        assignment_id: assignmentId,
        status: "draft",
        submitted_at: null,
        late: false,
        score: null,
        max_score: 10,
      },
      itemSubmissions: [{ id: "item-submission-1" }],
      version: { version_number: 1 },
    })
  })

  it("validates request bodies", async () => {
    const response = await POST(request({ itemSubmissions: [] }), context())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid assignment draft data.")
    expect(payload.issues.itemSubmissions).toBeDefined()
    expect(mocks.saveStudentAssignmentDraft).not.toHaveBeenCalled()
  })

  it("saves draft answers with the authenticated student user id", async () => {
    const response = await POST(request(validBody()), context())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.submission.id).toBe("submission-1")
    expect(payload.itemSubmissions).toHaveLength(1)
    expect(payload.receipt).toEqual({
      submissionId: "submission-1",
      assignmentId,
      status: "draft",
      submittedAt: null,
      late: false,
      score: null,
      maxScore: 10,
      versionNumber: 1,
    })
    expect(mocks.saveStudentAssignmentDraft).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      studentUserId,
      request: expect.objectContaining({
        itemSubmissions: [
          {
            assignmentItemId,
            answerJson: { text: "My draft answer" },
          },
        ],
      }),
    })
  })

  it("returns 404 when the student is not assigned", async () => {
    mocks.getStudentAssignmentDetail.mockResolvedValue(null)

    const response = await POST(request(validBody()), context())
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe("Assignment not found.")
    expect(mocks.saveStudentAssignmentDraft).not.toHaveBeenCalled()
  })
})
