"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import type { StudentAssignmentDetail } from "@learnify/database"
import type {
  AssignmentItemRecord,
  AssignmentQuizQuestionRecord,
  Locale,
  StudentAssignmentItemSubmissionRecord,
} from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import {
  buildInitialAnswerDrafts,
  buildManualSubmissionAnswer,
  buildQuizSelectedAnswer,
  buildSaveDraftBody,
  buildSubmitBody,
  formatReceipt,
  getManualSubmissionText,
  indexItemSubmissions,
  isSubmissionLocked,
  parseQuizOptions,
  type AssignmentAnswerDrafts,
  type AssignmentReceipt,
} from "@/lib/student-assignments"
import {
  buttonClass,
  fieldClass,
  InlineError,
  secondaryButtonClass,
  StatusBadge,
} from "@/components/classroom/classroom-ui"

type ActionState = {
  error?: string
  message?: string
  pending?: boolean
  receipt?: AssignmentReceipt
}

const labels = {
  en: {
    answer: "Your answer",
    correct: "Correct",
    draftSaved: "Draft saved.",
    false: "False",
    lesson: "Open lesson",
    noAnswer: "Add at least one answer before saving.",
    quizSaved: "Quiz attempt recorded.",
    saveDraft: "Save draft",
    selectAnswer: "Select an answer.",
    submit: "Submit assignment",
    submitted: "Assignment submitted.",
    true: "True",
    unavailable: "This item type is not available in this slice.",
  },
  th: {
    answer: "Your answer",
    correct: "Correct",
    draftSaved: "Draft saved.",
    false: "False",
    lesson: "Open lesson",
    noAnswer: "Add at least one answer before saving.",
    quizSaved: "Quiz attempt recorded.",
    saveDraft: "Save draft",
    selectAnswer: "Select an answer.",
    submit: "Submit assignment",
    submitted: "Assignment submitted.",
    true: "True",
    unavailable: "This item type is not available in this slice.",
  },
} satisfies Record<Locale, Record<string, string>>

export function StudentAssignmentWorkspace({
  detail,
  locale,
}: {
  detail: StudentAssignmentDetail
  locale: Locale
}) {
  const router = useRouter()
  const t = labels[locale]
  const locked = isSubmissionLocked(detail.submission)
  const [drafts, setDrafts] = useState<AssignmentAnswerDrafts>(() =>
    buildInitialAnswerDrafts(detail.itemSubmissions)
  )
  const [quizSelections, setQuizSelections] = useState<Record<string, string>>(
    {}
  )
  const [itemSubmissions, setItemSubmissions] = useState(
    detail.itemSubmissions
  )
  const [state, setState] = useState<ActionState>({})
  const itemSubmissionsByItemId = useMemo(
    () => indexItemSubmissions(itemSubmissions),
    [itemSubmissions]
  )
  const questionsByItemId = useMemo(() => {
    const map = new Map<string, AssignmentQuizQuestionRecord[]>()

    for (const question of detail.quizQuestions) {
      const current = map.get(question.assignment_item_id) ?? []
      current.push(question)
      map.set(question.assignment_item_id, current)
    }

    return map
  }, [detail.quizQuestions])

  function updateDraft(itemId: string, answerJson: Record<string, unknown>) {
    setDrafts((current) => ({
      ...current,
      [itemId]: answerJson,
    }))
  }

  async function postJson(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.error ?? "Request failed.")
    }

    return payload
  }

  async function saveDraft() {
    const body = buildSaveDraftBody({
      drafts,
      items: detail.items,
      locale,
    })

    if (body.itemSubmissions.length === 0) {
      setState({ error: t.noAnswer })
      return
    }

    setState({ pending: true })
    try {
      const payload = (await postJson(
        `/api/student/assignments/${detail.assignment.id}/draft`,
        body
      )) as {
        itemSubmissions: StudentAssignmentItemSubmissionRecord[]
        receipt: AssignmentReceipt
      }
      setItemSubmissions((current) =>
        mergeItemSubmissions(current, payload.itemSubmissions)
      )
      setState({
        message: t.draftSaved,
        receipt: payload.receipt,
      })
      router.refresh()
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Request failed.",
      })
    }
  }

  async function submitAssignment() {
    const body = buildSubmitBody({
      drafts,
      items: detail.items,
      locale,
    })

    if (body.itemSubmissions.length === 0) {
      setState({ error: t.noAnswer })
      return
    }

    setState({ pending: true })
    try {
      const payload = (await postJson(
        `/api/student/assignments/${detail.assignment.id}/submit`,
        body
      )) as {
        itemSubmissions: StudentAssignmentItemSubmissionRecord[]
        receipt: AssignmentReceipt
      }
      setItemSubmissions(payload.itemSubmissions)
      setState({
        message: t.submitted,
        receipt: payload.receipt,
      })
      router.refresh()
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Request failed.",
      })
    }
  }

  async function recordQuizAttempt(question: AssignmentQuizQuestionRecord) {
    const value = quizSelections[question.id]
    if (!value) {
      setState({ error: t.selectAnswer })
      return
    }

    setState({ pending: true })
    try {
      const payload = (await postJson(
        `/api/student/assignments/${detail.assignment.id}/quiz-attempt`,
        {
          assignmentItemId: question.assignment_item_id,
          questionId: question.id,
          selectedAnswer: buildQuizSelectedAnswer({ question, value }),
          attemptNumber: 1,
          locale,
        }
      )) as { itemSubmission: StudentAssignmentItemSubmissionRecord }

      setItemSubmissions((current) => [
        ...current.filter(
          (item) => item.assignment_item_id !== question.assignment_item_id
        ),
        payload.itemSubmission,
      ])
      updateDraft(
        question.assignment_item_id,
        payload.itemSubmission.answer_json ?? {}
      )
      setState({ message: t.quizSaved })
      router.refresh()
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Request failed.",
      })
    }
  }

  return (
    <section className="grid gap-4">
      {detail.items.map((item) => (
        <AssignmentItemPanel
          draft={drafts[item.id]}
          item={item}
          itemSubmission={itemSubmissionsByItemId.get(item.id)}
          key={item.id}
          locale={locale}
          locked={locked}
          onQuizAttempt={recordQuizAttempt}
          onSelectQuizAnswer={(questionId, value) =>
            setQuizSelections((current) => ({ ...current, [questionId]: value }))
          }
          onUpdateDraft={updateDraft}
          questions={questionsByItemId.get(item.id) ?? []}
          quizSelections={quizSelections}
        />
      ))}

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {detail.submission ? (
              <StatusBadge>{detail.submission.status}</StatusBadge>
            ) : (
              <StatusBadge>{detail.recipient.status}</StatusBadge>
            )}
            {state.receipt ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {formatReceipt(state.receipt)}
              </p>
            ) : null}
            {state.message ? (
              <p className="mt-2 text-sm text-emerald-700">{state.message}</p>
            ) : null}
          </div>

          {!locked ? (
            <div className="flex flex-wrap gap-2">
              <button
                className={secondaryButtonClass}
                disabled={state.pending}
                onClick={saveDraft}
                type="button"
              >
                {t.saveDraft}
              </button>
              <button
                className={buttonClass}
                disabled={state.pending}
                onClick={submitAssignment}
                type="button"
              >
                {t.submit}
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-3">
          <InlineError>{state.error}</InlineError>
        </div>
      </div>
    </section>
  )
}

function mergeItemSubmissions(
  current: StudentAssignmentItemSubmissionRecord[],
  next: StudentAssignmentItemSubmissionRecord[]
) {
  const byItemId = new Map(
    current.map((submission) => [submission.assignment_item_id, submission])
  )

  for (const submission of next) {
    byItemId.set(submission.assignment_item_id, submission)
  }

  return [...byItemId.values()]
}

function AssignmentItemPanel({
  draft,
  item,
  itemSubmission,
  locale,
  locked,
  onQuizAttempt,
  onSelectQuizAnswer,
  onUpdateDraft,
  questions,
  quizSelections,
}: {
  draft: Record<string, unknown> | undefined
  item: AssignmentItemRecord
  itemSubmission?: StudentAssignmentItemSubmissionRecord
  locale: Locale
  locked: boolean
  onQuizAttempt: (question: AssignmentQuizQuestionRecord) => void
  onSelectQuizAnswer: (questionId: string, value: string) => void
  onUpdateDraft: (itemId: string, answerJson: Record<string, unknown>) => void
  questions: AssignmentQuizQuestionRecord[]
  quizSelections: Record<string, string>
}) {
  const t = labels[locale]
  const title = selectLocalizedText(
    { en: item.title_en, th: item.title_th },
    locale
  )
  const instructions = selectLocalizedText(
    { en: item.instructions_en ?? "", th: item.instructions_th ?? undefined },
    locale
  )

  return (
    <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {instructions ? (
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {instructions}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge>{item.item_type}</StatusBadge>
          {itemSubmission ? <StatusBadge>{itemSubmission.status}</StatusBadge> : null}
        </div>
      </div>

      <div className="mt-4">
        {item.item_type === "learnify_lesson" ? (
          <LessonAssignmentItem item={item} locale={locale} />
        ) : null}
        {item.item_type === "manual_submission" ? (
          <ManualAssignmentItem
            draft={draft}
            itemId={item.id}
            label={t.answer}
            locked={locked}
            onUpdateDraft={onUpdateDraft}
          />
        ) : null}
        {item.item_type === "quiz" ? (
          <QuizAssignmentItem
            locked={locked}
            onQuizAttempt={onQuizAttempt}
            onSelectQuizAnswer={onSelectQuizAnswer}
            questions={questions}
            quizSelections={quizSelections}
            locale={locale}
          />
        ) : null}
        {item.item_type === "attachment" ? (
          <p className="text-sm text-[var(--muted)]">{t.unavailable}</p>
        ) : null}
      </div>
    </article>
  )
}

function LessonAssignmentItem({
  item,
  locale,
}: {
  item: AssignmentItemRecord
  locale: Locale
}) {
  const lessonSlug = getLessonSlug(item)

  if (!lessonSlug) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {labels[locale].unavailable}
      </p>
    )
  }

  return (
    <Link
      className={secondaryButtonClass}
      href={`/${locale}/app/lessons/${lessonSlug}`}
    >
      {labels[locale].lesson}
    </Link>
  )
}

function ManualAssignmentItem({
  draft,
  itemId,
  label,
  locked,
  onUpdateDraft,
}: {
  draft: Record<string, unknown> | undefined
  itemId: string
  label: string
  locked: boolean
  onUpdateDraft: (itemId: string, answerJson: Record<string, unknown>) => void
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        className={fieldClass}
        disabled={locked}
        onChange={(event) =>
          onUpdateDraft(itemId, buildManualSubmissionAnswer(event.target.value))
        }
        rows={5}
        value={getManualSubmissionText(draft)}
      />
    </label>
  )
}

function QuizAssignmentItem({
  locale,
  locked,
  onQuizAttempt,
  onSelectQuizAnswer,
  questions,
  quizSelections,
}: {
  locale: Locale
  locked: boolean
  onQuizAttempt: (question: AssignmentQuizQuestionRecord) => void
  onSelectQuizAnswer: (questionId: string, value: string) => void
  questions: AssignmentQuizQuestionRecord[]
  quizSelections: Record<string, string>
}) {
  return (
    <div className="grid gap-4">
      {questions.map((question) => (
        <div
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-3"
          key={question.id}
        >
          <p className="font-medium">
            {selectLocalizedText(
              { en: question.prompt_en, th: question.prompt_th },
              locale
            )}
          </p>
          <QuizAnswerControls
            locale={locale}
            locked={locked}
            onChange={(value) => onSelectQuizAnswer(question.id, value)}
            question={question}
            value={quizSelections[question.id] ?? ""}
          />
          {!locked ? (
            <button
              className={`${secondaryButtonClass} mt-3`}
              onClick={() => onQuizAttempt(question)}
              type="button"
            >
              {labels[locale].correct}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function QuizAnswerControls({
  locale,
  locked,
  onChange,
  question,
  value,
}: {
  locale: Locale
  locked: boolean
  onChange: (value: string) => void
  question: AssignmentQuizQuestionRecord
  value: string
}) {
  if (question.question_type === "true_false") {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {["true", "false"].map((option) => (
          <label
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            key={option}
          >
            <input
              checked={value === option}
              disabled={locked}
              name={question.id}
              onChange={() => onChange(option)}
              type="radio"
            />
            {option === "true" ? labels[locale].true : labels[locale].false}
          </label>
        ))}
      </div>
    )
  }

  if (question.question_type === "multiple_choice") {
    const options = parseQuizOptions(question)

    return (
      <div className="mt-3 grid gap-2">
        {options.map((option) => (
          <label
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            key={option.id}
          >
            <input
              checked={value === option.id}
              disabled={locked}
              name={question.id}
              onChange={() => onChange(option.id)}
              type="radio"
            />
            {selectLocalizedText(
              { en: option.label_en, th: option.label_th },
              locale
            )}
          </label>
        ))}
      </div>
    )
  }

  return (
    <p className="mt-3 text-sm text-[var(--muted)]">
      {labels[locale].unavailable}
    </p>
  )
}

function getLessonSlug(item: AssignmentItemRecord) {
  const value = item.settings.lesson_slug ?? item.settings.lessonSlug

  return typeof value === "string" ? value : null
}
