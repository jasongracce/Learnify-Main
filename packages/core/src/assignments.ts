import type {
  AssignmentItemSubmissionStatus,
  AssignmentItemType,
  AssignmentQuizQuestionType,
  AssignmentStatus,
  AssignmentSubmissionStatus,
} from "@learnify/shared"

export type AssignmentStatusAction = "publish" | "close" | "delete"

export type AssignmentStatusTransitionResult =
  | { nextStatus: AssignmentStatus }
  | { error: string }

export function resolveAssignmentStatusTransition(input: {
  currentStatus: AssignmentStatus
  action: AssignmentStatusAction
}): AssignmentStatusTransitionResult {
  if (input.currentStatus === "deleted") {
    return { error: "Deleted assignments are terminal." }
  }

  if (input.action === "delete") {
    return { nextStatus: "deleted" }
  }

  if (input.action === "publish" && input.currentStatus === "draft") {
    return { nextStatus: "published" }
  }

  if (input.action === "close" && input.currentStatus === "published") {
    return { nextStatus: "closed" }
  }

  return {
    error: `Cannot ${input.action} assignment in status '${input.currentStatus}'.`,
  }
}

export type SubmissionStatusAction =
  | "save_draft"
  | "submit"
  | "return"
  | "grade"

export type SubmissionStatusTransitionResult =
  | { nextStatus: AssignmentSubmissionStatus; late: boolean }
  | { error: string }

export function resolveSubmissionStatusTransition(input: {
  currentStatus: AssignmentSubmissionStatus
  action: SubmissionStatusAction
  submittedAt?: Date
  dueAt?: Date | null
  lateSubmissionsAccepted?: boolean
}): SubmissionStatusTransitionResult {
  if (input.action === "save_draft") {
    if (
      input.currentStatus === "not_started" ||
      input.currentStatus === "draft" ||
      input.currentStatus === "returned"
    ) {
      return { nextStatus: "draft", late: false }
    }

    return {
      error: `Cannot save draft from status '${input.currentStatus}'.`,
    }
  }

  if (input.action === "submit") {
    if (
      input.currentStatus !== "not_started" &&
      input.currentStatus !== "draft" &&
      input.currentStatus !== "submitted" &&
      input.currentStatus !== "returned"
    ) {
      return {
        error: `Cannot submit from status '${input.currentStatus}'.`,
      }
    }

    const timing = evaluateSubmissionTiming({
      submittedAt: input.submittedAt ?? new Date(),
      dueAt: input.dueAt,
      lateSubmissionsAccepted: input.lateSubmissionsAccepted ?? true,
    })

    if (!timing.accepted) {
      return { error: timing.reason }
    }

    if (input.currentStatus === "returned") {
      return { nextStatus: "resubmitted", late: timing.late }
    }

    return {
      nextStatus: timing.late ? "late_submitted" : "submitted",
      late: timing.late,
    }
  }

  if (input.action === "return") {
    if (
      input.currentStatus === "submitted" ||
      input.currentStatus === "late_submitted" ||
      input.currentStatus === "resubmitted" ||
      input.currentStatus === "graded"
    ) {
      return { nextStatus: "returned", late: false }
    }

    return {
      error: `Cannot return submission in status '${input.currentStatus}'.`,
    }
  }

  if (input.action === "grade") {
    if (
      input.currentStatus === "submitted" ||
      input.currentStatus === "late_submitted" ||
      input.currentStatus === "resubmitted"
    ) {
      return { nextStatus: "graded", late: false }
    }

    return {
      error: `Cannot grade submission in status '${input.currentStatus}'.`,
    }
  }

  return { error: `Unknown submission action '${input.action}'.` }
}

export type SubmissionTimingResult =
  | { accepted: true; late: boolean }
  | { accepted: false; late: true; reason: "late_not_accepted" }

export function evaluateSubmissionTiming(input: {
  submittedAt: Date
  dueAt?: Date | null
  lateSubmissionsAccepted: boolean
}): SubmissionTimingResult {
  if (!input.dueAt || input.submittedAt.getTime() <= input.dueAt.getTime()) {
    return { accepted: true, late: false }
  }

  if (!input.lateSubmissionsAccepted) {
    return { accepted: false, late: true, reason: "late_not_accepted" }
  }

  return { accepted: true, late: true }
}

const COMPLETE_ITEM_STATUSES = new Set<AssignmentItemSubmissionStatus>([
  "completed",
  "submitted",
  "late_submitted",
  "resubmitted",
  "graded",
])

export function isAssignmentItemComplete(input: {
  status: AssignmentItemSubmissionStatus
}): boolean {
  return COMPLETE_ITEM_STATUSES.has(input.status)
}

export function canSubmitRequiredAssignmentItems(input: {
  items: Array<{
    required: boolean
    status?: AssignmentItemSubmissionStatus
  }>
}): { allowed: true } | { allowed: false; incompleteRequiredCount: number } {
  const incompleteRequiredCount = input.items.filter(
    (item) =>
      item.required &&
      !isAssignmentItemComplete({
        status: item.status ?? "not_started",
      })
  ).length

  if (incompleteRequiredCount === 0) {
    return { allowed: true }
  }

  return { allowed: false, incompleteRequiredCount }
}

export function canAttemptQuizItem(input: {
  attemptsCount: number
  maxAttempts?: number | null
}): boolean {
  if (input.maxAttempts == null) {
    return true
  }

  return input.attemptsCount < input.maxAttempts
}

export type AutoGradeResult =
  | { graded: true; correct: boolean; score: number; maxScore: number }
  | { graded: false; reason: "manual_grading_required" | "missing_answer_key" }

export function autoGradeAssignmentQuizQuestion(input: {
  questionType: AssignmentQuizQuestionType
  selectedAnswer: Record<string, unknown> | null | undefined
  correctAnswer: Record<string, unknown> | null | undefined
  points: number
}): AutoGradeResult {
  if (
    input.questionType !== "multiple_choice" &&
    input.questionType !== "true_false"
  ) {
    return { graded: false, reason: "manual_grading_required" }
  }

  if (!input.correctAnswer) {
    return { graded: false, reason: "missing_answer_key" }
  }

  if (input.questionType === "multiple_choice") {
    const selectedOption = getAnswerValue(input.selectedAnswer, [
      "optionId",
      "option_id",
    ])
    const correctOption = getAnswerValue(input.correctAnswer, [
      "optionId",
      "option_id",
    ])

    if (correctOption == null) {
      return { graded: false, reason: "missing_answer_key" }
    }

    const correct = selectedOption === correctOption
    return {
      graded: true,
      correct,
      score: correct ? input.points : 0,
      maxScore: input.points,
    }
  }

  const selectedValue = getAnswerValue(input.selectedAnswer, ["value"])
  const correctValue = getAnswerValue(input.correctAnswer, ["value"])

  if (typeof correctValue !== "boolean") {
    return { graded: false, reason: "missing_answer_key" }
  }

  const correct = selectedValue === correctValue
  return {
    graded: true,
    correct,
    score: correct ? input.points : 0,
    maxScore: input.points,
  }
}

export function requiresManualGrading(input: {
  itemType?: AssignmentItemType
  questionType?: AssignmentQuizQuestionType
  correctAnswer?: Record<string, unknown> | null
}): boolean {
  if (
    input.itemType === "manual_submission" ||
    input.itemType === "attachment"
  ) {
    return true
  }

  if (
    input.questionType === "short_answer" ||
    input.questionType === "fill_in_blank"
  ) {
    return true
  }

  if (
    (input.questionType === "multiple_choice" ||
      input.questionType === "true_false") &&
    !input.correctAnswer
  ) {
    return true
  }

  return false
}

export function isGradedWork(points: number): boolean {
  return points > 0
}

export function canUseLumiDuringWork(points: number): boolean {
  return points === 0
}

function getAnswerValue(
  record: Record<string, unknown> | null | undefined,
  keys: string[]
): unknown {
  if (!record) {
    return undefined
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key]
    }
  }

  return undefined
}
