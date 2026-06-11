import { describe, expect, it } from "vitest"
import {
  buildInviteExpiresAt,
  generateClassroomSlug,
  generateJoinCode,
  generateRawToken,
  generateSchoolSlug,
  hashToken,
  isInviteExpired,
  normalizeInviteEmail,
  normalizeSubject,
} from "../index"

describe("normalizeInviteEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeInviteEmail("  Teacher@School.AC.TH ")).toBe(
      "teacher@school.ac.th"
    )
  })
})

describe("normalizeSubject", () => {
  it("maps physics-like labels to physics", () => {
    expect(normalizeSubject("Physics 6A")).toBe("physics")
    expect(normalizeSubject("thermodynamics")).toBe("physics")
  })

  it("maps math-like labels to mathematics", () => {
    expect(normalizeSubject("Algebra II")).toBe("mathematics")
  })

  it("returns null for unrecognized labels", () => {
    expect(normalizeSubject("Underwater Basket Weaving")).toBeNull()
  })
})

describe("generateClassroomSlug", () => {
  it("lowercases, hyphenates, and appends random noise", () => {
    const slug = generateClassroomSlug("Physics 6A 2026")
    expect(slug).toMatch(/^physics-6a-2026-[0-9a-f]{6}$/)
  })

  it("strips characters outside a-z0-9, space, hyphen", () => {
    const slug = generateClassroomSlug("M.3/1 วิทย์ Physics!")
    expect(slug).toMatch(/^m31-physics-[0-9a-f]{6}$/)
  })

  it("produces different slugs for the same name", () => {
    expect(generateClassroomSlug("Same Name")).not.toBe(
      generateClassroomSlug("Same Name")
    )
  })
})

describe("generateSchoolSlug", () => {
  it("is deterministic with no noise suffix", () => {
    expect(generateSchoolSlug("Bangkok Demo School")).toBe(
      "bangkok-demo-school"
    )
  })
})

describe("generateJoinCode", () => {
  it("is 6 chars from the unambiguous charset (no 0, O, 1, I)", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateJoinCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it("does not collide across many draws", () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateJoinCode()))
    // Collisions are theoretically possible; near-total uniqueness is the bar.
    expect(codes.size).toBeGreaterThan(990)
  })
})

describe("tokens", () => {
  it("generates 64-char hex raw tokens", () => {
    expect(generateRawToken()).toMatch(/^[0-9a-f]{64}$/)
  })

  it("hashes deterministically and never equals the raw token", () => {
    const raw = generateRawToken()
    expect(hashToken(raw)).toBe(hashToken(raw))
    expect(hashToken(raw)).not.toBe(raw)
  })
})

describe("invite expiry", () => {
  const issued = new Date("2026-06-11T00:00:00.000Z")

  it("expires 14 days after issue (contract §5)", () => {
    expect(buildInviteExpiresAt(issued)).toBe("2026-06-25T00:00:00.000Z")
  })

  it("is not expired one minute before the deadline", () => {
    const expiresAt = buildInviteExpiresAt(issued)
    expect(
      isInviteExpired(expiresAt, new Date("2026-06-24T23:59:00.000Z"))
    ).toBe(false)
  })

  it("is expired one minute after the deadline", () => {
    const expiresAt = buildInviteExpiresAt(issued)
    expect(
      isInviteExpired(expiresAt, new Date("2026-06-25T00:01:00.000Z"))
    ).toBe(true)
  })
})
