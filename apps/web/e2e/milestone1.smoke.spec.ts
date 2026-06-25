import fs from "node:fs"
import path from "node:path"
import { expect, test } from "@playwright/test"

const authStatePath =
  process.env.PLAYWRIGHT_AUTH_STATE ??
  path.join(process.cwd(), "playwright", ".auth", "beta-user.json")
const teacherAuthStatePath =
  process.env.PLAYWRIGHT_TEACHER_AUTH_STATE ??
  path.join(process.cwd(), "playwright", ".auth", "teacher-user.json")
const schoolAdminAuthStatePath =
  process.env.PLAYWRIGHT_SCHOOL_ADMIN_AUTH_STATE ??
  path.join(process.cwd(), "playwright", ".auth", "school-admin-user.json")
const adminAuthStatePath =
  process.env.PLAYWRIGHT_ADMIN_AUTH_STATE ??
  path.join(process.cwd(), "playwright", ".auth", "admin-user.json")

test.describe("Milestone 1 public and gated routes", () => {
  test("renders the localized landing page", async ({ request }) => {
    const response = await request.get("/en")

    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain("LEARNIFY")
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

  test("redirects unauthenticated classroom and school pages to login", async ({
    request,
  }) => {
    for (const pathName of [
      "/en/app/classrooms",
      "/en/app/classrooms/physics-6a-2026-demo",
      "/en/app/classrooms/physics-6a-2026-demo/roster",
      "/en/app/school",
      "/en/app/school/users",
      "/en/app/school/invites",
      "/en/app/admin/schools",
      "/en/app/join",
      "/en/app/join/raw-token",
      "/en/app/invites/raw-token",
    ]) {
      const response = await request.get(pathName, { maxRedirects: 0 })

      expect(response.status(), pathName).toBe(307)
      expect(response.headers().location, pathName).toBe("/en/auth/login")
    }
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
    expect(await dashboard.text()).toContain("Student dashboard")

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

test.describe("Milestone 3 optional classroom role pages", () => {
  test.skip(
    !fs.existsSync(teacherAuthStatePath),
    "Set PLAYWRIGHT_TEACHER_AUTH_STATE to run teacher classroom smoke tests."
  )

  test.use({ storageState: teacherAuthStatePath })

  test("renders teacher classroom shell", async ({ request }) => {
    const classrooms = await request.get("/en/app/classrooms")
    expect(classrooms.ok()).toBe(true)
    expect(await classrooms.text()).toContain("Classrooms")

    const seededClassroom = await request.get(
      "/en/app/classrooms/physics-6a-2026-demo"
    )
    expect(seededClassroom.ok()).toBe(true)
    expect(await seededClassroom.text()).toContain("Class code")

    const roster = await request.get(
      "/en/app/classrooms/physics-6a-2026-demo/roster"
    )
    expect(roster.ok()).toBe(true)
    expect(await roster.text()).toContain("Pending join requests")
  })
})

test.describe("Milestone 3 optional school admin pages", () => {
  test.skip(
    !fs.existsSync(schoolAdminAuthStatePath),
    "Set PLAYWRIGHT_SCHOOL_ADMIN_AUTH_STATE to run school admin smoke tests."
  )

  test.use({ storageState: schoolAdminAuthStatePath })

  test("renders school admin users and invites", async ({ request }) => {
    const school = await request.get("/en/app/school")
    expect(school.ok()).toBe(true)
    expect(await school.text()).toContain("Notifications")

    const users = await request.get("/en/app/school/users")
    expect(users.ok()).toBe(true)
    expect(await users.text()).toContain("teacher")

    const invites = await request.get("/en/app/school/invites")
    expect(invites.ok()).toBe(true)
    expect(await invites.text()).toContain("Pending invites")
  })
})

test.describe("Milestone 3 optional student classroom pages", () => {
  test.skip(
    !fs.existsSync(authStatePath),
    "Set PLAYWRIGHT_AUTH_STATE to run student classroom smoke tests."
  )

  test.use({ storageState: authStatePath })

  test("renders classroom join page and pending requests", async ({ request }) => {
    const join = await request.get("/en/app/join")
    expect(join.ok()).toBe(true)
    expect(await join.text()).toContain("Pending join requests")
  })
})

test.describe("Milestone 3 optional Learnify admin pages", () => {
  test.skip(
    !fs.existsSync(adminAuthStatePath),
    "Set PLAYWRIGHT_ADMIN_AUTH_STATE to run Learnify admin smoke tests."
  )

  test.use({ storageState: adminAuthStatePath })

  test("renders school contract overview", async ({ request }) => {
    const schools = await request.get("/en/app/admin/schools")
    expect(schools.ok()).toBe(true)
    expect(await schools.text()).toContain("School contracts")
  })
})
