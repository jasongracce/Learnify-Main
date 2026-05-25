import { describe, expect, it } from "vitest"
import { formatLumiSourceKind, getLumiSourceDisplay } from "./lumi-sources"

describe("Lumi source display", () => {
  it("labels verified RAG chunks as verified sources", () => {
    expect(formatLumiSourceKind("verified_rag_chunk")).toBe("verified source")
  })

  it("uses source title and lesson link when available", () => {
    expect(
      getLumiSourceDisplay({
        locale: "en",
        source: {
          id: "rag:chunk-1",
          title: "Gravity and Falling Objects",
          kind: "verified_rag_chunk",
          lessonSlug: "gravity-and-falling-objects",
          courseSlug: "physics-foundations",
        },
      })
    ).toEqual({
      text: "Gravity and Falling Objects (verified source)",
      href: "/en/app/lessons/gravity-and-falling-objects",
    })
  })

  it("falls back to source id when no title is provided", () => {
    expect(
      getLumiSourceDisplay({
        locale: "th",
        source: {
          id: "skill:net-force",
          kind: "skill",
        },
      })
    ).toEqual({
      text: "skill:net-force (skill)",
    })
  })
})
