import { describe, expect, it } from "vitest"
import {
  createAssignmentDraft,
  gradeAssignmentSubmission,
  getStudentAssignmentDetail,
  getTeacherAssignmentDetail,
  listStudentAssignments,
  publishAssignmentToActiveStudents,
  recordAssignmentQuizAttempt,
  returnAssignmentSubmission,
  saveStudentAssignmentDraft,
  submitStudentAssignment,
  updateAssignmentDraft,
  type SupabaseClient,
} from "../index"

type QueryResult = {
  data?: unknown
  count?: number | null
  error?: { message: string } | null
}

type QueryCall = {
  table: string
  method: string
  payload?: unknown
}

class MockQuery {
  constructor(
    private readonly table: string,
    private readonly result: QueryResult,
    private readonly calls: QueryCall[]
  ) {}

  select() {
    this.calls.push({ table: this.table, method: "select" })
    return this
  }

  eq() {
    this.calls.push({ table: this.table, method: "eq" })
    return this
  }

  neq() {
    this.calls.push({ table: this.table, method: "neq" })
    return this
  }

  in() {
    this.calls.push({ table: this.table, method: "in" })
    return this
  }

  insert(payload: unknown) {
    this.calls.push({ table: this.table, method: "insert", payload })
    return this
  }

  update(payload: unknown) {
    this.calls.push({ table: this.table, method: "update", payload })
    return this
  }

  upsert(payload: unknown) {
    this.calls.push({ table: this.table, method: "upsert", payload })
    return this
  }

  delete() {
    this.calls.push({ table: this.table, method: "delete" })
    return this
  }

  order() {
    this.calls.push({ table: this.table, method: "order" })
    return this
  }

  limit() {
    this.calls.push({ table: this.table, method: "limit" })
    return this
  }

  maybeSingle<T>() {
    return Promise.resolve({
      data: (this.result.data ?? null) as T | null,
      error: this.result.error ?? null,
    })
  }

  single<T>() {
    return Promise.resolve({
      data: this.result.data as T,
      error: this.result.error ?? null,
    })
  }

  returns<T>() {
    return Promise.resolve({
      data: (this.result.data ?? []) as T,
      error: this.result.error ?? null,
    })
  }

  then<TResult1 = { data: unknown; error: unknown; count: number | null }>(
    onfulfilled?:
      | ((
          value: {
            data: unknown
            error: { message: string } | null
            count: number | null
          }
        ) => TResult1 | PromiseLike<TResult1>)
      | null
  ) {
    return Promise.resolve({
      data: this.result.data ?? null,
      error: this.result.error ?? null,
      count: this.result.count ?? null,
    }).then(onfulfilled)
  }
}

function createMockSupabase(tables: Record<string, QueryResult[]>) {
  const calls: QueryCall[] = []
  const queues = new Map(Object.entries(tables))
  const supabase = {
    from(table: string) {
      calls.push({ table, method: "from" })
      const queue = queues.get(table) ?? []
      const result = queue.shift() ?? { data: null, count: 0 }
      queues.set(table, queue)

      return new MockQuery(table, result, calls)
    },
  } as unknown as SupabaseClient

  return { calls, supabase }
}

const assignment = {
  id: "assignment-1",
  school_id: "school-1",
  classroom_id: "classroom-1",
  created_by: "teacher-user-1",
  title_en: "Gravity Checkpoint",
  title_th: null,
  description_en: null,
  description_th: null,
  assignment_type: "mixed",
  status: "draft",
  total_points: 4,
  due_at: "2026-06-30T00:00:00.000Z",
  published_at: null,
  closed_at: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
}

const publishedAssignment = {
  ...assignment,
  status: "published",
  published_at: "2026-06-14T00:00:00.000Z",
}

const quizItem = {
  id: "item-quiz-1",
  assignment_id: "assignment-1",
  item_type: "quiz",
  order_index: 0,
  title_en: "Quiz",
  title_th: null,
  instructions_en: null,
  instructions_th: null,
  lesson_id: null,
  points: 4,
  required: true,
  settings: { max_attempts: 2 },
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
}

const manualItem = {
  ...quizItem,
  id: "item-manual-1",
  item_type: "manual_submission",
  order_index: 1,
  title_en: "Reflection",
  points: 0,
}

const question = {
  id: "question-1",
  assignment_item_id: "item-quiz-1",
  question_type: "multiple_choice",
  order_index: 0,
  prompt_en: "What happens when gravity increases?",
  prompt_th: null,
  options_json: null,
  correct_answer: { option_id: "b" },
  explanation_en: null,
  explanation_th: null,
  points: 4,
  max_attempts: 2,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
}

const recipient = {
  id: "recipient-1",
  assignment_id: "assignment-1",
  classroom_membership_id: "classroom-membership-1",
  student_user_id: "student-user-1",
  status: "assigned",
  assigned_at: "2026-06-14T00:00:00.000Z",
  due_at: "2026-06-30T00:00:00.000Z",
  first_opened_at: null,
  submitted_at: null,
  returned_at: null,
  graded_at: null,
  excused_at: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
}

const submission = {
  id: "submission-1",
  assignment_id: "assignment-1",
  recipient_id: "recipient-1",
  student_user_id: "student-user-1",
  status: "not_started",
  score: null,
  max_score: 4,
  submitted_at: null,
  late: false,
  returned_at: null,
  graded_at: null,
  graded_by: null,
  feedback_en: null,
  feedback_th: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
}

const submittedSubmission = {
  ...submission,
  status: "submitted",
  submitted_at: "2026-06-14T12:00:00.000Z",
}

const itemSubmission = {
  id: "item-submission-1",
  submission_id: "submission-1",
  assignment_item_id: "item-quiz-1",
  status: "completed",
  answer_json: {},
  score: 4,
  max_score: 4,
  attempts_count: 1,
  completed_at: "2026-06-14T00:00:00.000Z",
  feedback_en: null,
  feedback_th: null,
  created_at: "2026-06-14T00:00:00.000Z",
  updated_at: "2026-06-14T00:00:00.000Z",
}

describe("assignment repositories", () => {
  it("creates a draft with bilingual items and quiz questions", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_assignments: [{ data: assignment }],
      assignment_items: [{ data: [quizItem] }],
      assignment_quiz_questions: [{ data: [question] }],
    })

    await expect(
      createAssignmentDraft({
        supabase,
        createdBy: "teacher-user-1",
        request: {
          schoolId: "00000000-0000-4000-8000-000000000001",
          classroomId: "00000000-0000-4000-8000-000000000002",
          locale: "en",
          title: { en: "Gravity Checkpoint", th: "Thai title" },
          assignmentType: "mixed",
          totalPoints: 4,
          items: [
            {
              itemType: "quiz",
              orderIndex: 0,
              title: { en: "Quiz", th: "Thai quiz" },
              points: 4,
              required: true,
              settings: {},
            },
          ],
          quizQuestions: [
            {
              questionType: "multiple_choice",
              orderIndex: 0,
              prompt: { en: "Question?" },
              correctAnswer: { option_id: "b" },
              points: 4,
            },
          ],
        },
      })
    ).resolves.toMatchObject({
      assignment: { id: "assignment-1" },
      items: [{ id: "item-quiz-1" }],
      quizQuestions: [{ id: "question-1" }],
    })

    expect(
      calls.find(
        (call) => call.table === "classroom_assignments" && call.method === "insert"
      )?.payload
    ).toMatchObject({ title_en: "Gravity Checkpoint", title_th: "Thai title" })
  })

  it("rejects draft updates for published assignments", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
    })

    await expect(
      updateAssignmentDraft({
        supabase,
        assignmentId: "assignment-1",
        request: { title: { en: "Updated" }, locale: "en" },
      })
    ).rejects.toThrow("Only draft assignments can be updated.")
  })

  it("publishes an assignment to active classroom students", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_assignments: [
        { data: assignment },
        { data: publishedAssignment },
      ],
      classroom_memberships: [
        {
          data: [
            {
              id: "classroom-membership-1",
              student_user_id: "student-user-1",
            },
          ],
        },
      ],
      assignment_recipients: [{ data: [recipient] }],
    })

    await expect(
      publishAssignmentToActiveStudents({
        supabase,
        assignmentId: "assignment-1",
        now: new Date("2026-06-14T00:00:00.000Z"),
      })
    ).resolves.toMatchObject({
      assignment: { status: "published" },
      recipients: [{ student_user_id: "student-user-1" }],
    })

    expect(
      calls.some(
        (call) =>
          call.table === "assignment_recipients" && call.method === "upsert"
      )
    ).toBe(true)
  })

  it("fetches teacher assignment detail", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_items: [{ data: [quizItem] }],
      assignment_recipients: [{ data: [recipient] }],
      student_assignment_submissions: [{ data: [submission] }],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [{ data: [itemSubmission] }],
    })

    await expect(
      getTeacherAssignmentDetail({ supabase, assignmentId: "assignment-1" })
    ).resolves.toMatchObject({
      assignment: { id: "assignment-1" },
      items: [{ id: "item-quiz-1" }],
      quizQuestions: [{ id: "question-1" }],
      recipients: [{ id: "recipient-1" }],
    })
  })

  it("lists student assigned published work", async () => {
    const { supabase } = createMockSupabase({
      assignment_recipients: [{ data: [recipient] }],
      classroom_assignments: [{ data: [publishedAssignment] }],
      student_assignment_submissions: [{ data: [submission] }],
    })

    await expect(
      listStudentAssignments({ supabase, studentUserId: "student-user-1" })
    ).resolves.toMatchObject([
      {
        assignment: { id: "assignment-1" },
        recipient: { id: "recipient-1" },
        submission: { id: "submission-1" },
      },
    ])
  })

  it("fetches student assignment detail for assigned published work", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_recipients: [{ data: recipient }],
      assignment_items: [{ data: [quizItem] }],
      student_assignment_submissions: [{ data: submission }],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [{ data: [itemSubmission] }],
    })

    await expect(
      getStudentAssignmentDetail({
        supabase,
        assignmentId: "assignment-1",
        studentUserId: "student-user-1",
      })
    ).resolves.toMatchObject({
      assignment: { id: "assignment-1" },
      recipient: { id: "recipient-1" },
      submission: { id: "submission-1" },
    })
  })

  it("saves student draft submissions and writes a version", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_recipients: [{ data: recipient }],
      assignment_items: [{ data: [manualItem] }],
      student_assignment_submissions: [
        { data: null },
        { data: submission },
        { data: { ...submission, status: "draft" } },
      ],
      student_assignment_item_submissions: [
        {
          data: [
            {
              ...itemSubmission,
              assignment_item_id: "item-manual-1",
              status: "draft",
            },
          ],
        },
      ],
      submission_versions: [{ data: null }, { data: { id: "version-1" } }],
    })

    await expect(
      saveStudentAssignmentDraft({
        supabase,
        assignmentId: "assignment-1",
        studentUserId: "student-user-1",
        request: {
          locale: "en",
          itemSubmissions: [
            { assignmentItemId: "item-manual-1", answerJson: { text: "Draft" } },
          ],
        },
      })
    ).resolves.toMatchObject({
      submission: { status: "draft" },
      version: { id: "version-1" },
    })

    expect(
      calls.some(
        (call) =>
          call.table === "submission_versions" && call.method === "insert"
      )
    ).toBe(true)
  })

  it("rejects final submit when required items are incomplete", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_recipients: [{ data: recipient }],
      assignment_items: [{ data: [manualItem] }],
      student_assignment_submissions: [{ data: submission }],
      student_assignment_item_submissions: [{ data: [] }, { data: [] }],
    })

    await expect(
      submitStudentAssignment({
        supabase,
        assignmentId: "assignment-1",
        studentUserId: "student-user-1",
        request: {
          locale: "en",
          itemSubmissions: [
            { assignmentItemId: "item-manual-1", answerJson: { text: "Done" } },
          ],
        },
      })
    ).rejects.toThrow("Required assignment items are incomplete.")
  })

  it("records and auto-grades objective quiz attempts", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_recipients: [{ data: recipient }],
      assignment_items: [{ data: [quizItem] }],
      student_assignment_submissions: [{ data: submission }],
      assignment_quiz_questions: [{ data: question }],
      student_assignment_item_submissions: [
        { data: null },
        { data: { ...itemSubmission, score: 4, attempts_count: 1 } },
      ],
    })

    await expect(
      recordAssignmentQuizAttempt({
        supabase,
        assignmentId: "assignment-1",
        studentUserId: "student-user-1",
        request: {
          locale: "en",
          assignmentItemId: "item-quiz-1",
          questionId: "question-1",
          selectedAnswer: { option_id: "b" },
          attemptNumber: 1,
        },
      })
    ).resolves.toMatchObject({
      score: 4,
      attempts_count: 1,
    })

    expect(
      calls.find(
        (call) =>
          call.table === "student_assignment_item_submissions" &&
          call.method === "upsert"
      )?.payload
    ).toMatchObject({ status: "completed", score: 4, attempts_count: 1 })
  })

  it("grades submitted work, recomputes score, and marks the recipient graded", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_items: [{ data: [quizItem, manualItem] }],
      student_assignment_submissions: [
        { data: [submittedSubmission] },
        {
          data: {
            ...submittedSubmission,
            status: "graded",
            score: 3,
            graded_by: "teacher-user-1",
          },
        },
      ],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [
        {
          data: [
            { ...itemSubmission, score: 1 },
            {
              ...itemSubmission,
              id: "item-submission-2",
              assignment_item_id: "item-manual-1",
              score: 2,
              max_score: 0,
            },
          ],
        },
        { data: { ...itemSubmission, status: "graded", score: 3 } },
        {
          data: [
            { ...itemSubmission, score: 3 },
            {
              ...itemSubmission,
              id: "item-submission-2",
              assignment_item_id: "item-manual-1",
              score: 0,
              max_score: 0,
            },
          ],
        },
      ],
      assignment_recipients: [
        { data: [recipient] },
        { data: { ...recipient, status: "graded" } },
      ],
    })

    await expect(
      gradeAssignmentSubmission({
        supabase,
        assignmentId: "assignment-1",
        submissionId: "submission-1",
        gradedBy: "teacher-user-1",
        request: {
          schoolId: "00000000-0000-4000-8000-000000000001",
          locale: "en",
          feedback: { en: "Done" },
          itemGrades: [
            {
              assignmentItemId: "item-quiz-1",
              score: 3,
              feedback: { en: "Nearly there" },
            },
          ],
        },
        now: new Date("2026-06-15T00:00:00.000Z"),
      })
    ).resolves.toMatchObject({
      submission: { status: "graded", score: 3, graded_by: "teacher-user-1" },
    })

    expect(
      calls.filter(
        (call) =>
          call.table === "student_assignment_item_submissions" &&
          call.method === "update"
      )[0]?.payload
    ).toMatchObject({
      status: "graded",
      score: 3,
      feedback_en: "Nearly there",
    })
    expect(
      calls.find(
        (call) =>
          call.table === "student_assignment_submissions" &&
          call.method === "update"
      )?.payload
    ).toMatchObject({
      status: "graded",
      score: 3,
      graded_by: "teacher-user-1",
      feedback_en: "Done",
    })
    expect(
      calls.find(
        (call) => call.table === "assignment_recipients" && call.method === "update"
      )?.payload
    ).toMatchObject({ status: "graded" })
  })

  it("returns submitted work with feedback and marks the recipient returned", async () => {
    const { calls, supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_items: [{ data: [quizItem] }],
      assignment_recipients: [
        { data: [recipient] },
        { data: { ...recipient, status: "returned" } },
      ],
      student_assignment_submissions: [
        { data: [submittedSubmission] },
        {
          data: {
            ...submittedSubmission,
            status: "returned",
            returned_at: "2026-06-15T00:00:00.000Z",
            feedback_en: "Please revise.",
          },
        },
      ],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [{ data: [itemSubmission] }],
    })

    await expect(
      returnAssignmentSubmission({
        supabase,
        assignmentId: "assignment-1",
        submissionId: "submission-1",
        returnedBy: "teacher-user-1",
        request: {
          schoolId: "00000000-0000-4000-8000-000000000001",
          locale: "en",
          feedback: { en: "Please revise." },
        },
        now: new Date("2026-06-15T00:00:00.000Z"),
      })
    ).resolves.toMatchObject({
      submission: { status: "returned", feedback_en: "Please revise." },
    })

    expect(
      calls.find(
        (call) =>
          call.table === "student_assignment_submissions" &&
          call.method === "update"
      )?.payload
    ).toMatchObject({ status: "returned", feedback_en: "Please revise." })
    expect(
      calls.find(
        (call) => call.table === "assignment_recipients" && call.method === "update"
      )?.payload
    ).toMatchObject({ status: "returned" })
  })

  it("rejects invalid grading transitions", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_items: [{ data: [quizItem] }],
      assignment_recipients: [{ data: [recipient] }],
      student_assignment_submissions: [{ data: [submission] }],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [{ data: [itemSubmission] }],
    })

    await expect(
      gradeAssignmentSubmission({
        supabase,
        assignmentId: "assignment-1",
        submissionId: "submission-1",
        gradedBy: "teacher-user-1",
        request: {
          schoolId: "00000000-0000-4000-8000-000000000001",
          locale: "en",
        },
      })
    ).rejects.toThrow("Cannot grade submission")
  })

  it("rejects item scores above the assignment item points", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_items: [{ data: [quizItem] }],
      assignment_recipients: [{ data: [recipient] }],
      student_assignment_submissions: [{ data: [submittedSubmission] }],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [{ data: [itemSubmission] }],
    })

    await expect(
      gradeAssignmentSubmission({
        supabase,
        assignmentId: "assignment-1",
        submissionId: "submission-1",
        gradedBy: "teacher-user-1",
        request: {
          schoolId: "00000000-0000-4000-8000-000000000001",
          locale: "en",
          itemGrades: [{ assignmentItemId: "item-quiz-1", score: 5 }],
        },
      })
    ).rejects.toThrow("Item score cannot exceed item points.")
  })

  it("rejects submissions outside the assignment", async () => {
    const { supabase } = createMockSupabase({
      classroom_assignments: [{ data: publishedAssignment }],
      assignment_items: [{ data: [quizItem] }],
      assignment_recipients: [{ data: [recipient] }],
      student_assignment_submissions: [{ data: [] }],
      assignment_attachments: [{ data: [] }],
      assignment_quiz_questions: [{ data: [question] }],
      student_assignment_item_submissions: [{ data: [] }],
    })

    await expect(
      returnAssignmentSubmission({
        supabase,
        assignmentId: "assignment-1",
        submissionId: "submission-outside",
        returnedBy: "teacher-user-1",
        request: {
          schoolId: "00000000-0000-4000-8000-000000000001",
          locale: "en",
          feedback: { en: "Revise." },
        },
      })
    ).rejects.toThrow("Assignment submission not found.")
  })
})
