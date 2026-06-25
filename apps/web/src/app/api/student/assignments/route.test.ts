import { NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  listStudentAssignments: vi.fn(),
  requireApiAuth: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  listStudentAssignments: mocks.listStudentAssignments,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiAuth: mocks.requireApiAuth,
}))

const { GET } = await import("./route")

const studentUserId = "00000000-0000-4000-8000-000000000001"
const assignmentId = "00000000-0000-4000-8000-000000000002"

describe("/api/student/assignments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiAuth.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: studentUserId },
    })
    mocks.listStudentAssignments.mockResolvedValue([
      {
        assignment: { id: assignmentId, status: "published" },
        recipient: { id: "recipient-1" },
        submission: null,
      },
    ])
  })

  it("returns repository-provided student assignments", async () => {
    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assignments).toHaveLength(1)
    expect(payload.assignments[0].assignment.id).toBe(assignmentId)
    expect(mocks.listStudentAssignments).toHaveBeenCalledWith({
      supabase: expect.anything(),
      studentUserId,
    })
  })

  it("passes through unauthenticated auth helper responses", async () => {
    mocks.requireApiAuth.mockResolvedValue({
      response: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      ),
    })

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe("Authentication is required.")
    expect(mocks.listStudentAssignments).not.toHaveBeenCalled()
  })

  it("returns a generic 500 when the repository fails", async () => {
    mocks.listStudentAssignments.mockRejectedValue(new Error("db exploded"))

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not list assignments.")
  })
})
