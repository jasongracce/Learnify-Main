import { describe, expect, it } from "vitest"
import { inviteTokenResponse, shouldExposeInviteToken } from "./invites"

describe("invite token response policy", () => {
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
})
