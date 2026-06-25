import { afterEach, describe, expect, it, vi } from "vitest"
import { inviteTokenResponse, sendInviteEmail, shouldExposeInviteToken } from "./invites"

describe("invite token response policy", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("exposes invite tokens outside production for local testing", () => {
    const env = { NODE_ENV: "test" }

    expect(shouldExposeInviteToken(env)).toBe(true)
    expect(inviteTokenResponse("raw-token", env)).toEqual({
      inviteToken: "raw-token",
    })
  })

  it("omits invite tokens in production responses", () => {
    const env = { NODE_ENV: "production" }

    expect(shouldExposeInviteToken(env)).toBe(false)
    expect(inviteTokenResponse("raw-token", env)).toEqual({})
  })

  it("sends school invite emails to the browser invite landing page", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }))

    await expect(
      sendInviteEmail(
        {
          to: "teacher@example.com",
          token: "school-token",
          locale: "en",
          kind: "teacher",
          schoolName: "Demo School",
        },
        {
          RESEND_API_KEY: "resend-key",
          NEXT_PUBLIC_APP_URL: "https://app.learnify.academy",
        }
      )
    ).resolves.toEqual({ sent: true, skipped: false })

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      text: string
      html: string
    }
    expect(body.text).toContain(
      "https://app.learnify.academy/en/app/invites/school-token"
    )
    expect(body.html).not.toContain("/api/school/invites/accept")
  })

  it("sends student invite emails to the join landing page", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }))

    await sendInviteEmail(
      {
        to: "student@example.com",
        token: "student-token",
        locale: "th",
        kind: "student",
        schoolName: "Demo School",
        classroomName: "Physics 6A",
      },
      {
        RESEND_API_KEY: "resend-key",
        NEXT_PUBLIC_APP_URL: "https://app.learnify.academy/",
      }
    )

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      text: string
      html: string
    }
    expect(body.text).toContain(
      "https://app.learnify.academy/th/app/join/student-token"
    )
    expect(body.text).toContain("คำเชิญจาก Learnify")
    expect(body.text).toContain("ยอมรับคำเชิญ")
    expect(body.html).toContain("ยอมรับคำเชิญ")
    expect(body.html).not.toContain("/api/classrooms/student-invites/accept")
  })
})
