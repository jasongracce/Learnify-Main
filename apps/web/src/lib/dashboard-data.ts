import {
  getLessonProgressForUser,
  getRecentQuestionAttemptsForUser,
  getStudentSkillMasteryForUser,
  type LessonProgressSummary,
  type QuestionAttemptSummary,
  type StudentSkillMasterySummary,
} from "@learnify/database"
import type { LearnifyLesson, LearnifySkill } from "@learnify/shared"
import {
  physicsFoundationsCourse,
  physicsSkills,
  type Locale,
} from "@learnify/shared"
import {
  generateRuleBasedLumiInsight,
  recommendNextLesson,
} from "@learnify/core"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type DashboardData = {
  nextLesson: LearnifyLesson
  weakSkill: LearnifySkill
  insight: string
  recentPractice: {
    correct: number
    total: number
  }
  source: "live" | "fallback"
}

const confidenceRank = {
  low: 0,
  medium: 1,
  high: 2,
} as const

export async function getStudentDashboardData(input: {
  userId: string
  locale: Locale
}): Promise<DashboardData> {
  const lessons = physicsFoundationsCourse.modules.flatMap(
    (module) => module.lessons
  )
  const starterLesson = lessons[0]
  const starterSkill = physicsSkills[0]

  try {
    const supabase = await createSupabaseServerClient()
    const [progress, mastery, attempts] = await Promise.all([
      getLessonProgressForUser({
        supabase,
        userId: input.userId,
      }),
      getStudentSkillMasteryForUser({
        supabase,
        userId: input.userId,
      }),
      getRecentQuestionAttemptsForUser({
        supabase,
        userId: input.userId,
        limit: 10,
      }),
    ])

    return buildDashboardData({
      attempts,
      locale: input.locale,
      mastery,
      progress,
      source: "live",
    })
  } catch {
    const fallbackLesson = recommendNextLesson({
      lessons,
      completedLessonSlugs: [],
      currentLessonSlug: starterLesson.slug,
    })

    return {
      nextLesson: fallbackLesson ?? starterLesson,
      weakSkill: starterSkill,
      insight: generateRuleBasedLumiInsight({
        locale: input.locale,
        mastery: [
          {
            skillId: starterSkill.id,
            masteryScore: 25,
            confidenceLevel: "low",
            attempts: 0,
            correctAttempts: 0,
          },
        ],
        nextLessonTitle: {
          en: fallbackLesson?.title_en ?? starterLesson.title_en,
          th: fallbackLesson?.title_th ?? starterLesson.title_th,
        },
      }),
      recentPractice: {
        correct: 0,
        total: 0,
      },
      source: "fallback",
    }
  }
}

function buildDashboardData(input: {
  progress: LessonProgressSummary[]
  mastery: StudentSkillMasterySummary[]
  attempts: QuestionAttemptSummary[]
  locale: Locale
  source: "live" | "fallback"
}): DashboardData {
  const lessons = physicsFoundationsCourse.modules.flatMap(
    (module) => module.lessons
  )
  const lessonSlugs = new Set(lessons.map((lesson) => lesson.slug))
  const completedLessonSlugs = input.progress
    .filter(
      (item) =>
        item.status === "completed" &&
        item.progressPercent === 100 &&
        lessonSlugs.has(item.lessonSlug)
    )
    .map((item) => item.lessonSlug)
  const currentProgress = input.progress.find(
    (item) =>
      item.status !== "completed" &&
      item.progressPercent > 0 &&
      lessonSlugs.has(item.lessonSlug)
  )
  const starterLesson = lessons[0]
  const currentLessonSlug = currentProgress?.lessonSlug ?? starterLesson.slug
  const nextLesson =
    recommendNextLesson({
      lessons,
      completedLessonSlugs,
      currentLessonSlug,
    }) ??
    lessons.find((lesson) => !completedLessonSlugs.includes(lesson.slug)) ??
    lessons[lessons.length - 1]
  const weakSkillSummary = [...input.mastery]
    .filter((item) => physicsSkills.some((skill) => skill.slug === item.skillSlug))
    .sort((a, b) => {
      const confidenceDelta =
        confidenceRank[a.confidenceLevel] - confidenceRank[b.confidenceLevel]

      return confidenceDelta || a.masteryScore - b.masteryScore
    })[0]
  const weakSkill =
    physicsSkills.find((skill) => skill.slug === weakSkillSummary?.skillSlug) ??
    physicsSkills[0]
  const masteryForInsight =
    input.mastery.length > 0
      ? input.mastery.map((item) => ({
          skillId: item.skillId,
          masteryScore: item.masteryScore,
          confidenceLevel: item.confidenceLevel,
          attempts: 1,
          correctAttempts: item.confidenceLevel === "low" ? 0 : 1,
        }))
      : [
          {
            skillId: weakSkill.id,
            masteryScore: 25,
            confidenceLevel: "low" as const,
            attempts: 0,
            correctAttempts: 0,
          },
        ]
  const recentTotal = input.attempts.length
  const recentCorrect = input.attempts.filter((attempt) => attempt.isCorrect)
    .length

  return {
    nextLesson,
    weakSkill,
    insight: generateRuleBasedLumiInsight({
      locale: input.locale,
      mastery: masteryForInsight,
      nextLessonTitle: {
        en: nextLesson.title_en,
        th: nextLesson.title_th,
      },
    }),
    recentPractice: {
      correct: recentCorrect,
      total: recentTotal,
    },
    source: input.source,
  }
}
