import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClassroomById: vi.fn(),
  getTeacherAssignmentDetail: vi.fn(),
  insertAuditEvent: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
  updateAssignmentDraft: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getClassroomById: mocks.getClassroomById,
  getTeacherAssignmentDetail: mocks.getTeacherAssignmentDetail,
  insertAuditEvent: mocks.insertAuditEvent,
  updateAssignmentDraft: mocks.updateAssignmentDraft,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { GET, PATCH } = await import("./route")

const schoolId = "00000000-0000-4000-8000-000000000001"
const classroomId = "00000000-0000-4000-8000-000000000002"
const assignmentId = "00000000-0000-4000-8000-000000000003"

function assignmentDetail(status = "draft") {
  return {
    assignment: {
      id: assignmentId,
      school_id: schoolId,
      classroom_id: classroomId,
      assignment_type: "mixed",
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

function getRequest(querySchoolId = schoolId) {
  return new Request(
    `http://learnify.test/api/assignments/${assignmentId}?schoolId=${querySchoolId}`
  )
}

function patchRequest(body: Record<string, unknown> | string) {
  return new Request(`http://learnify.test/api/assignments/${assignmentId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

describe("/api/assignments/[assignmentId]", () => {
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
    mocks.updateAssignmentDraft.mockResolvedValue(assignmentDetail())
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("returns teacher assignment detail only for the classroom owner", async () => {
    const response = await GET(getRequest(), context())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assignment.assignment.id).toBe(assignmentId)
    expect(mocks.getTeacherAssignmentDetail).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
    })
  })

  it("hides assignments from a different school", async () => {
    mocks.getTeacherAssignmentDetail.mockResolvedValue({
      ...assignmentDetail(),
      assignment: {
        ...assignmentDetail().assignment,
        school_id: "00000000-0000-4000-8000-000000000099",
      },
    })

    const response = await GET(getRequest(), context())
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe("Assignment not found.")
  })

  it("rejects patch requests for assignments the teacher does not own", async () => {
    mocks.getClassroomById.mockResolvedValue({
      id: classroomId,
      school_id: schoolId,
      owner_membership_id: "another-membership",
    })

    const response = await PATCH(
      patchRequest({ schoolId, title: { en: "Updated title" } }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.error).toBe("Only the classroom owner can manage assignments.")
    expect(mocks.updateAssignmentDraft).not.toHaveBeenCalled()
  })

  it("validates patch request bodies", async () => {
    const response = await PATCH(
      patchRequest({ schoolId, title: { en: "" } }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid assignment data.")
    expect(payload.issues.title).toBeDefined()
  })

  it("updates owned assignment drafts and writes an audit event", async () => {
    const response = await PATCH(
      patchRequest({ schoolId, title: { en: "Updated title" } }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assignment.assignment.id).toBe(assignmentId)
    expect(mocks.updateAssignmentDraft).toHaveBeenCalledWith({
      supabase: expect.anything(),
      assignmentId,
      request: expect.objectContaining({
        title: { en: "Updated title" },
      }),
    })
    expect(mocks.insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "assignment.updated",
        targetType: "assignment",
        targetId: assignmentId,
        metadata: {
          classroomId,
          assignmentType: "mixed",
          status: "draft",
        },
      })
    )
  })

  it("returns a generic 500 when updating fails", async () => {
    mocks.updateAssignmentDraft.mockRejectedValue(new Error("draft locked"))

    const response = await PATCH(
      patchRequest({ schoolId, title: { en: "Updated title" } }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not update assignment.")
  })
})
