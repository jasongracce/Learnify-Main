import type {
  AssignmentItemRecord,
  AssignmentQuizQuestionRecord,
  StudentAssignmentItemSubmissionRecord,
  StudentAssignmentSubmissionRecord,
} from "@learnify/shared"

export type AssignmentAnswerDrafts = Record<string, Record<string, unknown>>

export type AssignmentReceipt = {
  submissionId: string
  assignmentId: string
  status: string
  submittedAt: string | null
  late: boolean
  score: number | null
  maxScore: number
  versionNumber: number
}

export function indexItemSubmissions(
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
) {
  return new Map(
    itemSubmissions.map((submission) => [
      submission.assignment_item_id,
      submission,
    ])
  )
}

export function buildInitialAnswerDrafts(
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
): AssignmentAnswerDrafts {
  return Object.fromEntries(
    itemSubmissions.map((submission) => [
      submission.assignment_item_id,
      normalizeJsonObject(submission.answer_json),
    ])
  )
}

export function buildItemSubmissionPayload(input: {
  items: AssignmentItemRecord[]
  drafts: AssignmentAnswerDrafts
  includeQuiz?: boolean
}) {
  return input.items
    .filter((item) => input.includeQuiz || item.item_type !== "quiz")
    .map((item) => ({
      assignmentItemId: item.id,
      answerJson: input.drafts[item.id] ?? {},
    }))
    .filter((item) => Object.keys(item.answerJson).length > 0)
}

export function buildSaveDraftBody(input: {
  items: AssignmentItemRecord[]
  drafts: AssignmentAnswerDrafts
  locale: "en" | "th"
}) {
  return {
    locale: input.locale,
    itemSubmissions: buildItemSubmissionPayload({
      ...input,
      includeQuiz: false,
    }),
  }
}

export function buildSubmitBody(input: {
  items: AssignmentItemRecord[]
  drafts: AssignmentAnswerDrafts
  locale: "en" | "th"
}) {
  return {
    locale: input.locale,
    itemSubmissions: buildItemSubmissionPayload({
      ...input,
      includeQuiz: true,
    }),
    submittedAt: new Date().toISOString(),
  }
}

export function getManualSubmissionText(
  draft: Record<string, unknown> | undefined
) {
  return typeof draft?.text === "string" ? draft.text : ""
}

export function buildManualSubmissionAnswer(text: string) {
  return { text }
}

export function parseQuizOptions(question: AssignmentQuizQuestionRecord) {
  if (!Array.isArray(question.options_json)) return []

  return question.options_json
    .map((option) => {
      if (!option || typeof option !== "object") return null
      const record = option as Record<string, unknown>
      const id = record.id
      const labelEn = record.label_en ?? record.labelEn
      const labelTh = record.label_th ?? record.labelTh

      if (typeof id !== "string" || typeof labelEn !== "string") {
        return null
      }

      return {
        id,
        label_en: labelEn,
        label_th: typeof labelTh === "string" ? labelTh : null,
      }
    })
    .filter(
      (
        option
      ): option is { id: string; label_en: string; label_th: string | null } =>
        Boolean(option)
    )
}

export function buildQuizSelectedAnswer(input: {
  question: AssignmentQuizQuestionRecord
  value: string
}) {
  if (input.question.question_type === "true_false") {
    return { value: input.value === "true" }
  }

  return { optionId: input.value }
}

export function isSubmissionLocked(
  submission: StudentAssignmentSubmissionRecord | null
) {
  return Boolean(
    submission &&
      ["submitted", "late_submitted", "resubmitted", "graded"].includes(
        submission.status
      )
  )
}

export function formatAssignmentDate(value: string | null, locale: "en" | "th") {
  if (!value) return locale === "th" ? "No due date" : "No due date"
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatReceipt(receipt: AssignmentReceipt) {
  const score =
    receipt.score == null ? "Ungraded" : `${receipt.score}/${receipt.maxScore}`

  return `Version ${receipt.versionNumber} / ${receipt.status} / ${score}`
}

function normalizeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}
