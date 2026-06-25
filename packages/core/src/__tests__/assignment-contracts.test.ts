import { describe, expect, it } from "vitest"
import {
  assignmentItemSubmissionStatuses,
  assignmentItemTypes,
  assignmentQuizQuestionTypes,
  assignmentSubmissionStatuses,
  assignmentTypes,
  createAssignmentDraftRequestSchema,
  gradeAssignmentSubmissionRequestSchema,
  publishAssignmentRequestSchema,
  recordAssignmentQuizAttemptRequestSchema,
  returnAssignmentSubmissionRequestSchema,
  schoolAuditEventTypes,
  submitStudentAssignmentRequestSchema,
} from "@learnify/shared"

describe("assignment contract constants", () => {
  it("defines the Slice 2 assignment shapes", () => {
    expect(assignmentTypes).toEqual([
      "lesson",
      "quiz",
      "manual_submission",
      "mixed",
    ])
    expect(assignmentItemTypes).toEqual([
      "learnify_lesson",
      "quiz",
      "manual_submission",
      "attachment",
    ])
    expect(assignmentQuizQuestionTypes).toContain("fill_in_blank")
    expect(assignmentSubmissionStatuses).toEqual([
      "not_started",
      "draft",
      "submitted",
      "late_submitted",
      "returned",
      "resubmitted",
      "graded",
    ])
    expect(assignmentItemSubmissionStatuses).toContain("in_progress")
    expect(assignmentItemSubmissionStatuses).toContain("completed")
    expect(schoolAuditEventTypes).toContain("assignment.submission_graded")
    expect(schoolAuditEventTypes).toContain("assignment.submission_returned")
  })
})

describe("createAssignmentDraftRequestSchema", () => {
  const validDraft = {
    schoolId: "10000000-0000-4000-8000-000000000001",
    classroomId: "10000000-0000-4000-8000-000000000301",
    title: { en: "Gravity Checkpoint", th: "จุดตรวจเรื่องแรงโน้มถ่วง" },
    description: { en: "Lesson, quiz, and reflection" },
    assignmentType: "mixed",
    totalPoints: 4,
    items: [
      {
        itemType: "learnify_lesson",
        orderIndex: 0,
        title: { en: "Review the gravity lesson" },
        lessonId: "10000000-0000-4000-8000-000000000701",
        points: 0,
      },
      {
        itemType: "quiz",
        orderIndex: 1,
        title: { en: "Quick check" },
        points: 4,
      },
      {
        itemType: "manual_submission",
        orderIndex: 2,
        title: { en: "Reflection" },
        points: 0,
      },
    ],
    quizQuestions: [
      {
        questionType: "multiple_choice",
        orderIndex: 0,
        prompt: { en: "What happens when gravity increases?" },
        optionsJson: { options: ["decrease", "increase"] },
        correctAnswer: { option: "increase" },
        points: 2,
        maxAttempts: 2,
      },
    ],
  }

  it("accepts a mixed assignment draft with lesson, quiz, and manual items", () => {
    const parsed = createAssignmentDraftRequestSchema.parse(validDraft)

    expect(parsed.locale).toBe("en")
    expect(parsed.items).toHaveLength(3)
    expect(parsed.items[1]?.required).toBe(true)
    expect(parsed.quizQuestions[0]?.points).toBe(2)
  })

  it("rejects negative point values", () => {
    expect(() =>
      createAssignmentDraftRequestSchema.parse({
        ...validDraft,
        totalPoints: -1,
      })
    ).toThrow()
  })

  it("rejects unsupported quiz question types", () => {
    expect(() =>
      createAssignmentDraftRequestSchema.parse({
        ...validDraft,
        quizQuestions: [
          {
            questionType: "essay",
            orderIndex: 0,
            prompt: { en: "Explain gravity" },
          },
        ],
      })
    ).toThrow()
  })

  it("requires maxAttempts to be at least one when provided", () => {
    expect(() =>
      createAssignmentDraftRequestSchema.parse({
        ...validDraft,
        quizQuestions: [
          {
            questionType: "true_false",
            orderIndex: 0,
            prompt: { en: "Gravity pulls downward." },
            maxAttempts: 0,
          },
        ],
      })
    ).toThrow()
  })
})

describe("assignment action request schemas", () => {
  it("requires at least one recipient when publishing", () => {
    expect(() =>
      publishAssignmentRequestSchema.parse({ recipientStudentUserIds: [] })
    ).toThrow()

    expect(
      publishAssignmentRequestSchema.parse({
        recipientStudentUserIds: ["10000000-0000-4000-8000-000000000801"],
      }).locale
    ).toBe("en")
  })

  it("accepts student submission payloads", () => {
    const parsed = submitStudentAssignmentRequestSchema.parse({
      itemSubmissions: [
        {
          assignmentItemId: "10000000-0000-4000-8000-000000000613",
          answerJson: { text: "Gravity changes acceleration." },
        },
      ],
      submittedAt: "2026-06-14T12:00:00.000Z",
    })

    expect(parsed.itemSubmissions[0]?.answerJson).toEqual({
      text: "Gravity changes acceleration.",
    })
  })

  it("validates quiz attempt payloads", () => {
    const parsed = recordAssignmentQuizAttemptRequestSchema.parse({
      assignmentItemId: "10000000-0000-4000-8000-000000000612",
      questionId: "10000000-0000-4000-8000-000000000621",
      selectedAnswer: { optionId: "b" },
      attemptNumber: 1,
      timeSpentSeconds: 12,
    })

    expect(parsed.selectedAnswer).toEqual({ optionId: "b" })
  })

  it("validates teacher grading payloads", () => {
    const parsed = gradeAssignmentSubmissionRequestSchema.parse({
      schoolId: "10000000-0000-4000-8000-000000000001",
      feedback: { en: "Good recovery." },
      itemGrades: [
        {
          assignmentItemId: "10000000-0000-4000-8000-000000000613",
          score: 3,
          feedback: { en: "Clear explanation." },
        },
      ],
    })

    expect(parsed.locale).toBe("en")
    expect(parsed.itemGrades[0]?.score).toBe(3)
    expect(() =>
      gradeAssignmentSubmissionRequestSchema.parse({
        schoolId: "10000000-0000-4000-8000-000000000001",
        itemGrades: [
          {
            assignmentItemId: "10000000-0000-4000-8000-000000000613",
            score: -1,
          },
        ],
      })
    ).toThrow()
  })

  it("requires feedback when returning submissions", () => {
    expect(
      returnAssignmentSubmissionRequestSchema.parse({
        schoolId: "10000000-0000-4000-8000-000000000001",
        feedback: { th: "ลองแก้อีกครั้ง" },
      }).feedback.th
    ).toBe("ลองแก้อีกครั้ง")

    expect(() =>
      returnAssignmentSubmissionRequestSchema.parse({
        schoolId: "10000000-0000-4000-8000-000000000001",
        feedback: {},
      })
    ).toThrow()
  })
})
