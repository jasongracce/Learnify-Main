import { describe, expect, it } from "vitest"
import type {
  AssignmentItemRecord,
  AssignmentQuizQuestionRecord,
  StudentAssignmentItemSubmissionRecord,
  StudentAssignmentSubmissionRecord,
} from "@learnify/shared"
import {
  buildInitialAnswerDrafts,
  buildManualSubmissionAnswer,
  buildQuizSelectedAnswer,
  buildSaveDraftBody,
  buildSubmitBody,
  getManualSubmissionText,
  isSubmissionLocked,
  parseQuizOptions,
} from "./student-assignments"

const baseItem = {
  assignment_id: "assignment-1",
  created_at: "2026-06-25T00:00:00.000Z",
  instructions_en: null,
  instructions_th: null,
  lesson_id: null,
  order_index: 0,
  points: 0,
  required: true,
  settings: {},
  title_en: "Reflection",
  title_th: null,
  updated_at: "2026-06-25T00:00:00.000Z",
} satisfies Omit<AssignmentItemRecord, "id" | "item_type">

const manualItem = {
  ...baseItem,
  id: "manual-item",
  item_type: "manual_submission",
} satisfies AssignmentItemRecord

const quizItem = {
  ...baseItem,
  id: "quiz-item",
  item_type: "quiz",
} satisfies AssignmentItemRecord

function itemSubmission(
  patch: Partial<StudentAssignmentItemSubmissionRecord>
): StudentAssignmentItemSubmissionRecord {
  return {
    answer_json: null,
    assignment_item_id: "manual-item",
    attempts_count: 0,
    completed_at: null,
    created_at: "2026-06-25T00:00:00.000Z",
    feedback_en: null,
    feedback_th: null,
    id: "item-submission-1",
    max_score: 0,
    score: null,
    status: "draft",
    submission_id: "submission-1",
    updated_at: "2026-06-25T00:00:00.000Z",
    ...patch,
  }
}

function question(
  patch: Partial<AssignmentQuizQuestionRecord>
): AssignmentQuizQuestionRecord {
  return {
    assignment_item_id: "quiz-item",
    correct_answer: null,
    created_at: "2026-06-25T00:00:00.000Z",
    explanation_en: null,
    explanation_th: null,
    id: "question-1",
    max_attempts: null,
    options_json: null,
    order_index: 0,
    points: 1,
    prompt_en: "Question",
    prompt_th: null,
    question_type: "multiple_choice",
    updated_at: "2026-06-25T00:00:00.000Z",
    ...patch,
  }
}

function submission(
  status: StudentAssignmentSubmissionRecord["status"]
): StudentAssignmentSubmissionRecord {
  return {
    assignment_id: "assignment-1",
    created_at: "2026-06-25T00:00:00.000Z",
    feedback_en: null,
    feedback_th: null,
    graded_at: null,
    graded_by: null,
    id: "submission-1",
    late: false,
    max_score: 4,
    recipient_id: "recipient-1",
    returned_at: null,
    score: null,
    status,
    student_user_id: "student-1",
    submitted_at: null,
    updated_at: "2026-06-25T00:00:00.000Z",
  }
}

describe("student assignment helpers", () => {
  it("builds initial drafts from item submissions", () => {
    expect(
      buildInitialAnswerDrafts([
        itemSubmission({ answer_json: { text: "Saved answer" } }),
      ])
    ).toEqual({
      "manual-item": { text: "Saved answer" },
    })
  })

  it("builds draft and submit bodies with the right item payloads", () => {
    const drafts = {
      "manual-item": { text: "Reflection" },
      "quiz-item": { ignored: true },
    }

    expect(
      buildSaveDraftBody({
        drafts,
        items: [manualItem, quizItem],
        locale: "en",
      })
    ).toEqual({
      locale: "en",
      itemSubmissions: [
        {
          assignmentItemId: "manual-item",
          answerJson: { text: "Reflection" },
        },
      ],
    })

    expect(
      buildSubmitBody({
        drafts,
        items: [manualItem, quizItem],
        locale: "en",
      })
    ).toEqual({
      locale: "en",
      itemSubmissions: [
        {
          assignmentItemId: "manual-item",
          answerJson: { text: "Reflection" },
        },
        {
          assignmentItemId: "quiz-item",
          answerJson: { ignored: true },
        },
      ],
      submittedAt: expect.any(String),
    })
  })

  it("normalizes manual and quiz answers for API payloads", () => {
    expect(getManualSubmissionText({ text: "Existing" })).toBe("Existing")
    expect(buildManualSubmissionAnswer("Updated")).toEqual({ text: "Updated" })
    expect(
      buildQuizSelectedAnswer({
        question: question({ question_type: "multiple_choice" }),
        value: "b",
      })
    ).toEqual({ optionId: "b" })
    expect(
      buildQuizSelectedAnswer({
        question: question({ question_type: "true_false" }),
        value: "true",
      })
    ).toEqual({ value: true })
  })

  it("parses supported quiz options and detects locked submissions", () => {
    expect(
      parseQuizOptions(
        question({
          options_json: [
            { id: "a", label_en: "A", label_th: "ก" },
            { label_en: "Missing id" },
          ] as unknown as Record<string, unknown>,
        })
      )
    ).toEqual([{ id: "a", label_en: "A", label_th: "ก" }])

    expect(isSubmissionLocked(null)).toBe(false)
    expect(isSubmissionLocked(submission("draft"))).toBe(false)
    expect(isSubmissionLocked(submission("submitted"))).toBe(true)
    expect(isSubmissionLocked(submission("graded"))).toBe(true)
  })
})
