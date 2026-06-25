import { z } from "zod"

export const assignmentTypes = [
  "lesson",
  "quiz",
  "manual_submission",
  "mixed",
] as const

export const assignmentStatuses = [
  "draft",
  "published",
  "closed",
  "deleted",
] as const

export const assignmentItemTypes = [
  "learnify_lesson",
  "quiz",
  "manual_submission",
  "attachment",
] as const

export const assignmentRecipientStatuses = [
  "assigned",
  "in_progress",
  "submitted",
  "returned",
  "graded",
  "missing",
  "excused",
] as const

export const assignmentQuizQuestionTypes = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "fill_in_blank",
] as const

export const assignmentAttachmentTypes = [
  "pdf",
  "image",
  "video",
  "audio",
  "google_drive",
  "link",
  "file",
] as const

export const assignmentSubmissionStatuses = [
  "not_started",
  "draft",
  "submitted",
  "late_submitted",
  "returned",
  "resubmitted",
  "graded",
] as const

export const assignmentItemSubmissionStatuses = [
  "not_started",
  "in_progress",
  "draft",
  "submitted",
  "late_submitted",
  "returned",
  "resubmitted",
  "graded",
  "completed",
] as const

export const assignmentTypeSchema = z.enum(assignmentTypes)
export const assignmentStatusSchema = z.enum(assignmentStatuses)
export const assignmentItemTypeSchema = z.enum(assignmentItemTypes)
export const assignmentRecipientStatusSchema = z.enum(
  assignmentRecipientStatuses
)
export const assignmentQuizQuestionTypeSchema = z.enum(
  assignmentQuizQuestionTypes
)
export const assignmentAttachmentTypeSchema = z.enum(assignmentAttachmentTypes)
export const assignmentSubmissionStatusSchema = z.enum(
  assignmentSubmissionStatuses
)
export const assignmentItemSubmissionStatusSchema = z.enum(
  assignmentItemSubmissionStatuses
)

export type AssignmentType = (typeof assignmentTypes)[number]
export type AssignmentStatus = (typeof assignmentStatuses)[number]
export type AssignmentItemType = (typeof assignmentItemTypes)[number]
export type AssignmentRecipientStatus =
  (typeof assignmentRecipientStatuses)[number]
export type AssignmentQuizQuestionType =
  (typeof assignmentQuizQuestionTypes)[number]
export type AssignmentAttachmentType =
  (typeof assignmentAttachmentTypes)[number]
export type AssignmentSubmissionStatus =
  (typeof assignmentSubmissionStatuses)[number]
export type AssignmentItemSubmissionStatus =
  (typeof assignmentItemSubmissionStatuses)[number]

export type ClassroomAssignmentRecord = {
  id: string
  school_id: string
  classroom_id: string
  created_by: string | null
  title_en: string
  title_th: string | null
  description_en: string | null
  description_th: string | null
  assignment_type: AssignmentType
  status: AssignmentStatus
  total_points: number
  due_at: string | null
  published_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export type AssignmentItemRecord = {
  id: string
  assignment_id: string
  item_type: AssignmentItemType
  order_index: number
  title_en: string
  title_th: string | null
  instructions_en: string | null
  instructions_th: string | null
  lesson_id: string | null
  points: number
  required: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AssignmentRecipientRecord = {
  id: string
  assignment_id: string
  classroom_membership_id: string
  student_user_id: string
  status: AssignmentRecipientStatus
  assigned_at: string
  due_at: string | null
  first_opened_at: string | null
  submitted_at: string | null
  returned_at: string | null
  graded_at: string | null
  excused_at: string | null
  created_at: string
  updated_at: string
}

export type AssignmentQuizQuestionRecord = {
  id: string
  assignment_item_id: string
  question_type: AssignmentQuizQuestionType
  order_index: number
  prompt_en: string
  prompt_th: string | null
  options_json: Record<string, unknown> | null
  correct_answer: Record<string, unknown> | null
  explanation_en: string | null
  explanation_th: string | null
  points: number
  max_attempts: number | null
  created_at: string
  updated_at: string
}

export type StudentAssignmentSubmissionRecord = {
  id: string
  assignment_id: string
  recipient_id: string
  student_user_id: string
  status: AssignmentSubmissionStatus
  score: number | null
  max_score: number
  submitted_at: string | null
  late: boolean
  returned_at: string | null
  graded_at: string | null
  graded_by: string | null
  feedback_en: string | null
  feedback_th: string | null
  created_at: string
  updated_at: string
}

export type StudentAssignmentItemSubmissionRecord = {
  id: string
  submission_id: string
  assignment_item_id: string
  status: AssignmentItemSubmissionStatus
  answer_json: Record<string, unknown> | null
  score: number | null
  max_score: number
  attempts_count: number
  completed_at: string | null
  feedback_en: string | null
  feedback_th: string | null
  created_at: string
  updated_at: string
}

export type SubmissionVersionRecord = {
  id: string
  submission_id: string
  version_number: number
  body_json: Record<string, unknown>
  submitted_at: string
  created_at: string
}

export type AssignmentAttachmentRecord = {
  id: string
  assignment_id: string | null
  assignment_item_id: string | null
  submission_id: string | null
  attachment_type: AssignmentAttachmentType
  title: string
  url: string
  storage_path: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

const localizedTextSchema = z.object({
  en: z.string().trim().min(1).max(2000),
  th: z.string().trim().max(2000).optional(),
})

const assignmentFeedbackSchema = z
  .object({
    en: z.string().trim().max(2000).optional(),
    th: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Boolean(value.en || value.th), {
    message: "Feedback must include English or Thai text.",
  })

const assignmentItemInputSchema = z.object({
  itemType: assignmentItemTypeSchema,
  orderIndex: z.number().int().min(0),
  title: localizedTextSchema,
  instructions: localizedTextSchema.partial().optional(),
  lessonId: z.string().uuid().optional(),
  points: z.number().min(0).default(0),
  required: z.boolean().default(true),
  settings: z.record(z.string(), z.unknown()).default({}),
})

const assignmentQuizQuestionInputSchema = z.object({
  assignmentItemId: z.string().uuid().optional(),
  questionType: assignmentQuizQuestionTypeSchema,
  orderIndex: z.number().int().min(0),
  prompt: localizedTextSchema,
  optionsJson: z.record(z.string(), z.unknown()).optional(),
  correctAnswer: z.record(z.string(), z.unknown()).optional(),
  explanation: localizedTextSchema.partial().optional(),
  points: z.number().min(0).default(1),
  maxAttempts: z.number().int().min(1).optional(),
})

export const createAssignmentDraftRequestSchema = z.object({
  schoolId: z.string().uuid(),
  classroomId: z.string().uuid(),
  locale: z.enum(["en", "th"]).default("en"),
  title: localizedTextSchema,
  description: localizedTextSchema.partial().optional(),
  assignmentType: assignmentTypeSchema.default("mixed"),
  totalPoints: z.number().min(0).default(0),
  dueAt: z.string().datetime({ offset: true }).optional(),
  items: z.array(assignmentItemInputSchema).max(50).default([]),
  quizQuestions: z.array(assignmentQuizQuestionInputSchema).max(100).default([]),
})

export type CreateAssignmentDraftRequest = z.infer<
  typeof createAssignmentDraftRequestSchema
>

export const updateAssignmentDraftRequestSchema =
  createAssignmentDraftRequestSchema
    .omit({ schoolId: true, classroomId: true })
    .partial()
    .extend({
      locale: z.enum(["en", "th"]).default("en"),
    })

export type UpdateAssignmentDraftRequest = z.infer<
  typeof updateAssignmentDraftRequestSchema
>

export const publishAssignmentRequestSchema = z.object({
  locale: z.enum(["en", "th"]).default("en"),
  recipientStudentUserIds: z.array(z.string().uuid()).min(1).max(500),
  dueAt: z.string().datetime({ offset: true }).optional(),
})

export type PublishAssignmentRequest = z.infer<
  typeof publishAssignmentRequestSchema
>

export const saveStudentAssignmentDraftRequestSchema = z.object({
  locale: z.enum(["en", "th"]).default("en"),
  itemSubmissions: z
    .array(
      z.object({
        assignmentItemId: z.string().uuid(),
        answerJson: z.record(z.string(), z.unknown()).default({}),
      })
    )
    .min(1)
    .max(50),
})

export type SaveStudentAssignmentDraftRequest = z.infer<
  typeof saveStudentAssignmentDraftRequestSchema
>

export const submitStudentAssignmentRequestSchema =
  saveStudentAssignmentDraftRequestSchema.extend({
    submittedAt: z.string().datetime({ offset: true }).optional(),
  })

export type SubmitStudentAssignmentRequest = z.infer<
  typeof submitStudentAssignmentRequestSchema
>

export const recordAssignmentQuizAttemptRequestSchema = z.object({
  locale: z.enum(["en", "th"]).default("en"),
  assignmentItemId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswer: z.record(z.string(), z.unknown()).default({}),
  attemptNumber: z.number().int().min(1),
  timeSpentSeconds: z.number().int().min(0).optional(),
})

export type RecordAssignmentQuizAttemptRequest = z.infer<
  typeof recordAssignmentQuizAttemptRequestSchema
>

export const gradeAssignmentSubmissionRequestSchema = z.object({
  schoolId: z.string().uuid(),
  locale: z.enum(["en", "th"]).default("en"),
  feedback: assignmentFeedbackSchema.optional(),
  itemGrades: z
    .array(
      z.object({
        assignmentItemId: z.string().uuid(),
        score: z.number().min(0),
        feedback: assignmentFeedbackSchema.optional(),
      })
    )
    .max(50)
    .default([]),
})

export type GradeAssignmentSubmissionRequest = z.infer<
  typeof gradeAssignmentSubmissionRequestSchema
>

export const returnAssignmentSubmissionRequestSchema = z.object({
  schoolId: z.string().uuid(),
  locale: z.enum(["en", "th"]).default("en"),
  feedback: assignmentFeedbackSchema,
})

export type ReturnAssignmentSubmissionRequest = z.infer<
  typeof returnAssignmentSubmissionRequestSchema
>
