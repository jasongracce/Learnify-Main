import type {
  LearnifyLesson,
  LearnifyQuestion,
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

export function selectLocalizedText(
  record: { en: string; th?: string | null },
  locale: Locale
): string {
  if (locale === "th" && record.th) {
    return record.th
  }

  return record.en
}
