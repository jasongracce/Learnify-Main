"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import type {
  AssignmentItemRecord,
  AssignmentQuizQuestionRecord,
  StudentAssignmentItemSubmissionRecord,
  StudentAssignmentSubmissionRecord,
} from "@learnify/shared"
import type { Locale } from "@learnify/shared"
import {
  buttonClass,
  fieldClass,
  InlineError,
  secondaryButtonClass,
  StatusBadge,
} from "@/components/classroom/classroom-ui"

type Props = {
  assignmentId: string
  items: AssignmentItemRecord[]
  itemSubmissions: StudentAssignmentItemSubmissionRecord[]
  locale: Locale
  quizQuestions: AssignmentQuizQuestionRecord[]
  schoolId: string
  submission: StudentAssignmentSubmissionRecord
}

type ActionState = {
  error?: string
  message?: string
  pending?: boolean
}

export function TeacherAssignmentReview({
  assignmentId,
  items,
  itemSubmissions,
  locale,
  quizQuestions,
  schoolId,
  submission,
}: Props) {
  const router = useRouter()
  const [state, setState] = useState<ActionState>({})
  const itemById = new Map(items.map((item) => [item.id, item]))
  const questionsByItemId = groupByItemId(quizQuestions)

  async function mutate(url: string, body: unknown, successMessage: string) {
    setState({ pending: true })
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      setState({ error: payload.error ?? "Request failed." })
      return
    }

    setState({ message: successMessage })
    router.refresh()
  }

  async function onGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const itemGrades = itemSubmissions
      .map((itemSubmission) => {
        const scoreValue = form.get(`score:${itemSubmission.assignment_item_id}`)
        if (scoreValue === null || scoreValue === "") return null
        const feedbackEn = getOptionalFormString(
          form,
          `feedbackEn:${itemSubmission.assignment_item_id}`
        )
        const feedbackTh = getOptionalFormString(
          form,
          `feedbackTh:${itemSubmission.assignment_item_id}`
        )

        return {
          assignmentItemId: itemSubmission.assignment_item_id,
          score: Number(scoreValue),
          ...(feedbackEn || feedbackTh
            ? { feedback: { en: feedbackEn, th: feedbackTh } }
            : {}),
        }
      })
      .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade))

    const finalFeedback = getFeedback(form)
    await mutate(
      `/api/assignments/${assignmentId}/submissions/${submission.id}/grade`,
      {
        schoolId,
        locale,
        itemGrades,
        ...(finalFeedback ? { feedback: finalFeedback } : {}),
      },
      "Submission graded."
    )
  }

  async function onReturn() {
    const form = document.getElementById(
      `review-form-${submission.id}`
    ) as HTMLFormElement | null
    if (!form) return
    const feedback = getFeedback(new FormData(form))

    if (!feedback) {
      setState({ error: "Add final feedback before returning work." })
      return
    }

    await mutate(
      `/api/assignments/${assignmentId}/submissions/${submission.id}/return`,
      { schoolId, locale, feedback },
      "Submission returned."
    )
  }

  return (
    <form
      className="mt-3 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-white p-3"
      id={`review-form-${submission.id}`}
      onSubmit={onGrade}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge>{submission.status}</StatusBadge>
        <span className="text-[var(--muted)]">
          Score: {submission.score ?? "-"} / {submission.max_score}
        </span>
      </div>

      <div className="grid gap-3">
        {itemSubmissions.map((itemSubmission) => {
          const item = itemById.get(itemSubmission.assignment_item_id)
          const questions = questionsByItemId.get(itemSubmission.assignment_item_id) ?? []

          return (
            <section
              className="rounded-[var(--radius)] border border-[var(--border)] p-3"
              key={itemSubmission.id}
            >
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px]">
                <div>
                  <p className="font-medium">
                    {item?.title_en ?? itemSubmission.assignment_item_id}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item?.item_type ?? "item"} / {itemSubmission.status}
                  </p>
                </div>
                <label className="text-sm">
                  Score
                  <input
                    className={`${fieldClass} mt-1`}
                    defaultValue={itemSubmission.score ?? ""}
                    max={item?.points ?? itemSubmission.max_score}
                    min={0}
                    name={`score:${itemSubmission.assignment_item_id}`}
                    step="0.01"
                    type="number"
                  />
                </label>
              </div>
              {questions.length > 0 ? (
                <div className="mt-3 grid gap-2 text-sm">
                  {questions.map((question) => (
                    <div
                      className="rounded-[var(--radius)] bg-[var(--surface)] p-2"
                      key={question.id}
                    >
                      <p className="font-medium">{question.prompt_en}</p>
                      {question.explanation_en ? (
                        <p className="mt-1 text-[var(--muted)]">
                          {question.explanation_en}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <pre className="mt-3 max-h-64 overflow-auto rounded-[var(--radius)] bg-[var(--surface)] p-3 text-xs">
                {JSON.stringify(itemSubmission.answer_json ?? {}, null, 2)}
              </pre>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <textarea
                  className={fieldClass}
                  defaultValue={itemSubmission.feedback_en ?? ""}
                  name={`feedbackEn:${itemSubmission.assignment_item_id}`}
                  placeholder="Item feedback in English"
                  rows={2}
                />
                <textarea
                  className={fieldClass}
                  defaultValue={itemSubmission.feedback_th ?? ""}
                  name={`feedbackTh:${itemSubmission.assignment_item_id}`}
                  placeholder="Item feedback in Thai"
                  rows={2}
                />
              </div>
            </section>
          )
        })}
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <textarea
          className={fieldClass}
          defaultValue={submission.feedback_en ?? ""}
          name="feedbackEn"
          placeholder="Final feedback in English"
          rows={3}
        />
        <textarea
          className={fieldClass}
          defaultValue={submission.feedback_th ?? ""}
          name="feedbackTh"
          placeholder="Final feedback in Thai"
          rows={3}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={buttonClass} disabled={state.pending} type="submit">
          Mark graded
        </button>
        <button
          className={secondaryButtonClass}
          disabled={state.pending}
          onClick={onReturn}
          type="button"
        >
          Return
        </button>
      </div>
      {state.message ? (
        <p className="rounded-[var(--radius)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      <InlineError>{state.error}</InlineError>
    </form>
  )
}

function getOptionalFormString(form: FormData, key: string) {
  const value = form.get(key)
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function getFeedback(form: FormData) {
  const en = getOptionalFormString(form, "feedbackEn")
  const th = getOptionalFormString(form, "feedbackTh")

  return en || th ? { en, th } : null
}

function groupByItemId(questions: AssignmentQuizQuestionRecord[]) {
  const groups = new Map<string, AssignmentQuizQuestionRecord[]>()

  for (const question of questions) {
    const current = groups.get(question.assignment_item_id) ?? []
    current.push(question)
    groups.set(question.assignment_item_id, current)
  }

  return groups
}
