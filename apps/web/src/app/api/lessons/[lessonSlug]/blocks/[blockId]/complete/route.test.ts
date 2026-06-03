import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  completeLessonBlock: vi.fn(),
  requireApiBetaUser: vi.fn(),
}))

vi.mock("@learnify/database", () => ({
  completeLessonBlock: mocks.completeLessonBlock,
}))

vi.mock("@/lib/auth/api", () => ({
  requireApiBetaUser: mocks.requireApiBetaUser,
}))

const { POST } = await import("./route")

function createRequest() {
  return new Request(
    "http://learnify.test/api/lessons/gravity-and-falling-objects/blocks/gravity-intro/complete",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en" }),
    }
  )
}

describe("POST /api/lessons/[lessonSlug]/blocks/[blockId]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApiBetaUser.mockResolvedValue({
      supabase: { from: vi.fn() },
      user: { id: "user-1" },
    })
    mocks.completeLessonBlock.mockResolvedValue({
      blockProgress: {},
      lessonProgress: {},
    })
  })

  it("returns a generic error when block completion fails", async () => {
    mocks.completeLessonBlock.mockRejectedValueOnce(
      new Error("permission denied for table lesson_block_progress")
    )

    const response = (await POST(createRequest(), {
      params: Promise.resolve({
        lessonSlug: "gravity-and-falling-objects",
        blockId: "gravity-intro",
      }),
    })) as Response
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not complete lesson block.")
    expect(payload.error).not.toContain("permission denied")
  })

  it("does not expose direct question block completion failures", async () => {
    mocks.completeLessonBlock.mockRejectedValueOnce(
      new Error("Question blocks must be completed through question attempts.")
    )

    const response = (await POST(createRequest(), {
      params: Promise.resolve({
        lessonSlug: "gravity-and-falling-objects",
        blockId: "gravity-question",
      }),
    })) as Response
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe("Could not complete lesson block.")
    expect(payload.error).not.toContain("Question blocks")
  })
})
