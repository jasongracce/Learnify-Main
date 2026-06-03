import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getLessonBlockBySlug: vi.fn(),
  getPublishedLessonBySlug: vi.fn(),
  getQuestionForLesson: vi.fn(),
  recordQuestionAttempt: vi.fn(),
  requireApiBetaUser: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  getLessonBlockBySlug: mocks.getLessonBlockBySlug,
  getPublishedLessonBySlug: mocks.getPublishedLessonBySlug,
  getQuestionForLesson: mocks.getQuestionForLesson,
  recordQuestionAttempt: mocks.recordQuestionAttempt,
}))

vi.mock("@/lib/auth/api", () => ({
  requireApiBetaUser: mocks.requireApiBetaUser,
}))

const { POST } = await import("./route")

function createRequest() {
  return new Request("http://learnify.test/api/questions/attempt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lessonSlug: "gravity-and-falling-objects",
      blockId: "gravity-question",
      questionId: "q-gravity-001",
      selectedOptionId: "b",
      locale: "en",
    }),
  })
}

describe("POST /api/questions/attempt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiBetaUser.mockResolvedValue({
      supabase: { from: vi.fn() },
      user: { id: "user-1" },
    })
    mocks.getPublishedLessonBySlug.mockResolvedValue({
      id: "lesson-1",
      slug: "gravity-and-falling-objects",
      status: "published",
    })
    mocks.getLessonBlockBySlug.mockResolvedValue({
      id: "block-1",
      type: "multiple_choice",
    })
    mocks.getQuestionForLesson.mockResolvedValue({
      id: "question-1",
      correct_answer: { option_id: "b" },
    })
    mocks.recordQuestionAttempt.mockResolvedValue({
      attempt: {},
      skillMastery: null,
      blockProgress: null,
      lessonProgress: {},
    })
  })

  it("returns a generic error when recording fails", async () => {
    mocks.recordQuestionAttempt.mockRejectedValueOnce(
      new Error("insert violates row-level security policy")
    )

    const response = (await POST(createRequest())) as Response
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not record question attempt.")
    expect(payload.error).not.toContain("row-level security")
  })

  it("does not expose internal answer-key configuration failures", async () => {
    mocks.getQuestionForLesson.mockResolvedValueOnce({
      id: "question-1",
      correct_answer: null,
    })

    const response = (await POST(createRequest())) as Response
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not record question attempt.")
    expect(payload.error).not.toContain("answer key")
  })

  it("returns 404 when the requested question does not exactly match", async () => {
    mocks.getQuestionForLesson.mockResolvedValueOnce(null)

    const response = (await POST(createRequest())) as Response
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe("Question not found.")
    expect(mocks.recordQuestionAttempt).not.toHaveBeenCalled()
  })
})
