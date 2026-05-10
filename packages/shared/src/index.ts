import { z } from "zod"

export const locales = ["en", "th"] as const
export const userRoles = ["student", "teacher", "admin"] as const
export const lessonStatuses = [
  "draft",
  "in_review",
  "approved",
  "published",
] as const

export type Locale = (typeof locales)[number]
export type UserRole = (typeof userRoles)[number]
export type LessonStatus = (typeof lessonStatuses)[number]

export const localeSchema = z.enum(locales)
export const userRoleSchema = z.enum(userRoles)
export const lessonStatusSchema = z.enum(lessonStatuses)

export type LessonBlock =
  | TextBlock
  | VisualBlock
  | SimulationBlock
  | MultipleChoiceBlock
  | LumiHintBlock
  | ReflectionBlock
  | NextLessonBlock

export type TextBlock = {
  id: string
  type: "text"
  content_en: string
  content_th?: string
}

export type VisualBlock = {
  id: string
  type: "visual"
  visual_type: "falling-object-diagram" | "force-diagram" | "motion-graph"
  title_en?: string
  title_th?: string
}

export type SimulationBlock = {
  id: string
  type: "simulation"
  simulation_type: "gravity-slider" | "projectile-motion" | "force-diagram"
  config?: Record<string, unknown>
}

export type MultipleChoiceBlock = {
  id: string
  type: "multiple_choice"
  question_id: string
}

export type LumiHintBlock = {
  id: string
  type: "lumi_hint"
  hint_type: "conceptual_explanation" | "mistake_feedback" | "next_step"
}

export type ReflectionBlock = {
  id: string
  type: "reflection"
  prompt_en: string
  prompt_th?: string
}

export type NextLessonBlock = {
  id: string
  type: "next_lesson"
  lesson_slug: string
}

export type CourseStatus = "draft" | "published" | "archived"
export type LessonDifficulty = "beginner" | "intermediate" | "advanced"
export type QuestionDifficulty = "easy" | "medium" | "hard"
export type ConfidenceLevel = "low" | "medium" | "high"
export type LumiConfidence = "low" | "medium" | "high"
export type LumiMessageRole = "user" | "assistant" | "system"

export type LearnifyCourse = {
  id: string
  slug: string
  title_en: string
  title_th?: string
  subject: string
  grade_level?: string
  description_en: string
  description_th?: string
  status: CourseStatus
  modules: LearnifyModule[]
}

export type LearnifyModule = {
  id: string
  slug: string
  course_slug: string
  title_en: string
  title_th?: string
  description_en: string
  description_th?: string
  order_index: number
  lessons: LearnifyLesson[]
}

export type LearnifyLesson = {
  id: string
  slug: string
  module_slug: string
  title_en: string
  title_th?: string
  summary_en: string
  summary_th?: string
  difficulty: LessonDifficulty
  estimated_minutes: number
  status: LessonStatus
  order_index: number
  skill_ids: string[]
  prerequisite_lesson_slugs: string[]
  blocks: LessonBlock[]
}

export type LearnifySkill = {
  id: string
  slug: string
  subject: string
  title_en: string
  title_th?: string
  description_en: string
  description_th?: string
}

export type MultipleChoiceOption = {
  id: string
  label_en: string
  label_th?: string
}

export type LearnifyQuestion = {
  id: string
  slug: string
  lesson_slug: string
  skill_id: string
  question_en: string
  question_th?: string
  options: MultipleChoiceOption[]
  correct_option_id: string
  explanation_en: string
  explanation_th?: string
  difficulty: QuestionDifficulty
}

export type QuestionAttemptInput = {
  lessonSlug: string
  blockId: string
  questionId: string
  selectedOptionId: string
  attemptNumber: number
  timeSpentSeconds?: number
}

export type StudentSkillMastery = {
  skillId: string
  masteryScore: number
  confidenceLevel: ConfidenceLevel
  attempts: number
  correctAttempts: number
}

export const questionAttemptSchema = z.object({
  lessonSlug: z.string().trim().min(1),
  blockId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  selectedOptionId: z.string().trim().min(1),
  attemptNumber: z.number().int().min(1),
  timeSpentSeconds: z.number().int().min(0).optional(),
})

export const accessStatusQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
})

export type AccessStatusQuery = z.infer<typeof accessStatusQuerySchema>

export const completeLessonBlockRequestSchema = z.object({
  locale: localeSchema.default("en"),
})

export type CompleteLessonBlockRequestInput = z.infer<
  typeof completeLessonBlockRequestSchema
>

export const submitQuestionAttemptRequestSchema = z.object({
  lessonSlug: z.string().trim().min(1),
  blockId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  selectedOptionId: z.string().trim().min(1),
  timeSpentSeconds: z.number().int().min(0).optional(),
  locale: localeSchema.default("en"),
})

export type SubmitQuestionAttemptRequestInput = z.infer<
  typeof submitQuestionAttemptRequestSchema
>

export const authEmailRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  locale: localeSchema.default("en"),
})

export type AuthEmailRequestInput = z.infer<typeof authEmailRequestSchema>

export const waitlistSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().max(80).optional(),
  grade_level: z.string().trim().max(80).optional(),
  preferred_language: localeSchema.default("en"),
  interest_reason: z.string().trim().max(1000).optional(),
})

export type WaitlistSignupInput = z.infer<typeof waitlistSignupSchema>

export const lumiChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  locale: localeSchema.default("en"),
  conversationId: z.string().uuid().optional(),
  currentLessonSlug: z.string().trim().min(1).max(120).optional(),
})

export type LumiChatRequestInput = z.infer<typeof lumiChatRequestSchema>

export const lumiChatResponseSchema = z.object({
  answer: z.string(),
  conversationId: z.string().uuid(),
  suggestedPrompts: z.array(z.string()),
  relatedLessonSlug: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]),
})

export type LumiChatResponse = z.infer<typeof lumiChatResponseSchema>

export type LumiMessage = {
  id: string
  conversationId: string
  role: LumiMessageRole
  message: string
  createdAt: string
}

export {
  getPhysicsLesson,
  getPhysicsQuestion,
  physicsContent,
  physicsFoundationsCourse,
  physicsQuestions,
  physicsSkills,
} from "./content/physics-foundations"
