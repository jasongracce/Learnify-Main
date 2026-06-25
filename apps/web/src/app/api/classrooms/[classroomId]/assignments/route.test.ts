import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createAssignmentDraft: vi.fn(),
  getClassroomById: vi.fn(),
  insertAuditEvent: vi.fn(),
  listAssignmentsForClassroom: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createAssignmentDraft: mocks.createAssignmentDraft,
  getClassroomById: mocks.getClassroomById,
  insertAuditEvent: mocks.insertAuditEvent,
  listAssignmentsForClassroom: mocks.listAssignmentsForClassroom,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

const { GET, POST } = await import("./route")

const schoolId = "00000000-0000-4000-8000-000000000001"
const classroomId = "00000000-0000-4000-8000-000000000002"
const assignmentId = "00000000-0000-4000-8000-000000000003"

function createPostRequest(body: Record<string, unknown> | string) {
  return new Request(
    `http://learnify.test/api/classrooms/${classroomId}/assignments`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }
  )
}

function createGetRequest() {
  return new Request(
    `http://learnify.test/api/classrooms/${classroomId}/assignments?schoolId=${schoolId}`
  )
}

function context() {
  return { params: Promise.resolve({ classroomId }) }
}

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

describe("/api/classrooms/[classroomId]/assignments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1" },
      membership: { id: "teacher-membership-1" },
    })
    mocks.getClassroomById.mockResolvedValue({
      id: classroomId,
      school_id: schoolId,
      owner_membership_id: "teacher-membership-1",
    })
    mocks.createAssignmentDraft.mockResolvedValue(assignmentDetail())
    mocks.listAssignmentsForClassroom.mockResolvedValue([
      assignmentDetail().assignment,
    ])
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("validates create assignment draft request bodies", async () => {
    const response = await POST(createPostRequest({ schoolId }), context())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe("Invalid assignment data.")
    expect(payload.issues.title).toBeDefined()
    expect(mocks.requireApiSchoolAccess).not.toHaveBeenCalled()
  })

  it("creates an assignment draft for the classroom owner with createdBy", async () => {
    const response = await POST(
      createPostRequest({
        schoolId,
        title: { en: "Gravity practice" },
        assignmentType: "quiz",
        totalPoints: 10,
      }),
      context()
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.assignment.assignment.id).toBe(assignmentId)
    expect(mocks.createAssignmentDraft).toHaveBeenCalledWith({
      supabase: expect.anything(),
      createdBy: "teacher-user-1",
      request: expect.objectContaining({
        schoolId,
        classroomId,
        assignmentType: "quiz",
      }),
    })
    expect(mocks.insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "assignment.created",
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

  it("rejects listing assignments for a classroom the teacher does not own", async () => {
    mocks.getClassroomById.mockResolvedValue({
      id: classroomId,
      school_id: schoolId,
      owner_membership_id: "another-membership",
    })

    const response = await GET(createGetRequest(), context())
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.error).toBe("Only the classroom owner can manage assignments.")
    expect(mocks.listAssignmentsForClassroom).not.toHaveBeenCalled()
  })

  it("lists classroom assignments for the classroom owner", async () => {
    const response = await GET(createGetRequest(), context())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assignments).toHaveLength(1)
    expect(mocks.listAssignmentsForClassroom).toHaveBeenCalledWith({
      supabase: expect.anything(),
      classroomId,
    })
  })

  it("returns a generic 500 when the repository fails", async () => {
    mocks.listAssignmentsForClassroom.mockRejectedValue(new Error("db exploded"))

    const response = await GET(createGetRequest(), context())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not list assignments.")
  })
})
