import type {
  LearnifyLesson,
  LearnifyQuestion,
  LumiChatResponse,
  Locale,
  StudentSkillMastery,
} from "@learnify/shared"

export type WaitlistAccessStatus = "approved" | "pending" | "missing"

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function resolveWaitlistAccess(input: {
  exists: boolean
  betaAccess: boolean
}): WaitlistAccessStatus {
  if (!input.exists) {
    return "missing"
  }

  return input.betaAccess ? "approved" : "pending"
}

export function calculateLessonProgress(input: {
  completedBlocks: number
  totalBlocks: number
}): number {
  if (input.totalBlocks <= 0) {
    return 0
  }

  return Math.min(
    100,
    Math.max(0, Math.round((input.completedBlocks / input.totalBlocks) * 100))
  )
}

export function checkMultipleChoiceAnswer(input: {
  question: Pick<LearnifyQuestion, "correct_option_id">
  selectedOptionId: string
}): boolean {
  return input.question.correct_option_id === input.selectedOptionId
}

export function getNextAttemptNumber(previousAttempts: number): number {
  return Math.max(1, previousAttempts + 1)
}

export function getConfidenceLevel(masteryScore: number) {
  if (masteryScore >= 75) {
    return "high"
  }

  if (masteryScore >= 40) {
    return "medium"
  }

  return "low"
}

export function updateSkillMastery(input: {
  current?: StudentSkillMastery
  skillId: string
  isCorrect: boolean
  attemptNumber: number
}): StudentSkillMastery {
  const currentScore = input.current?.masteryScore ?? 0
  const firstAttemptCorrect = input.isCorrect && input.attemptNumber === 1
  const recovered = input.isCorrect && input.attemptNumber > 1
  const delta = firstAttemptCorrect ? 10 : recovered ? 4 : -5
  const masteryScore = Math.min(100, Math.max(0, currentScore + delta))
  const attempts = (input.current?.attempts ?? 0) + 1
  const correctAttempts =
    (input.current?.correctAttempts ?? 0) + (input.isCorrect ? 1 : 0)

  return {
    skillId: input.skillId,
    masteryScore,
    confidenceLevel: getConfidenceLevel(masteryScore),
    attempts,
    correctAttempts,
  }
}

export function recommendNextLesson(input: {
  lessons: LearnifyLesson[]
  completedLessonSlugs: string[]
  currentLessonSlug?: string
  weakSkillIds?: string[]
}): LearnifyLesson | undefined {
  const completed = new Set(input.completedLessonSlugs)
  const weakSkills = new Set(input.weakSkillIds ?? [])
  const orderedLessons = [...input.lessons].sort(
    (a, b) => a.order_index - b.order_index
  )

  const incompleteCurrent = orderedLessons.find(
    (lesson) =>
      lesson.slug === input.currentLessonSlug && !completed.has(lesson.slug)
  )

  if (incompleteCurrent) {
    return incompleteCurrent
  }

  const weakSkillLesson = orderedLessons.find(
    (lesson) =>
      !completed.has(lesson.slug) &&
      lesson.skill_ids.some((skillId) => weakSkills.has(skillId)) &&
      lesson.prerequisite_lesson_slugs.every((slug) => completed.has(slug))
  )

  if (weakSkillLesson) {
    return weakSkillLesson
  }

  const lessonWithMetPrerequisites = orderedLessons.find(
    (lesson) =>
      !completed.has(lesson.slug) &&
      lesson.prerequisite_lesson_slugs.every((slug) => completed.has(slug))
  )

  if (lessonWithMetPrerequisites) {
    return lessonWithMetPrerequisites
  }

  return orderedLessons.find((lesson) => !completed.has(lesson.slug))
}

export function generateRuleBasedLumiFeedback(input: {
  locale: Locale
  isCorrect: boolean
  question: Pick<
    LearnifyQuestion,
    "explanation_en" | "explanation_th" | "question_en" | "question_th"
  >
}): string {
  const explanation = selectLocalizedText(
    {
      en: input.question.explanation_en,
      th: input.question.explanation_th,
    },
    input.locale
  )

  if (input.locale === "th") {
    return input.isCorrect
      ? `ถูกต้อง แนวคิดสำคัญคือ ${explanation}`
      : `ลองคิดจากแรงที่กระทำโดยตรงก่อนนะ ${explanation}`
  }

  return input.isCorrect
    ? `Correct. The key idea is: ${explanation}`
    : `Start with the force acting directly on the object. ${explanation}`
}

export function generateRuleBasedLumiInsight(input: {
  locale: Locale
  mastery: StudentSkillMastery[]
  nextLessonTitle: { en: string; th?: string | null }
}): string {
  const weakSkillCount = input.mastery.filter(
    (item) => item.confidenceLevel === "low"
  ).length
  const nextLesson = selectLocalizedText(input.nextLessonTitle, input.locale)

  if (input.locale === "th") {
    return weakSkillCount > 0
      ? `คุณมี ${weakSkillCount} ทักษะที่ควรทบทวน ต่อไปให้ลองเรียน "${nextLesson}" และตอบคำถามช้าๆ โดยดูเหตุผลของแต่ละตัวเลือก`
      : `พื้นฐานกำลังดี ต่อไปให้เรียน "${nextLesson}" เพื่อเชื่อมแนวคิดกับโจทย์ใหม่`
  }

  return weakSkillCount > 0
    ? `You have ${weakSkillCount} skill to review. Try "${nextLesson}" next and slow down on each answer choice.`
    : `Your foundation is steady. Continue with "${nextLesson}" to connect the idea to a new problem.`
}

export type RuleBasedLumiChatInput = {
  message: string
  locale: Locale
  conversationId: string
  currentLessonSlug?: string
  completedLessonSlugs?: string[]
  weakSkillIds?: string[]
  lessons: LearnifyLesson[]
}

type LumiConceptKey = "gravity" | "projectile" | "force"

const conceptRules: Record<
  LumiConceptKey,
  {
    lessonSlug: string
    skillIds: string[]
    keywords: string[]
    suggestedPrompts: Record<Locale, string[]>
    answer: Record<Locale, string>
  }
> = {
  gravity: {
    lessonSlug: "gravity-and-falling-objects",
    skillIds: ["skill-gravitational-acceleration"],
    keywords: [
      "gravity",
      "fall",
      "falling",
      "drop",
      "downward",
      "acceleration",
      "gravitational",
      "แรงโน้มถ่วง",
      "ตก",
      "ความเร่ง",
    ],
    suggestedPrompts: {
      en: [
        "Why does stronger gravity make things fall faster?",
        "What does gravitational acceleration mean?",
      ],
      th: [
        "ทำไมแรงโน้มถ่วงที่มากขึ้นทำให้วัตถุตกเร็วขึ้น?",
        "ความเร่งจากแรงโน้มถ่วงหมายถึงอะไร?",
      ],
    },
    answer: {
      en: "Stronger gravity means a larger downward acceleration. The object does not just move downward; its downward speed increases more each second while it falls.",
      th: "แรงโน้มถ่วงที่มากขึ้นหมายถึงความเร่งลงด้านล่างที่มากขึ้น วัตถุจึงไม่ได้แค่เคลื่อนที่ลง แต่ความเร็วลงจะเพิ่มขึ้นมากขึ้นในแต่ละวินาทีที่ตก",
    },
  },
  projectile: {
    lessonSlug: "projectile-motion",
    skillIds: ["skill-projectile-components"],
    keywords: [
      "projectile",
      "throw",
      "thrown",
      "horizontal",
      "vertical",
      "curve",
      "path",
      "motion",
      "วิถีโค้ง",
      "แนวนอน",
      "แนวดิ่ง",
      "ขว้าง",
    ],
    suggestedPrompts: {
      en: [
        "Why does a projectile curve downward?",
        "How are horizontal and vertical motion different?",
      ],
      th: [
        "ทำไมวัตถุที่ถูกขว้างจึงโค้งลง?",
        "การเคลื่อนที่แนวนอนกับแนวดิ่งต่างกันอย่างไร?",
      ],
    },
    answer: {
      en: "Projectile motion is easier when you split it into two parts. The object keeps moving forward horizontally while gravity changes the vertical motion downward, creating a curved path.",
      th: "การเคลื่อนที่แบบโพรเจกไทล์จะเข้าใจง่ายขึ้นเมื่อแยกเป็นสองส่วน วัตถุยังเคลื่อนที่ไปข้างหน้าในแนวนอน ขณะที่แรงโน้มถ่วงเปลี่ยนการเคลื่อนที่แนวดิ่งให้ลงด้านล่าง จึงเกิดเส้นทางโค้ง",
    },
  },
  force: {
    lessonSlug: "forces-and-motion",
    skillIds: ["skill-net-force"],
    keywords: [
      "force",
      "forces",
      "net force",
      "balanced",
      "unbalanced",
      "newton",
      "push",
      "pull",
      "แรง",
      "แรงลัพธ์",
      "สมดุล",
      "ไม่สมดุล",
      "ผลัก",
      "ดึง",
    ],
    suggestedPrompts: {
      en: ["What is net force?", "Why does an unbalanced force change motion?"],
      th: ["แรงลัพธ์คืออะไร?", "ทำไมแรงที่ไม่สมดุลจึงเปลี่ยนการเคลื่อนที่?"],
    },
    answer: {
      en: "Net force is the combined effect of all forces on an object. When the forces are unbalanced, the object accelerates in the direction of the net force, so its motion changes.",
      th: "แรงลัพธ์คือผลรวมของแรงทั้งหมดที่กระทำต่อวัตถุ เมื่อแรงไม่สมดุล วัตถุจะมีความเร่งไปทางแรงลัพธ์ การเคลื่อนที่ของวัตถุจึงเปลี่ยนไป",
    },
  },
}

export function generateRuleBasedLumiChatResponse(
  input: RuleBasedLumiChatInput
): LumiChatResponse {
  const normalizedMessage = input.message.toLowerCase()
  const match = getLumiConceptMatch(normalizedMessage, input.weakSkillIds)
  const recommendedLesson = recommendNextLesson({
    lessons: input.lessons,
    completedLessonSlugs: input.completedLessonSlugs ?? [],
    currentLessonSlug: input.currentLessonSlug,
    weakSkillIds: input.weakSkillIds,
  })

  if (!match) {
    const fallbackLessonSlug =
      recommendedLesson?.slug ??
      input.currentLessonSlug ??
      input.lessons[0]?.slug
    const suggestedPrompts = getFallbackLumiPrompts(input.locale)

    return {
      answer:
        input.locale === "th"
          ? "ตอนนี้ Lumi ตอบได้เฉพาะบทเรียนฟิสิกส์เรื่องแรงโน้มถ่วง การเคลื่อนที่แบบโพรเจกไทล์ และแรง ลองเลือกคำถามตัวอย่าง หรือกลับไปทบทวนบทเรียนฟิสิกส์ถัดไป"
          : "For this beta, Lumi can answer only the Physics module on gravity, projectile motion, and forces. Try one of the suggested questions or continue with the next Physics lesson.",
      conversationId: input.conversationId,
      suggestedPrompts,
      relatedLessonSlug: fallbackLessonSlug,
      confidence: "low",
    }
  }

  const rule = conceptRules[match]

  return {
    answer: rule.answer[input.locale],
    conversationId: input.conversationId,
    suggestedPrompts: rule.suggestedPrompts[input.locale],
    relatedLessonSlug: rule.lessonSlug,
    confidence: "high",
  }
}

function getLumiConceptMatch(
  normalizedMessage: string,
  weakSkillIds?: string[]
): LumiConceptKey | null {
  const directMatch = (Object.keys(conceptRules) as LumiConceptKey[]).find(
    (key) =>
      conceptRules[key].keywords.some((keyword) =>
        normalizedMessage.includes(keyword)
      )
  )

  if (directMatch) {
    return directMatch
  }

  const weakSkills = new Set(weakSkillIds ?? [])

  return (
    (Object.keys(conceptRules) as LumiConceptKey[]).find((key) =>
      conceptRules[key].skillIds.some((skillId) => weakSkills.has(skillId))
    ) ?? null
  )
}

function getFallbackLumiPrompts(locale: Locale) {
  if (locale === "th") {
    return [
      "แรงโน้มถ่วงทำให้วัตถุตกเร็วขึ้นได้อย่างไร?",
      "แรงลัพธ์เปลี่ยนการเคลื่อนที่อย่างไร?",
      "ทำไมวัตถุที่ถูกขว้างจึงมีเส้นทางโค้ง?",
    ]
  }

  return [
    "How does gravity make falling objects speed up?",
    "How does net force change motion?",
    "Why does a projectile follow a curved path?",
  ]
}

export function selectLocalizedText(
  record: { en: string; th?: string | null },
  locale: Locale
): string {
  if (locale === "th" && record.th) {
    return record.th
  }

  return record.en
}
