import { describe, expect, it } from "vitest"
import {
  calculateLessonProgress,
  checkMultipleChoiceAnswer,
  generateRuleBasedLumiFeedback,
  generateRuleBasedLumiChatResponse,
  getNextAttemptNumber,
  recommendNextLesson,
  resolveWaitlistAccess,
  updateSkillMastery,
} from "../index"
import type { LearnifyLesson } from "@learnify/shared"

const lessons = [
  {
    slug: "gravity-and-falling-objects",
    order_index: 1,
    skill_ids: ["skill-gravity"],
    prerequisite_lesson_slugs: [],
  },
  {
    slug: "projectile-motion",
    order_index: 2,
    skill_ids: ["skill-projectile"],
    prerequisite_lesson_slugs: ["gravity-and-falling-objects"],
  },
  {
    slug: "forces-and-motion",
    order_index: 3,
    skill_ids: ["skill-force"],
    prerequisite_lesson_slugs: ["projectile-motion"],
  },
] as unknown as LearnifyLesson[]

describe("milestone learning rules", () => {
  it("resolves waitlist access from existence and beta access", () => {
    expect(resolveWaitlistAccess({ exists: false, betaAccess: false })).toBe(
      "missing"
    )
    expect(resolveWaitlistAccess({ exists: true, betaAccess: false })).toBe(
      "pending"
    )
    expect(resolveWaitlistAccess({ exists: true, betaAccess: true })).toBe(
      "approved"
    )
  })

  it("calculates block-weighted lesson progress", () => {
    expect(
      calculateLessonProgress({ completedBlocks: 2, totalBlocks: 6 })
    ).toBe(33)
    expect(
      calculateLessonProgress({ completedBlocks: 8, totalBlocks: 6 })
    ).toBe(100)
  })

  it("checks multiple choice answers", () => {
    expect(
      checkMultipleChoiceAnswer({
        question: { correct_option_id: "b" },
        selectedOptionId: "b",
      })
    ).toBe(true)
  })

  it("numbers attempts and updates mastery conservatively", () => {
    const attemptNumber = getNextAttemptNumber(0)
    const first = updateSkillMastery({
      skillId: "skill-gravity",
      isCorrect: false,
      attemptNumber,
    })
    const recovered = updateSkillMastery({
      current: first,
      skillId: "skill-gravity",
      isCorrect: true,
      attemptNumber: 2,
    })

    expect(attemptNumber).toBe(1)
    expect(first.masteryScore).toBe(0)
    expect(recovered.masteryScore).toBe(4)
    expect(recovered.confidenceLevel).toBe("low")
  })

  it("recommends the next lesson with prerequisites respected", () => {
    expect(
      recommendNextLesson({
        lessons,
        completedLessonSlugs: ["gravity-and-falling-objects"],
        weakSkillIds: ["skill-force"],
      })?.slug
    ).toBe("projectile-motion")
  })

  it("generates deterministic Lumi feedback", () => {
    expect(
      generateRuleBasedLumiFeedback({
        locale: "en",
        isCorrect: false,
        question: {
          question_en: "What happens?",
          explanation_en: "Gravity changes downward acceleration.",
        },
      })
    ).toContain("Gravity changes")
  })

  it("selects the gravity chat rule", () => {
    const response = generateRuleBasedLumiChatResponse({
      message: "Why does stronger gravity make things fall faster?",
      locale: "en",
      conversationId: "00000000-0000-0000-0000-000000000001",
      lessons,
    })

    expect(response.relatedLessonSlug).toBe("gravity-and-falling-objects")
    expect(response.answer).toContain("downward acceleration")
  })

  it("selects the projectile chat rule", () => {
    const response = generateRuleBasedLumiChatResponse({
      message: "Why does a projectile path curve?",
      locale: "en",
      conversationId: "00000000-0000-0000-0000-000000000001",
      lessons,
    })

    expect(response.relatedLessonSlug).toBe("projectile-motion")
    expect(response.answer).toContain("horizontal")
  })

  it("selects the net-force chat rule", () => {
    const response = generateRuleBasedLumiChatResponse({
      message: "What happens with unbalanced forces?",
      locale: "en",
      conversationId: "00000000-0000-0000-0000-000000000001",
      lessons,
    })

    expect(response.relatedLessonSlug).toBe("forces-and-motion")
    expect(response.answer).toContain("Net force")
  })

  it("redirects unmatched chat back to Physics prompts", () => {
    const response = generateRuleBasedLumiChatResponse({
      message: "Can you write my history essay?",
      locale: "en",
      conversationId: "00000000-0000-0000-0000-000000000001",
      lessons,
    })

    expect(response.confidence).toBe("low")
    expect(response.answer).toContain("Physics module")
    expect(response.suggestedPrompts[0]).toContain("gravity")
  })

  it("returns Thai chat templates where configured", () => {
    const response = generateRuleBasedLumiChatResponse({
      message: "แรงลัพธ์คืออะไร",
      locale: "th",
      conversationId: "00000000-0000-0000-0000-000000000001",
      lessons,
    })

    expect(response.relatedLessonSlug).toBe("forces-and-motion")
    expect(response.answer).toContain("แรงลัพธ์")
  })
})
