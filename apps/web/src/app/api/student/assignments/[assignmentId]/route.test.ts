import { NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getStudentAssignmentDetail: vi.fn(),
  requireApiAuth: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getStudentAssignmentDetail: mocks.getStudentAssignmentDetail,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { GET } = await import("./route")

const studentUserId = "00000000-0000-4000-8000-000000000001"
const assignmentId = "00000000-0000-4000-8000-000000000002"

function context() {
  return { params: Promise.resolve({ assignmentId }) }
}

describe("/api/student/assignments/[assignmentId]", () => {
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
  })

  it("returns student assignment detail", async () => {
    const response = await GET(
      new Request(`http://learnify.test/api/student/assignments/${assignmentId}`),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assignment.assignment.id).toBe(assignmentId)
    expect(mocks.getStudentAssignmentDetail).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      studentUserId,
    })
  })

  it("returns 404 when the repository returns null", async () => {
    mocks.getStudentAssignmentDetail.mockResolvedValue(null)

    const response = await GET(
      new Request(`http://learnify.test/api/student/assignments/${assignmentId}`),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe("Assignment not found.")
  })

  it("passes through unauthenticated auth helper responses", async () => {
    mocks.requireApiAuth.mockResolvedValue({
      response: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      ),
    })

    const response = await GET(
      new Request(`http://learnify.test/api/student/assignments/${assignmentId}`),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe("Authentication is required.")
    expect(mocks.getStudentAssignmentDetail).not.toHaveBeenCalled()
  })
})
