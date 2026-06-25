import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClassroom: vi.fn(),
  insertAuditEvent: vi.fn(),
  listClassroomsForTeacher: vi.fn(),
  requireApiSchoolAccess: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  createClassroom: mocks.createClassroom,
  insertAuditEvent: mocks.insertAuditEvent,
  listClassroomsForTeacher: mocks.listClassroomsForTeacher,
}))

vi.mock("@/lib/auth/classrooms", () => ({
  requireApiSchoolAccess: mocks.requireApiSchoolAccess,
}))

vi.mock("@/lib/site", () => ({
  appUrl: "https://app.learnify.academy",
}))

const { POST } = await import("./route")

function createRequest(body: Record<string, unknown>) {
  return new Request("http://learnify.test/api/classrooms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/classrooms", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiSchoolAccess.mockResolvedValue({
      serviceSupabase: { from: vi.fn() },
      user: { id: "teacher-user-1" },
      membership: { id: "teacher-membership-1" },
    })
    mocks.createClassroom.mockResolvedValue({
      classroom: {
        id: "classroom-1",
        name: "Physics 6A",
        slug: "physics-6a-a1b2c3",
        subject_label: "Physics",
      },
      rawJoinToken: "raw-join-token",
    })
    mocks.insertAuditEvent.mockResolvedValue({})
  })

  it("creates a classroom and returns a locale-specific one-time join URL", async () => {
    const response = await POST(
      createRequest({
        schoolId: "00000000-0000-4000-8000-000000000001",
        locale: "th",
        name: "Physics 6A",
        subjectLabel: "Physics",
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.joinUrl).toBe(
      "https://app.learnify.academy/th/app/join/raw-join-token"
    )
    expect(mocks.createClassroom).toHaveBeenCalledWith({
      supabase: expect.anything(),
      schoolId: "00000000-0000-4000-8000-000000000001",
      ownerMembershipId: "teacher-membership-1",
      request: expect.objectContaining({
        locale: "th",
        name: "Physics 6A",
      }),
    })
  })
})
