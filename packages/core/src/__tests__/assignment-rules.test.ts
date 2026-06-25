import { describe, expect, it } from "vitest"
import {
  autoGradeAssignmentQuizQuestion,
  canAttemptQuizItem,
  canSubmitRequiredAssignmentItems,
  canUseLumiDuringWork,
  evaluateSubmissionTiming,
  isAssignmentItemComplete,
  isGradedWork,
  requiresManualGrading,
  resolveAssignmentStatusTransition,
  resolveSubmissionStatusTransition,
} from "../index"

describe("assignment status transitions", () => {
  it("allows draft publishing and published closing", () => {
    expect(
      resolveAssignmentStatusTransition({
        currentStatus: "draft",
        action: "publish",
      })
    ).toEqual({ nextStatus: "published" })

    expect(
      resolveAssignmentStatusTransition({
        currentStatus: "published",
        action: "close",
      })
    ).toEqual({ nextStatus: "closed" })
  })

  it("allows delete from non-terminal assignment states", () => {
    for (const currentStatus of ["draft", "published", "closed"] as const) {
      expect(
        resolveAssignmentStatusTransition({
          currentStatus,
          action: "delete",
        })
      ).toEqual({ nextStatus: "deleted" })
    }
  })

  it("rejects invalid assignment transitions and terminal deleted work", () => {
    expect(
      resolveAssignmentStatusTransition({
        currentStatus: "published",
        action: "publish",
      })
    ).toHaveProperty("error")

    expect(
      resolveAssignmentStatusTransition({
        currentStatus: "deleted",
        action: "close",
      })
    ).toHaveProperty("error")
  })
})

describe("submission timing and status transitions", () => {
  const dueAt = new Date("2026-06-14T12:00:00.000Z")

  it("treats exact due time as on time", () => {
    expect(
      evaluateSubmissionTiming({
        submittedAt: dueAt,
        dueAt,
        lateSubmissionsAccepted: false,
      })
    ).toEqual({ accepted: true, late: false })
  })

  it("marks accepted late submissions and rejects late submissions when disabled", () => {
    const submittedAt = new Date("2026-06-14T12:00:01.000Z")

    expect(
      evaluateSubmissionTiming({
        submittedAt,
        dueAt,
        lateSubmissionsAccepted: true,
      })
    ).toEqual({ accepted: true, late: true })

    expect(
      evaluateSubmissionTiming({
        submittedAt,
        dueAt,
        lateSubmissionsAccepted: false,
      })
    ).toEqual({
      accepted: false,
      late: true,
      reason: "late_not_accepted",
    })
  })

  it("saves drafts only from open draftable states", () => {
    for (const currentStatus of ["not_started", "draft", "returned"] as const) {
      expect(
        resolveSubmissionStatusTransition({
          currentStatus,
          action: "save_draft",
        })
      ).toEqual({ nextStatus: "draft", late: false })
    }

    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "graded",
        action: "save_draft",
      })
    ).toHaveProperty("error")
  })

  it("submits on time, late, and returned work with the right statuses", () => {
    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "draft",
        action: "submit",
        submittedAt: new Date("2026-06-14T11:59:00.000Z"),
        dueAt,
      })
    ).toEqual({ nextStatus: "submitted", late: false })

    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "draft",
        action: "submit",
        submittedAt: new Date("2026-06-14T12:01:00.000Z"),
        dueAt,
      })
    ).toEqual({ nextStatus: "late_submitted", late: true })

    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "returned",
        action: "submit",
        submittedAt: new Date("2026-06-14T12:01:00.000Z"),
        dueAt,
      })
    ).toEqual({ nextStatus: "resubmitted", late: true })
  })

  it("blocks late submits when late work is disabled", () => {
    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "draft",
        action: "submit",
        submittedAt: new Date("2026-06-14T12:01:00.000Z"),
        dueAt,
        lateSubmissionsAccepted: false,
      })
    ).toEqual({ error: "late_not_accepted" })
  })

  it("returns and grades submitted work only", () => {
    for (const currentStatus of [
      "submitted",
      "late_submitted",
      "resubmitted",
      "graded",
    ] as const) {
      expect(
        resolveSubmissionStatusTransition({
          currentStatus,
          action: "return",
        })
      ).toEqual({ nextStatus: "returned", late: false })
    }

    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "resubmitted",
        action: "grade",
      })
    ).toEqual({ nextStatus: "graded", late: false })

    expect(
      resolveSubmissionStatusTransition({
        currentStatus: "returned",
        action: "grade",
      })
    ).toHaveProperty("error")
  })
})

describe("assignment item completion", () => {
  it("recognizes completed item states", () => {
    for (const status of [
      "completed",
      "submitted",
      "late_submitted",
      "resubmitted",
      "graded",
    ] as const) {
      expect(isAssignmentItemComplete({ status })).toBe(true)
    }

    for (const status of [
      "not_started",
      "in_progress",
      "draft",
      "returned",
    ] as const) {
      expect(isAssignmentItemComplete({ status })).toBe(false)
    }
  })

  it("requires required items and allows optional items to be skipped", () => {
    expect(
      canSubmitRequiredAssignmentItems({
        items: [
          { required: true, status: "submitted" },
          { required: false, status: "not_started" },
        ],
      })
    ).toEqual({ allowed: true })

    expect(
      canSubmitRequiredAssignmentItems({
        items: [
          { required: true, status: "draft" },
          { required: true, status: "completed" },
          { required: false, status: "not_started" },
        ],
      })
    ).toEqual({ allowed: false, incompleteRequiredCount: 1 })
  })
})

describe("quiz attempts and grading", () => {
  it("supports unlimited and capped attempts", () => {
    expect(canAttemptQuizItem({ attemptsCount: 99 })).toBe(true)
    expect(canAttemptQuizItem({ attemptsCount: 1, maxAttempts: null })).toBe(
      true
    )
    expect(canAttemptQuizItem({ attemptsCount: 1, maxAttempts: 2 })).toBe(true)
    expect(canAttemptQuizItem({ attemptsCount: 2, maxAttempts: 2 })).toBe(false)
  })

  it("auto-grades multiple choice with camelCase and snake_case answer keys", () => {
    expect(
      autoGradeAssignmentQuizQuestion({
        questionType: "multiple_choice",
        selectedAnswer: { optionId: "b" },
        correctAnswer: { option_id: "b" },
        points: 2,
      })
    ).toEqual({ graded: true, correct: true, score: 2, maxScore: 2 })

    expect(
      autoGradeAssignmentQuizQuestion({
        questionType: "multiple_choice",
        selectedAnswer: { option_id: "a" },
        correctAnswer: { optionId: "b" },
        points: 2,
      })
    ).toEqual({ graded: true, correct: false, score: 0, maxScore: 2 })
  })

  it("auto-grades true false questions", () => {
    expect(
      autoGradeAssignmentQuizQuestion({
        questionType: "true_false",
        selectedAnswer: { value: true },
        correctAnswer: { value: true },
        points: 1,
      })
    ).toEqual({ graded: true, correct: true, score: 1, maxScore: 1 })
  })

  it("returns manual or missing-key outcomes for non-objective grading", () => {
    expect(
      autoGradeAssignmentQuizQuestion({
        questionType: "short_answer",
        selectedAnswer: { text: "Gravity pulls objects down." },
        correctAnswer: { text: "Gravity" },
        points: 2,
      })
    ).toEqual({ graded: false, reason: "manual_grading_required" })

    expect(
      autoGradeAssignmentQuizQuestion({
        questionType: "multiple_choice",
        selectedAnswer: { optionId: "a" },
        correctAnswer: null,
        points: 2,
      })
    ).toEqual({ graded: false, reason: "missing_answer_key" })
  })
})

describe("manual grading and Lumi practice rules", () => {
  it("requires manual grading for open work and attachments", () => {
    expect(requiresManualGrading({ itemType: "manual_submission" })).toBe(true)
    expect(requiresManualGrading({ itemType: "attachment" })).toBe(true)
    expect(requiresManualGrading({ questionType: "short_answer" })).toBe(true)
    expect(requiresManualGrading({ questionType: "fill_in_blank" })).toBe(true)
    expect(
      requiresManualGrading({
        questionType: "multiple_choice",
        correctAnswer: null,
      })
    ).toBe(true)
    expect(
      requiresManualGrading({
        questionType: "multiple_choice",
        correctAnswer: { optionId: "b" },
      })
    ).toBe(false)
  })

  it("allows Lumi only for zero-point practice work", () => {
    expect(isGradedWork(4)).toBe(true)
    expect(isGradedWork(0)).toBe(false)
    expect(canUseLumiDuringWork(0)).toBe(true)
    expect(canUseLumiDuringWork(0.5)).toBe(false)
  })
})
