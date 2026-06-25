import type { SupabaseClient as SupabaseJsClient } from "@supabase/supabase-js"
import {
  autoGradeAssignmentQuizQuestion,
  canAttemptQuizItem,
  canSubmitRequiredAssignmentItems,
  resolveAssignmentStatusTransition,
  resolveSubmissionStatusTransition,
} from "@learnify/core"
import type {
  AssignmentAttachmentRecord,
  AssignmentItemRecord,
  AssignmentQuizQuestionRecord,
  AssignmentRecipientRecord,
  ClassroomAssignmentRecord,
  CreateAssignmentDraftRequest,
  GradeAssignmentSubmissionRequest,
  RecordAssignmentQuizAttemptRequest,
  ReturnAssignmentSubmissionRequest,
  SaveStudentAssignmentDraftRequest,
  StudentAssignmentItemSubmissionRecord,
  StudentAssignmentSubmissionRecord,
  SubmissionVersionRecord,
  SubmitStudentAssignmentRequest,
  UpdateAssignmentDraftRequest,
} from "@learnify/shared"

type SupabaseClient = SupabaseJsClient<any>

export type AssignmentDetail = {
  assignment: ClassroomAssignmentRecord
  items: AssignmentItemRecord[]
  quizQuestions: AssignmentQuizQuestionRecord[]
  recipients: AssignmentRecipientRecord[]
  submissions: StudentAssignmentSubmissionRecord[]
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
  attachments: AssignmentAttachmentRecord[]
}

export type StudentAssignmentDetail = {
  assignment: ClassroomAssignmentRecord
  items: AssignmentItemRecord[]
  quizQuestions: AssignmentQuizQuestionRecord[]
  recipient: AssignmentRecipientRecord
  submission: StudentAssignmentSubmissionRecord | null
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
  attachments: AssignmentAttachmentRecord[]
}

export async function createAssignmentDraft(input: {
  supabase: SupabaseClient
  createdBy: string | null
  request: CreateAssignmentDraftRequest
}): Promise<AssignmentDetail> {
  const { request } = input
  const { data: assignment, error } = await input.supabase
    .from("classroom_assignments")
    .insert({
      school_id: request.schoolId,
      classroom_id: request.classroomId,
      created_by: input.createdBy,
      title_en: request.title.en,
      title_th: request.title.th ?? null,
      description_en: request.description?.en ?? null,
      description_th: request.description?.th ?? null,
      assignment_type: request.assignmentType,
      status: "draft",
      total_points: request.totalPoints,
      due_at: request.dueAt ?? null,
    })
    .select("*")
    .single<ClassroomAssignmentRecord>()

  if (error) throw new Error(error.message)

  const items = await insertAssignmentItems({
    supabase: input.supabase,
    assignmentId: assignment.id,
    items: request.items,
  })
  const quizQuestions = await insertAssignmentQuizQuestions({
    supabase: input.supabase,
    items,
    quizQuestions: request.quizQuestions,
  })

  return {
    assignment,
    items,
    quizQuestions,
    recipients: [],
    submissions: [],
    itemSubmissions: [],
    attachments: [],
  }
}

export async function listAssignmentsForClassroom(input: {
  supabase: SupabaseClient
  classroomId: string
}): Promise<ClassroomAssignmentRecord[]> {
  const { data, error } = await input.supabase
    .from("classroom_assignments")
    .select("*")
    .eq("classroom_id", input.classroomId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .returns<ClassroomAssignmentRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

export async function updateAssignmentDraft(input: {
  supabase: SupabaseClient
  assignmentId: string
  request: UpdateAssignmentDraftRequest
}): Promise<AssignmentDetail> {
  const current = await getAssignmentById({
    supabase: input.supabase,
    assignmentId: input.assignmentId,
  })
  if (!current) throw new Error("Assignment not found.")
  if (current.status !== "draft") {
    throw new Error("Only draft assignments can be updated.")
  }

  const patch: Record<string, unknown> = {}
  if (input.request.title) {
    patch.title_en = input.request.title.en
    patch.title_th = input.request.title.th ?? null
  }
  if (input.request.description) {
    patch.description_en = input.request.description.en ?? null
    patch.description_th = input.request.description.th ?? null
  }
  if (input.request.assignmentType) patch.assignment_type = input.request.assignmentType
  if (input.request.totalPoints != null) patch.total_points = input.request.totalPoints
  if (input.request.dueAt !== undefined) patch.due_at = input.request.dueAt ?? null

  let assignment = current
  if (Object.keys(patch).length > 0) {
    const { data, error } = await input.supabase
      .from("classroom_assignments")
      .update(patch)
      .eq("id", input.assignmentId)
      .select("*")
      .single<ClassroomAssignmentRecord>()

    if (error) throw new Error(error.message)
    assignment = data
  }

  if (input.request.items || input.request.quizQuestions) {
    await deleteAssignmentChildren({
      supabase: input.supabase,
      assignmentId: input.assignmentId,
    })
  }

  const items = input.request.items
    ? await insertAssignmentItems({
        supabase: input.supabase,
        assignmentId: input.assignmentId,
        items: input.request.items,
      })
    : await listAssignmentItems({
        supabase: input.supabase,
        assignmentId: input.assignmentId,
      })

  const quizQuestions = input.request.quizQuestions
    ? await insertAssignmentQuizQuestions({
        supabase: input.supabase,
        items,
        quizQuestions: input.request.quizQuestions,
      })
    : await listAssignmentQuizQuestions({
        supabase: input.supabase,
        assignmentItemIds: items.map((item) => item.id),
      })

  return {
    assignment,
    items,
    quizQuestions,
    recipients: [],
    submissions: [],
    itemSubmissions: [],
    attachments: [],
  }
}

export async function publishAssignmentToActiveStudents(input: {
  supabase: SupabaseClient
  assignmentId: string
  recipientStudentUserIds?: string[]
  dueAt?: string
  now?: Date
}): Promise<{
  assignment: ClassroomAssignmentRecord
  recipients: AssignmentRecipientRecord[]
}> {
  const assignment = await getAssignmentById({
    supabase: input.supabase,
    assignmentId: input.assignmentId,
  })
  if (!assignment) throw new Error("Assignment not found.")

  const transition = resolveAssignmentStatusTransition({
    currentStatus: assignment.status,
    action: "publish",
  })
  if ("error" in transition) throw new Error(transition.error)

  const memberships = await listActiveStudentClassroomMemberships({
    supabase: input.supabase,
    classroomId: assignment.classroom_id,
    studentUserIds: input.recipientStudentUserIds,
  })
  const now = (input.now ?? new Date()).toISOString()

  const { data: published, error: updateError } = await input.supabase
    .from("classroom_assignments")
    .update({
      status: transition.nextStatus,
      due_at: input.dueAt ?? assignment.due_at,
      published_at: now,
    })
    .eq("id", assignment.id)
    .select("*")
    .single<ClassroomAssignmentRecord>()

  if (updateError) throw new Error(updateError.message)

  const rows = memberships.map((membership) => ({
    assignment_id: assignment.id,
    classroom_membership_id: membership.id,
    student_user_id: membership.student_user_id,
    status: "assigned",
    due_at: input.dueAt ?? assignment.due_at,
    assigned_at: now,
  }))

  if (rows.length === 0) {
    return { assignment: published, recipients: [] }
  }

  const { data: recipients, error: recipientError } = await input.supabase
    .from("assignment_recipients")
    .upsert(rows, { onConflict: "assignment_id,student_user_id" })
    .select("*")
    .returns<AssignmentRecipientRecord[]>()

  if (recipientError) throw new Error(recipientError.message)

  return { assignment: published, recipients }
}

export async function getTeacherAssignmentDetail(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<AssignmentDetail | null> {
  const assignment = await getAssignmentById({
    supabase: input.supabase,
    assignmentId: input.assignmentId,
  })
  if (!assignment) return null

  const [items, recipients, submissions, attachments] = await Promise.all([
    listAssignmentItems({ supabase: input.supabase, assignmentId: assignment.id }),
    listAssignmentRecipients({ supabase: input.supabase, assignmentId: assignment.id }),
    listAssignmentSubmissions({ supabase: input.supabase, assignmentId: assignment.id }),
    listAssignmentAttachments({ supabase: input.supabase, assignmentId: assignment.id }),
  ])
  const [quizQuestions, itemSubmissions] = await Promise.all([
    listAssignmentQuizQuestions({
      supabase: input.supabase,
      assignmentItemIds: items.map((item) => item.id),
    }),
    listAssignmentItemSubmissions({
      supabase: input.supabase,
      submissionIds: submissions.map((submission) => submission.id),
    }),
  ])

  return {
    assignment,
    items,
    quizQuestions,
    recipients,
    submissions,
    itemSubmissions,
    attachments,
  }
}

export async function listStudentAssignments(input: {
  supabase: SupabaseClient
  studentUserId: string
}): Promise<Array<{
  assignment: ClassroomAssignmentRecord
  recipient: AssignmentRecipientRecord
  submission: StudentAssignmentSubmissionRecord | null
}>> {
  const recipients = await listAssignmentRecipientsForStudent({
    supabase: input.supabase,
    studentUserId: input.studentUserId,
  })
  if (recipients.length === 0) return []

  const assignmentIds = recipients.map((recipient) => recipient.assignment_id)
  const [assignments, submissions] = await Promise.all([
    listPublishedAssignmentsByIds({
      supabase: input.supabase,
      assignmentIds,
    }),
    listStudentSubmissionsForAssignments({
      supabase: input.supabase,
      studentUserId: input.studentUserId,
      assignmentIds,
    }),
  ])

  const recipientByAssignmentId = new Map(
    recipients.map((recipient) => [recipient.assignment_id, recipient])
  )
  const submissionByAssignmentId = new Map(
    submissions.map((submission) => [submission.assignment_id, submission])
  )

  return assignments.map((assignment) => ({
    assignment,
    recipient: recipientByAssignmentId.get(assignment.id)!,
    submission: submissionByAssignmentId.get(assignment.id) ?? null,
  }))
}

export async function getStudentAssignmentDetail(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
}): Promise<StudentAssignmentDetail | null> {
  const [assignment, recipient] = await Promise.all([
    getAssignmentById({ supabase: input.supabase, assignmentId: input.assignmentId }),
    getAssignmentRecipientForStudent({
      supabase: input.supabase,
      assignmentId: input.assignmentId,
      studentUserId: input.studentUserId,
    }),
  ])
  if (!assignment || assignment.status !== "published" || !recipient) return null

  const [items, submission, attachments] = await Promise.all([
    listAssignmentItems({ supabase: input.supabase, assignmentId: input.assignmentId }),
    getStudentAssignmentSubmission({
      supabase: input.supabase,
      assignmentId: input.assignmentId,
      studentUserId: input.studentUserId,
    }),
    listAssignmentAttachments({ supabase: input.supabase, assignmentId: input.assignmentId }),
  ])
  const [quizQuestions, itemSubmissions] = await Promise.all([
    listAssignmentQuizQuestions({
      supabase: input.supabase,
      assignmentItemIds: items.map((item) => item.id),
    }),
    submission
      ? listAssignmentItemSubmissions({
          supabase: input.supabase,
          submissionIds: [submission.id],
        })
      : Promise.resolve([]),
  ])

  return {
    assignment,
    items,
    quizQuestions,
    recipient,
    submission,
    itemSubmissions,
    attachments,
  }
}

export async function saveStudentAssignmentDraft(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
  request: SaveStudentAssignmentDraftRequest
  now?: Date
}): Promise<{
  submission: StudentAssignmentSubmissionRecord
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
  version: SubmissionVersionRecord
}> {
  const context = await getStudentSubmissionContext(input)
  const transition = resolveSubmissionStatusTransition({
    currentStatus: context.submission.status,
    action: "save_draft",
  })
  if ("error" in transition) throw new Error(transition.error)

  const now = (input.now ?? new Date()).toISOString()
  const itemSubmissions = await upsertItemDrafts({
    supabase: input.supabase,
    submission: context.submission,
    itemSubmissions: input.request.itemSubmissions,
    now,
    finalStatus: "draft",
  })

  const { data: submission, error } = await input.supabase
    .from("student_assignment_submissions")
    .update({ status: transition.nextStatus, late: transition.late })
    .eq("id", context.submission.id)
    .select("*")
    .single<StudentAssignmentSubmissionRecord>()

  if (error) throw new Error(error.message)

  const version = await insertSubmissionVersion({
    supabase: input.supabase,
    submissionId: submission.id,
    body: buildSubmissionSnapshot({ submission, itemSubmissions }),
    now,
  })

  return { submission, itemSubmissions, version }
}

export async function submitStudentAssignment(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
  request: SubmitStudentAssignmentRequest
  now?: Date
}): Promise<{
  submission: StudentAssignmentSubmissionRecord
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
  version: SubmissionVersionRecord
}> {
  const context = await getStudentSubmissionContext(input)
  const now = input.request.submittedAt ?? (input.now ?? new Date()).toISOString()
  const itemSubmissions = await upsertItemDrafts({
    supabase: input.supabase,
    submission: context.submission,
    itemSubmissions: input.request.itemSubmissions,
    now,
    finalStatus: "submitted",
  })
  const currentItemSubmissions = await listAssignmentItemSubmissions({
    supabase: input.supabase,
    submissionIds: [context.submission.id],
  })
  const statusByItemId = new Map(
    currentItemSubmissions.map((item) => [item.assignment_item_id, item.status])
  )
  const completion = canSubmitRequiredAssignmentItems({
    items: context.items.map((item) => ({
      required: item.required,
      status: statusByItemId.get(item.id),
    })),
  })
  if (!completion.allowed) {
    throw new Error("Required assignment items are incomplete.")
  }

  const transition = resolveSubmissionStatusTransition({
    currentStatus: context.submission.status,
    action: "submit",
    submittedAt: new Date(now),
    dueAt: parseOptionalDate(context.assignment.due_at ?? context.recipient.due_at),
    lateSubmissionsAccepted: true,
  })
  if ("error" in transition) throw new Error(transition.error)

  const score = currentItemSubmissions.reduce(
    (total, item) => total + Number(item.score ?? 0),
    0
  )
  const maxScore = context.items.reduce((total, item) => total + Number(item.points), 0)
  const { data: submission, error } = await input.supabase
    .from("student_assignment_submissions")
    .update({
      status: transition.nextStatus,
      score,
      max_score: maxScore,
      submitted_at: now,
      late: transition.late,
    })
    .eq("id", context.submission.id)
    .select("*")
    .single<StudentAssignmentSubmissionRecord>()

  if (error) throw new Error(error.message)

  await updateAssignmentRecipientAfterSubmit({
    supabase: input.supabase,
    recipientId: context.recipient.id,
    status: transition.nextStatus === "late_submitted" ? "submitted" : "submitted",
    submittedAt: now,
  })

  const version = await insertSubmissionVersion({
    supabase: input.supabase,
    submissionId: submission.id,
    body: buildSubmissionSnapshot({
      submission,
      itemSubmissions: currentItemSubmissions,
    }),
    now,
  })

  return {
    submission,
    itemSubmissions: currentItemSubmissions,
    version,
  }
}

export async function recordAssignmentQuizAttempt(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
  request: RecordAssignmentQuizAttemptRequest
  now?: Date
}): Promise<StudentAssignmentItemSubmissionRecord> {
  const context = await getStudentSubmissionContext(input)
  const item = context.items.find(
    (candidate) => candidate.id === input.request.assignmentItemId
  )
  if (!item) throw new Error("Assignment item not found.")
  if (item.item_type !== "quiz") throw new Error("Assignment item is not a quiz.")

  const question = await getAssignmentQuizQuestion({
    supabase: input.supabase,
    questionId: input.request.questionId,
    assignmentItemId: item.id,
  })
  if (!question) throw new Error("Quiz question not found.")

  const current = await getStudentAssignmentItemSubmission({
    supabase: input.supabase,
    submissionId: context.submission.id,
    assignmentItemId: item.id,
  })
  const attemptsCount = current?.attempts_count ?? 0
  const maxAttempts = question.max_attempts ?? getMaxAttemptsFromSettings(item.settings)
  if (!canAttemptQuizItem({ attemptsCount, maxAttempts })) {
    throw new Error("Maximum attempts reached.")
  }

  const grading = autoGradeAssignmentQuizQuestion({
    questionType: question.question_type,
    selectedAnswer: input.request.selectedAnswer,
    correctAnswer: question.correct_answer,
    points: Number(question.points),
  })
  const now = (input.now ?? new Date()).toISOString()
  const answerJson = mergeQuizAnswer({
    currentAnswerJson: current?.answer_json,
    question,
    selectedAnswer: input.request.selectedAnswer,
    grading,
    attemptedAt: now,
  })
  const score = grading.graded ? Number(current?.score ?? 0) + grading.score : current?.score ?? null
  const maxScore = Number(current?.max_score ?? 0) + Number(question.points)

  const { data, error } = await input.supabase
    .from("student_assignment_item_submissions")
    .upsert(
      {
        submission_id: context.submission.id,
        assignment_item_id: item.id,
        status: grading.graded && grading.correct ? "completed" : "in_progress",
        answer_json: answerJson,
        score,
        max_score: maxScore,
        attempts_count: attemptsCount + 1,
        completed_at: grading.graded && grading.correct ? now : null,
      },
      { onConflict: "submission_id,assignment_item_id" }
    )
    .select("*")
    .single<StudentAssignmentItemSubmissionRecord>()

  if (error) throw new Error(error.message)
  return data
}

export async function gradeAssignmentSubmission(input: {
  supabase: SupabaseClient
  assignmentId: string
  submissionId: string
  gradedBy: string
  request: GradeAssignmentSubmissionRequest
  now?: Date
}): Promise<{
  submission: StudentAssignmentSubmissionRecord
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
}> {
  const context = await getTeacherSubmissionContext(input)
  const transition = resolveSubmissionStatusTransition({
    currentStatus: context.submission.status,
    action: "grade",
  })
  if ("error" in transition) throw new Error(transition.error)

  const itemsById = new Map(context.items.map((item) => [item.id, item]))
  const itemSubmissionsByItemId = new Map(
    context.itemSubmissions.map((itemSubmission) => [
      itemSubmission.assignment_item_id,
      itemSubmission,
    ])
  )
  const now = (input.now ?? new Date()).toISOString()

  for (const grade of input.request.itemGrades) {
    const item = itemsById.get(grade.assignmentItemId)
    if (!item) throw new Error("Assignment item not found.")
    if (!itemSubmissionsByItemId.has(grade.assignmentItemId)) {
      throw new Error("Assignment item submission not found.")
    }
    if (Number(grade.score) > Number(item.points)) {
      throw new Error("Item score cannot exceed item points.")
    }

    const { error } = await input.supabase
      .from("student_assignment_item_submissions")
      .update({
        status: "graded",
        score: grade.score,
        max_score: Number(item.points),
        feedback_en: grade.feedback?.en ?? null,
        feedback_th: grade.feedback?.th ?? null,
      })
      .eq("submission_id", input.submissionId)
      .eq("assignment_item_id", grade.assignmentItemId)

    if (error) throw new Error(error.message)
  }

  const itemSubmissions = await listAssignmentItemSubmissions({
    supabase: input.supabase,
    submissionIds: [input.submissionId],
  })
  const score = itemSubmissions.reduce(
    (total, item) => total + Number(item.score ?? 0),
    0
  )
  const maxScore = context.items.reduce(
    (total, item) => total + Number(item.points),
    0
  )

  const { data: submission, error } = await input.supabase
    .from("student_assignment_submissions")
    .update({
      status: transition.nextStatus,
      score,
      max_score: maxScore,
      graded_at: now,
      graded_by: input.gradedBy,
      feedback_en: input.request.feedback?.en ?? null,
      feedback_th: input.request.feedback?.th ?? null,
    })
    .eq("id", input.submissionId)
    .select("*")
    .single<StudentAssignmentSubmissionRecord>()

  if (error) throw new Error(error.message)

  await updateAssignmentRecipientAfterTeacherReview({
    supabase: input.supabase,
    recipientId: context.recipient.id,
    status: "graded",
    atColumn: "graded_at",
    at: now,
  })

  return { submission, itemSubmissions }
}

export async function returnAssignmentSubmission(input: {
  supabase: SupabaseClient
  assignmentId: string
  submissionId: string
  returnedBy: string
  request: ReturnAssignmentSubmissionRequest
  now?: Date
}): Promise<{ submission: StudentAssignmentSubmissionRecord }> {
  void input.returnedBy
  const context = await getTeacherSubmissionContext(input)
  const transition = resolveSubmissionStatusTransition({
    currentStatus: context.submission.status,
    action: "return",
  })
  if ("error" in transition) throw new Error(transition.error)

  const now = (input.now ?? new Date()).toISOString()
  const { data: submission, error } = await input.supabase
    .from("student_assignment_submissions")
    .update({
      status: transition.nextStatus,
      returned_at: now,
      feedback_en: input.request.feedback.en ?? null,
      feedback_th: input.request.feedback.th ?? null,
    })
    .eq("id", input.submissionId)
    .select("*")
    .single<StudentAssignmentSubmissionRecord>()

  if (error) throw new Error(error.message)

  await updateAssignmentRecipientAfterTeacherReview({
    supabase: input.supabase,
    recipientId: context.recipient.id,
    status: "returned",
    atColumn: "returned_at",
    at: now,
  })

  return { submission }
}

async function getTeacherSubmissionContext(input: {
  supabase: SupabaseClient
  assignmentId: string
  submissionId: string
}) {
  const detail = await getTeacherAssignmentDetail({
    supabase: input.supabase,
    assignmentId: input.assignmentId,
  })
  if (!detail) throw new Error("Assignment not found.")

  const submission = detail.submissions.find(
    (candidate) => candidate.id === input.submissionId
  )
  if (!submission) throw new Error("Assignment submission not found.")

  const recipient = detail.recipients.find(
    (candidate) => candidate.id === submission.recipient_id
  )
  if (!recipient) throw new Error("Assignment recipient not found.")

  return {
    assignment: detail.assignment,
    items: detail.items,
    itemSubmissions: detail.itemSubmissions.filter(
      (itemSubmission) => itemSubmission.submission_id === submission.id
    ),
    recipient,
    submission,
  }
}

async function getAssignmentById(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<ClassroomAssignmentRecord | null> {
  const { data, error } = await input.supabase
    .from("classroom_assignments")
    .select("*")
    .eq("id", input.assignmentId)
    .maybeSingle<ClassroomAssignmentRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function listAssignmentItems(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<AssignmentItemRecord[]> {
  const { data, error } = await input.supabase
    .from("assignment_items")
    .select("*")
    .eq("assignment_id", input.assignmentId)
    .order("order_index", { ascending: true })
    .returns<AssignmentItemRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function insertAssignmentItems(input: {
  supabase: SupabaseClient
  assignmentId: string
  items: CreateAssignmentDraftRequest["items"]
}): Promise<AssignmentItemRecord[]> {
  if (input.items.length === 0) return []

  const rows = input.items.map((item) => ({
    assignment_id: input.assignmentId,
    item_type: item.itemType,
    order_index: item.orderIndex,
    title_en: item.title.en,
    title_th: item.title.th ?? null,
    instructions_en: item.instructions?.en ?? null,
    instructions_th: item.instructions?.th ?? null,
    lesson_id: item.lessonId ?? null,
    points: item.points,
    required: item.required,
    settings: item.settings,
  }))

  const { data, error } = await input.supabase
    .from("assignment_items")
    .insert(rows)
    .select("*")
    .returns<AssignmentItemRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function insertAssignmentQuizQuestions(input: {
  supabase: SupabaseClient
  items: AssignmentItemRecord[]
  quizQuestions: CreateAssignmentDraftRequest["quizQuestions"]
}): Promise<AssignmentQuizQuestionRecord[]> {
  if (input.quizQuestions.length === 0) return []

  const itemByOrderIndex = new Map(input.items.map((item) => [item.order_index, item]))
  const rows = input.quizQuestions.map((question) => {
    const item =
      question.assignmentItemId != null
        ? input.items.find((candidate) => candidate.id === question.assignmentItemId)
        : itemByOrderIndex.get(1) ??
          input.items.find((candidate) => candidate.item_type === "quiz")

    if (!item) throw new Error("Quiz question is missing a quiz item.")

    return {
      assignment_item_id: item.id,
      question_type: question.questionType,
      order_index: question.orderIndex,
      prompt_en: question.prompt.en,
      prompt_th: question.prompt.th ?? null,
      options_json: question.optionsJson ?? null,
      correct_answer: question.correctAnswer ?? null,
      explanation_en: question.explanation?.en ?? null,
      explanation_th: question.explanation?.th ?? null,
      points: question.points,
      max_attempts: question.maxAttempts ?? null,
    }
  })

  const { data, error } = await input.supabase
    .from("assignment_quiz_questions")
    .insert(rows)
    .select("*")
    .returns<AssignmentQuizQuestionRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function listAssignmentQuizQuestions(input: {
  supabase: SupabaseClient
  assignmentItemIds: string[]
}): Promise<AssignmentQuizQuestionRecord[]> {
  if (input.assignmentItemIds.length === 0) return []

  const { data, error } = await input.supabase
    .from("assignment_quiz_questions")
    .select("*")
    .in("assignment_item_id", input.assignmentItemIds)
    .order("order_index", { ascending: true })
    .returns<AssignmentQuizQuestionRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function deleteAssignmentChildren(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<void> {
  const items = await listAssignmentItems(input)
  if (items.length > 0) {
    const { error: questionError } = await input.supabase
      .from("assignment_quiz_questions")
      .delete()
      .in(
        "assignment_item_id",
        items.map((item) => item.id)
      )
    if (questionError) throw new Error(questionError.message)
  }

  const { error: itemError } = await input.supabase
    .from("assignment_items")
    .delete()
    .eq("assignment_id", input.assignmentId)
  if (itemError) throw new Error(itemError.message)
}

async function listAssignmentRecipients(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<AssignmentRecipientRecord[]> {
  const { data, error } = await input.supabase
    .from("assignment_recipients")
    .select("*")
    .eq("assignment_id", input.assignmentId)
    .order("assigned_at", { ascending: true })
    .returns<AssignmentRecipientRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function listAssignmentSubmissions(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<StudentAssignmentSubmissionRecord[]> {
  const { data, error } = await input.supabase
    .from("student_assignment_submissions")
    .select("*")
    .eq("assignment_id", input.assignmentId)
    .order("updated_at", { ascending: false })
    .returns<StudentAssignmentSubmissionRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function listAssignmentItemSubmissions(input: {
  supabase: SupabaseClient
  submissionIds: string[]
}): Promise<StudentAssignmentItemSubmissionRecord[]> {
  if (input.submissionIds.length === 0) return []

  const { data, error } = await input.supabase
    .from("student_assignment_item_submissions")
    .select("*")
    .in("submission_id", input.submissionIds)
    .order("created_at", { ascending: true })
    .returns<StudentAssignmentItemSubmissionRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function listAssignmentAttachments(input: {
  supabase: SupabaseClient
  assignmentId: string
}): Promise<AssignmentAttachmentRecord[]> {
  const { data, error } = await input.supabase
    .from("assignment_attachments")
    .select("*")
    .eq("assignment_id", input.assignmentId)
    .order("created_at", { ascending: true })
    .returns<AssignmentAttachmentRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function listActiveStudentClassroomMemberships(input: {
  supabase: SupabaseClient
  classroomId: string
  studentUserIds?: string[]
}): Promise<Array<{ id: string; student_user_id: string }>> {
  let query = input.supabase
    .from("classroom_memberships")
    .select("id,student_user_id")
    .eq("classroom_id", input.classroomId)
    .eq("status", "active")

  if (input.studentUserIds) {
    query = query.in("student_user_id", input.studentUserIds)
  }

  const { data, error } = await query.returns<
    Array<{ id: string; student_user_id: string }>
  >()
  if (error) throw new Error(error.message)
  return data
}

async function listAssignmentRecipientsForStudent(input: {
  supabase: SupabaseClient
  studentUserId: string
}): Promise<AssignmentRecipientRecord[]> {
  const { data, error } = await input.supabase
    .from("assignment_recipients")
    .select("*")
    .eq("student_user_id", input.studentUserId)
    .order("assigned_at", { ascending: false })
    .returns<AssignmentRecipientRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function getAssignmentRecipientForStudent(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
}): Promise<AssignmentRecipientRecord | null> {
  const { data, error } = await input.supabase
    .from("assignment_recipients")
    .select("*")
    .eq("assignment_id", input.assignmentId)
    .eq("student_user_id", input.studentUserId)
    .maybeSingle<AssignmentRecipientRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function listPublishedAssignmentsByIds(input: {
  supabase: SupabaseClient
  assignmentIds: string[]
}): Promise<ClassroomAssignmentRecord[]> {
  if (input.assignmentIds.length === 0) return []

  const { data, error } = await input.supabase
    .from("classroom_assignments")
    .select("*")
    .in("id", input.assignmentIds)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .returns<ClassroomAssignmentRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function listStudentSubmissionsForAssignments(input: {
  supabase: SupabaseClient
  studentUserId: string
  assignmentIds: string[]
}): Promise<StudentAssignmentSubmissionRecord[]> {
  if (input.assignmentIds.length === 0) return []

  const { data, error } = await input.supabase
    .from("student_assignment_submissions")
    .select("*")
    .eq("student_user_id", input.studentUserId)
    .in("assignment_id", input.assignmentIds)
    .returns<StudentAssignmentSubmissionRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function getStudentAssignmentSubmission(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
}): Promise<StudentAssignmentSubmissionRecord | null> {
  const { data, error } = await input.supabase
    .from("student_assignment_submissions")
    .select("*")
    .eq("assignment_id", input.assignmentId)
    .eq("student_user_id", input.studentUserId)
    .maybeSingle<StudentAssignmentSubmissionRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function getStudentSubmissionContext(input: {
  supabase: SupabaseClient
  assignmentId: string
  studentUserId: string
}) {
  const [assignment, recipient] = await Promise.all([
    getAssignmentById({ supabase: input.supabase, assignmentId: input.assignmentId }),
    getAssignmentRecipientForStudent({
      supabase: input.supabase,
      assignmentId: input.assignmentId,
      studentUserId: input.studentUserId,
    }),
  ])
  if (!assignment || assignment.status !== "published") {
    throw new Error("Published assignment not found.")
  }
  if (!recipient) throw new Error("Assignment recipient not found.")

  const [items, existingSubmission] = await Promise.all([
    listAssignmentItems({ supabase: input.supabase, assignmentId: input.assignmentId }),
    getStudentAssignmentSubmission({
      supabase: input.supabase,
      assignmentId: input.assignmentId,
      studentUserId: input.studentUserId,
    }),
  ])
  const submission =
    existingSubmission ??
    (await createStudentAssignmentSubmission({
      supabase: input.supabase,
      assignment,
      recipient,
      studentUserId: input.studentUserId,
      maxScore: items.reduce((total, item) => total + Number(item.points), 0),
    }))

  return { assignment, recipient, items, submission }
}

async function createStudentAssignmentSubmission(input: {
  supabase: SupabaseClient
  assignment: ClassroomAssignmentRecord
  recipient: AssignmentRecipientRecord
  studentUserId: string
  maxScore: number
}): Promise<StudentAssignmentSubmissionRecord> {
  const { data, error } = await input.supabase
    .from("student_assignment_submissions")
    .insert({
      assignment_id: input.assignment.id,
      recipient_id: input.recipient.id,
      student_user_id: input.studentUserId,
      status: "not_started",
      max_score: input.maxScore,
      late: false,
    })
    .select("*")
    .single<StudentAssignmentSubmissionRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function upsertItemDrafts(input: {
  supabase: SupabaseClient
  submission: StudentAssignmentSubmissionRecord
  itemSubmissions: SaveStudentAssignmentDraftRequest["itemSubmissions"]
  now: string
  finalStatus: "draft" | "submitted"
}): Promise<StudentAssignmentItemSubmissionRecord[]> {
  const rows = input.itemSubmissions.map((item) => ({
    submission_id: input.submission.id,
    assignment_item_id: item.assignmentItemId,
    status: input.finalStatus,
    answer_json: item.answerJson,
    completed_at: input.finalStatus === "submitted" ? input.now : null,
  }))

  const { data, error } = await input.supabase
    .from("student_assignment_item_submissions")
    .upsert(rows, { onConflict: "submission_id,assignment_item_id" })
    .select("*")
    .returns<StudentAssignmentItemSubmissionRecord[]>()

  if (error) throw new Error(error.message)
  return data
}

async function updateAssignmentRecipientAfterSubmit(input: {
  supabase: SupabaseClient
  recipientId: string
  status: "submitted"
  submittedAt: string
}): Promise<AssignmentRecipientRecord> {
  const { data, error } = await input.supabase
    .from("assignment_recipients")
    .update({
      status: input.status,
      submitted_at: input.submittedAt,
    })
    .eq("id", input.recipientId)
    .select("*")
    .single<AssignmentRecipientRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function updateAssignmentRecipientAfterTeacherReview(input: {
  supabase: SupabaseClient
  recipientId: string
  status: "returned" | "graded"
  atColumn: "returned_at" | "graded_at"
  at: string
}): Promise<AssignmentRecipientRecord> {
  const { data, error } = await input.supabase
    .from("assignment_recipients")
    .update({
      status: input.status,
      [input.atColumn]: input.at,
    })
    .eq("id", input.recipientId)
    .select("*")
    .single<AssignmentRecipientRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function insertSubmissionVersion(input: {
  supabase: SupabaseClient
  submissionId: string
  body: Record<string, unknown>
  now: string
}): Promise<SubmissionVersionRecord> {
  const versionNumber = await getNextSubmissionVersionNumber({
    supabase: input.supabase,
    submissionId: input.submissionId,
  })
  const { data, error } = await input.supabase
    .from("submission_versions")
    .insert({
      submission_id: input.submissionId,
      version_number: versionNumber,
      body_json: input.body,
      submitted_at: input.now,
    })
    .select("*")
    .single<SubmissionVersionRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function getNextSubmissionVersionNumber(input: {
  supabase: SupabaseClient
  submissionId: string
}): Promise<number> {
  const { data, error } = await input.supabase
    .from("submission_versions")
    .select("version_number")
    .eq("submission_id", input.submissionId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle<{ version_number: number }>()

  if (error) throw new Error(error.message)
  return (data?.version_number ?? 0) + 1
}

async function getStudentAssignmentItemSubmission(input: {
  supabase: SupabaseClient
  submissionId: string
  assignmentItemId: string
}): Promise<StudentAssignmentItemSubmissionRecord | null> {
  const { data, error } = await input.supabase
    .from("student_assignment_item_submissions")
    .select("*")
    .eq("submission_id", input.submissionId)
    .eq("assignment_item_id", input.assignmentItemId)
    .maybeSingle<StudentAssignmentItemSubmissionRecord>()

  if (error) throw new Error(error.message)
  return data
}

async function getAssignmentQuizQuestion(input: {
  supabase: SupabaseClient
  questionId: string
  assignmentItemId: string
}): Promise<AssignmentQuizQuestionRecord | null> {
  const { data, error } = await input.supabase
    .from("assignment_quiz_questions")
    .select("*")
    .eq("id", input.questionId)
    .eq("assignment_item_id", input.assignmentItemId)
    .maybeSingle<AssignmentQuizQuestionRecord>()

  if (error) throw new Error(error.message)
  return data
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null
}

function getMaxAttemptsFromSettings(settings: Record<string, unknown>) {
  const value = settings.max_attempts ?? settings.maxAttempts
  return typeof value === "number" && Number.isInteger(value) ? value : null
}

function mergeQuizAnswer(input: {
  currentAnswerJson: Record<string, unknown> | null | undefined
  question: AssignmentQuizQuestionRecord
  selectedAnswer: Record<string, unknown>
  grading: ReturnType<typeof autoGradeAssignmentQuizQuestion>
  attemptedAt: string
}) {
  const current = normalizeObject(input.currentAnswerJson)
  const attempts = Array.isArray(current.attempts) ? current.attempts : []

  return {
    ...current,
    attempts: [
      ...attempts,
      {
        questionId: input.question.id,
        selectedAnswer: input.selectedAnswer,
        grading: input.grading,
        attemptedAt: input.attemptedAt,
      },
    ],
  }
}

function buildSubmissionSnapshot(input: {
  submission: StudentAssignmentSubmissionRecord
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
}) {
  return {
    submission: input.submission,
    itemSubmissions: input.itemSubmissions,
  }
}

function normalizeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}
