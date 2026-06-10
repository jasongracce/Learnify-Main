import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

const authStatePath =
  process.env.PLAYWRIGHT_AUTH_STATE ??
  path.join(process.cwd(), "playwright", ".auth", "beta-user.json")

test.describe("Milestone 1 public and gated routes", () => {
  test("renders the localized landing page", async ({ request }) => {
    const response = await request.get("/en")

    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain("Learnify.")
  })

  test("redirects unauthenticated lesson traffic to login", async ({
    request,
  }) => {
    const response = await request.get(
      "/en/app/lessons/gravity-and-falling-objects",
      {
        maxRedirects: 0,
      }
    )

    expect(response.status()).toBe(307)
    expect(response.headers().location).toBe("/en/auth/login")
  })

  test("requires auth for Lumi chat API", async ({ request }) => {
    const response = await request.post("/api/lumi/chat", {
      data: {
        message: "Why does gravity make things speed up?",
        locale: "en",
        currentLessonSlug: "gravity-and-falling-objects",
      },
    })
    const body = (await response.json()) as { redirectTo?: string }

    expect(response.status()).toBe(401)
    expect(body.redirectTo).toBe("/en/auth/login")
  })
})

test.describe("Milestone 1 signed-in beta flow", () => {
  test.skip(
    !fs.existsSync(authStatePath),
    "Set PLAYWRIGHT_AUTH_STATE to a saved beta-user storage state to run signed-in smoke tests."
  )

  test.use({ storageState: authStatePath })

  test("renders dashboard, lesson, and insights", async ({ request }) => {
    const dashboard = await request.get("/en/app/dashboard")
    expect(dashboard.ok()).toBe(true)
    expect(await dashboard.text()).toContain("Welcome back")

    const lesson = await request.get(
      "/en/app/lessons/gravity-and-falling-objects"
    )
    expect(lesson.ok()).toBe(true)
    const lessonHtml = await lesson.text()
    expect(lessonHtml).toContain("Gravity and Falling Objects")
    expect(lessonHtml).toContain("Ask Lumi about this lesson")

    const insights = await request.get("/en/app/insights")
    expect(insights.ok()).toBe(true)
    expect(await insights.text()).toContain("Recommended action")
  })
})
