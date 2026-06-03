import { describe, expect, it } from "vitest"
import { lumiChatResponseSchema } from "@learnify/shared"
import {
  buildLumiChatPrompt,
  chatWithLumiAi,
  createUnavailableAiProvider,
  filterEligibleLumiSources,
  type AiSource,
  type AiStructuredProvider,
  type LumiAiChatInput,
} from "../index"

const sources: AiSource[] = [
  {
    id: "lesson-gravity",
    kind: "published_lesson",
    title: "Gravity and Falling Objects",
    content: "Gravity creates downward acceleration while objects fall.",
    lessonSlug: "gravity-and-falling-objects",
    status: "published",
  },
  {
    id: "draft-projectile",
    kind: "published_lesson",
    title: "Projectile Draft",
    content: "Draft content should not be used.",
    lessonSlug: "projectile-motion",
    status: "draft",
  },
  {
    id: "rag-verified",
    kind: "verified_rag_chunk",
    content: "Verified curriculum note about gravitational acceleration.",
    verified: true,
  },
  {
    id: "rag-unverified",
    kind: "verified_rag_chunk",
    content: "Unverified note should not be used.",
    verified: false,
  },
  {
    id: "question-gravity",
    kind: "question",
    content: "If gravity increases, falling acceleration increases.",
    lessonSlug: "gravity-and-falling-objects",
    status: "published",
  },
]

const request: LumiAiChatInput = {
  userId: "user-1",
  message: "Why does gravity make things speed up?",
  locale: "en",
  currentLessonSlug: "gravity-and-falling-objects",
  weakSkills: [
    {
      skillId: "skill-gravity",
      title: "Understanding gravitational acceleration",
      confidence: "low",
    },
  ],
  recentMistakes: [
    {
      questionId: "question-1",
      lessonSlug: "gravity-and-falling-objects",
      prompt: "What happens when gravity increases?",
      selectedAnswer: "It decreases",
      correctAnswer: "It increases",
    },
  ],
  sources,
}

function providerReturning(output: unknown): AiStructuredProvider {
  return {
    async completeJson() {
      return output
    },
  }
}

describe("@learnify/ai Lumi foundation", () => {
  it("filters out draft lessons and unverified RAG chunks", () => {
    expect(filterEligibleLumiSources(sources).map((source) => source.id)).toEqual(
      ["lesson-gravity", "rag-verified", "question-gravity"]
    )
  })

  it("builds an English prompt with current lesson context and eligible sources", () => {
    const prompt = buildLumiChatPrompt(request)

    expect(prompt.locale).toBe("en")
    expect(prompt.messages[0]?.content).toContain("Respond in English")
    expect(prompt.messages[1]?.content).toContain(
      "Current lesson slug: gravity-and-falling-objects"
    )
    expect(prompt.messages[1]?.content).toContain("lesson-gravity")
    expect(prompt.messages[1]?.content).not.toContain("draft-projectile")
    expect(prompt.messages[1]?.content).not.toContain("rag-unverified")
  })

  it("builds a Thai prompt when the request locale is Thai", () => {
    const prompt = buildLumiChatPrompt({
      ...request,
      locale: "th",
      message: "ทำไมแรงโน้มถ่วงทำให้วัตถุเร็วขึ้น",
    })

    expect(prompt.messages[0]?.content).toContain("Respond in Thai")
  })

  it("validates a structured provider response", async () => {
    const result = await chatWithLumiAi({
      request,
      provider: providerReturning({
        answer:
          "Gravity causes downward acceleration, so the object's speed changes while it falls.",
        relatedLessonSlug: "gravity-and-falling-objects",
        suggestedNextAction: null,
        confidence: "high",
        suggestedPrompts: ["What does acceleration mean?"],
        sources: [{ id: "lesson-gravity", title: "Gravity and Falling Objects" }],
        safetyNotes: [],
      }),
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.output.sources[0]?.id).toBe("lesson-gravity")
    }
  })

  it("accepts public Lumi chat responses with next actions and compact sources", () => {
    const parsed = lumiChatResponseSchema.parse({
      answer:
        "Gravity creates downward acceleration, so speed changes while an object falls.",
      conversationId: "00000000-0000-4000-8000-000000000001",
      suggestedPrompts: ["What is acceleration?"],
      relatedLessonSlug: "gravity-and-falling-objects",
      suggestedNextAction: "Review the gravity slider and compare two values.",
      confidence: "high",
      sources: [
        {
          id: "lesson-gravity",
          title: "Gravity and Falling Objects",
          kind: "published_lesson",
          lessonSlug: "gravity-and-falling-objects",
          courseSlug: "physics-foundations",
        },
      ],
    })

    expect(parsed.suggestedNextAction).toBe(
      "Review the gravity slider and compare two values."
    )
    expect(parsed.sources?.[0]).toMatchObject({
      id: "lesson-gravity",
      kind: "published_lesson",
      lessonSlug: "gravity-and-falling-objects",
    })
  })

  it("returns an invalid_output fallback for malformed provider JSON", async () => {
    const result = await chatWithLumiAi({
      request,
      provider: providerReturning({
        answer: "",
        confidence: "certain",
      }),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("invalid_output")
      expect(result.fallback.confidence).toBe("medium")
    }
  })

  it("rejects provider citations that point to ineligible sources", async () => {
    const result = await chatWithLumiAi({
      request,
      provider: providerReturning({
        answer: "This cites a draft source and should be rejected.",
        relatedLessonSlug: null,
        suggestedNextAction: null,
        confidence: "high",
        suggestedPrompts: [],
        sources: [{ id: "draft-projectile", title: null }],
        safetyNotes: [],
      }),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("invalid_citations")
    }
  })

  it("rejects high-confidence provider output with no citations", async () => {
    const result = await chatWithLumiAi({
      request,
      provider: providerReturning({
        answer: "This answer is too confident without cited sources.",
        relatedLessonSlug: null,
        suggestedNextAction: null,
        confidence: "high",
        suggestedPrompts: [],
        sources: [],
        safetyNotes: [],
      }),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("invalid_citations")
    }
  })

  it("allows low-confidence provider output with no citations", async () => {
    const result = await chatWithLumiAi({
      request: {
        ...request,
        sources: [],
      },
      provider: providerReturning({
        answer: "I do not have enough verified context to answer that safely.",
        relatedLessonSlug: null,
        suggestedNextAction: "Review the current lesson examples.",
        confidence: "low",
        suggestedPrompts: ["Explain the lesson examples"],
        sources: [],
        safetyNotes: ["insufficient_context"],
      }),
    })

    expect(result.ok).toBe(true)
  })

  it("returns a typed provider_unavailable fallback", async () => {
    const result = await chatWithLumiAi({
      request,
      provider: createUnavailableAiProvider(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("provider_unavailable")
      expect(result.fallback.safetyNotes).toContain("fallback_response")
    }
  })

  it("returns a readable Thai provider-unavailable fallback with verified context", async () => {
    const result = await chatWithLumiAi({
      request: {
        ...request,
        locale: "th",
        message: "ทำไมแรงโน้มถ่วงทำให้วัตถุเร็วขึ้น?",
      },
      provider: createUnavailableAiProvider(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("provider_unavailable")
      expect(result.fallback.confidence).toBe("medium")
      expect(result.fallback.answer).toBe(
        "ตอนนี้ Lumi ยังใช้ระบบ AI ไม่ได้ แต่มีบริบทบทเรียนที่ตรวจสอบแล้วให้ทบทวน ลองอ่านแหล่งข้อมูลด้านล่างหรือถามเจาะจงเกี่ยวกับบทเรียนนี้อีกครั้ง"
      )
      expect(result.fallback.answer).not.toMatch(/[犧謂霞ｸｹ]/)
      expect(result.fallback.suggestedPrompts).toEqual([
        "อธิบายใจความสำคัญของบทเรียนนี้",
        "ฉันควรทบทวนอะไรก่อน",
      ])
      expect(result.fallback.suggestedPrompts.join(" ")).not.toMatch(/[犧謂霞ｸｹ]/)
    }
  })

  it("returns a readable Thai insufficient-context fallback without mojibake", async () => {
    const result = await chatWithLumiAi({
      request: {
        ...request,
        locale: "th",
        message: "ช่วยอธิบายเรื่องที่ยังไม่มีแหล่งข้อมูลได้ไหม?",
        sources: [],
      },
      provider: createUnavailableAiProvider(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe("provider_unavailable")
      expect(result.fallback.confidence).toBe("low")
      expect(result.fallback.answer).toBe(
        "ตอนนี้ Lumi ยังไม่มีบริบทที่ตรวจสอบแล้วพอที่จะตอบได้อย่างปลอดภัย ลองถามเกี่ยวกับบทเรียนปัจจุบัน หรือกลับไปทบทวนตัวอย่างในบทเรียนก่อน"
      )
      expect(result.fallback.answer).not.toMatch(/[犧謂霞ｸｹ]/)
      expect(result.fallback.suggestedPrompts).toEqual([
        "อธิบายใจความสำคัญของบทเรียนนี้",
        "ฉันควรทบทวนอะไรก่อน",
      ])
      expect(result.fallback.suggestedPrompts.join(" ")).not.toMatch(/[犧謂霞ｸｹ]/)
    }
  })
})
