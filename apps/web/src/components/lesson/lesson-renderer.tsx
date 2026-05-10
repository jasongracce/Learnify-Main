"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, HelpCircle } from "lucide-react"
import {
  generateRuleBasedLumiFeedback,
  selectLocalizedText,
} from "@learnify/core"
import type { LearnifyQuestion, LessonBlock, Locale } from "@learnify/shared"
import { copy } from "@/lib/copy"

type LessonRendererProps = {
  blocks: LessonBlock[]
  initialCompletedBlockIds?: string[]
  lessonSlug: string
  questions: LearnifyQuestion[]
  locale: Locale
}

type BlockState = {
  completed?: boolean
  saving?: boolean
  error?: string
}

type QuestionAttemptResponse = {
  isCorrect?: boolean
  error?: string
  redirectTo?: string
}

export function LessonRenderer({
  blocks,
  initialCompletedBlockIds = [],
  lessonSlug,
  questions,
  locale,
}: LessonRendererProps) {
  const [blockState, setBlockState] = useState<Record<string, BlockState>>(() =>
    Object.fromEntries(
      initialCompletedBlockIds.map((blockId) => [
        blockId,
        { completed: true } satisfies BlockState,
      ])
    )
  )
  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions]
  )

  async function completeBlock(blockId: string) {
    setBlockState((current) => ({
      ...current,
      [blockId]: { ...current[blockId], saving: true, error: undefined },
    }))

    const response = await fetch(
      `/api/lessons/${lessonSlug}/blocks/${blockId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale }),
      }
    )
    const result = (await response.json().catch(() => null)) as {
      error?: string
      redirectTo?: string
    } | null

    if (result?.redirectTo) {
      window.location.assign(result.redirectTo)
      return
    }

    setBlockState((current) => ({
      ...current,
      [blockId]: response.ok
        ? { completed: true, saving: false }
        : {
            ...current[blockId],
            saving: false,
            error: result?.error ?? "Could not save progress.",
          },
    }))
  }

  function markBlockCompleted(blockId: string) {
    setBlockState((current) => ({
      ...current,
      [blockId]: { ...current[blockId], completed: true },
    }))
  }

  return (
    <div className="grid max-w-3xl gap-4">
      {blocks.map((block) => {
        const state = blockState[block.id] ?? {}

        switch (block.type) {
          case "text":
            return (
              <TextBlockView
                block={block}
                key={block.id}
                locale={locale}
                onComplete={() => completeBlock(block.id)}
                state={state}
              />
            )
          case "visual":
            return (
              <VisualBlockView
                block={block}
                key={block.id}
                locale={locale}
                onComplete={() => completeBlock(block.id)}
                state={state}
              />
            )
          case "simulation":
            return (
              <SimulationBlockView
                block={block}
                key={block.id}
                locale={locale}
                onComplete={() => completeBlock(block.id)}
                state={state}
              />
            )
          case "multiple_choice": {
            const question = questionById.get(block.question_id)

            return question ? (
              <QuestionBlockView
                blockId={block.id}
                key={block.id}
                lessonSlug={lessonSlug}
                locale={locale}
                onCorrect={() => markBlockCompleted(block.id)}
                question={question}
                state={state}
              />
            ) : null
          }
          case "lumi_hint":
            return (
              <LumiHintBlockView
                key={block.id}
                locale={locale}
                onComplete={() => completeBlock(block.id)}
                state={state}
              />
            )
          case "reflection":
            return (
              <TextBlockView
                block={{
                  id: block.id,
                  type: "text",
                  content_en: block.prompt_en,
                  content_th: block.prompt_th,
                }}
                key={block.id}
                locale={locale}
                onComplete={() => completeBlock(block.id)}
                state={state}
              />
            )
          case "next_lesson":
            return (
              <section
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4"
                key={block.id}
              >
                <Link
                  className="text-sm font-medium text-[var(--brand-strong)]"
                  href={`/${locale}/app/lessons/${block.lesson_slug}`}
                >
                  {copy[locale].lesson.nextLesson}
                </Link>
                <BlockCompletionControl
                  locale={locale}
                  onComplete={() => completeBlock(block.id)}
                  state={state}
                />
              </section>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

function TextBlockView({
  block,
  locale,
  onComplete,
  state,
}: {
  block: Extract<LessonBlock, { type: "text" }>
  locale: Locale
  onComplete: () => void
  state: BlockState
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <p className="leading-7 text-[var(--text)]">
        {selectLocalizedText(
          { en: block.content_en, th: block.content_th },
          locale
        )}
      </p>
      <BlockCompletionControl
        locale={locale}
        onComplete={onComplete}
        state={state}
      />
    </section>
  )
}

function VisualBlockView({
  block,
  locale,
  onComplete,
  state,
}: {
  block: Extract<LessonBlock, { type: "visual" }>
  locale: Locale
  onComplete: () => void
  state: BlockState
}) {
  const title = selectLocalizedText(
    { en: block.title_en ?? "", th: block.title_th },
    locale
  )

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      {title ? <p className="mb-3 text-sm text-[var(--muted)]">{title}</p> : null}
      {block.visual_type === "force-diagram" ? (
        <ForceDiagram />
      ) : (
        <FallingObjectDiagram />
      )}
      <BlockCompletionControl
        locale={locale}
        onComplete={onComplete}
        state={state}
      />
    </section>
  )
}

function FallingObjectDiagram() {
  return (
    <svg className="h-48 w-full" role="img" viewBox="0 0 640 220">
      <line
        stroke="#d8d0bf"
        strokeWidth="2"
        x1="80"
        x2="560"
        y1="188"
        y2="188"
      />
      <circle cx="320" cy="66" fill="#BA7517" r="20" />
      <path d="M320 96V160" stroke="#2C2B28" strokeWidth="3" />
      <path
        d="M305 145L320 164L335 145"
        fill="none"
        stroke="#2C2B28"
        strokeWidth="3"
      />
      <text fill="#69645b" fontSize="14" x="344" y="134">
        gravity
      </text>
    </svg>
  )
}

function ForceDiagram() {
  return (
    <svg className="h-48 w-full" role="img" viewBox="0 0 640 220">
      <rect
        fill="#F3F0E8"
        height="54"
        rx="8"
        stroke="#BA7517"
        width="84"
        x="278"
        y="84"
      />
      <path d="M362 111H500" stroke="#2C2B28" strokeWidth="4" />
      <path
        d="M484 96L504 111L484 126"
        fill="none"
        stroke="#2C2B28"
        strokeWidth="4"
      />
      <path d="M278 111H198" stroke="#69645b" strokeWidth="3" />
      <path
        d="M214 98L194 111L214 124"
        fill="none"
        stroke="#69645b"
        strokeWidth="3"
      />
    </svg>
  )
}

function SimulationBlockView({
  block,
  locale,
  onComplete,
  state,
}: {
  block: Extract<LessonBlock, { type: "simulation" }>
  locale: Locale
  onComplete: () => void
  state: BlockState
}) {
  const [gravity, setGravity] = useState(9.8)
  const [interacted, setInteracted] = useState(false)
  const speed = Math.round(gravity * 6)

  if (block.simulation_type !== "gravity-slider") {
    return (
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
        <button
          className="w-full text-left"
          onClick={() => setInteracted(true)}
          type="button"
        >
          <FallingObjectDiagram />
        </button>
        <BlockCompletionControl
          disabled={!interacted}
          locale={locale}
          onComplete={onComplete}
          state={state}
        />
        {!interacted ? <SimulationHint locale={locale} /> : null}
      </section>
    )
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
        <svg className="h-56 w-full" role="img" viewBox="0 0 560 260">
          <line
            stroke="#d8d0bf"
            strokeWidth="2"
            x1="88"
            x2="472"
            y1="220"
            y2="220"
          />
          <circle
            cx="280"
            cy={Math.max(52, 178 - speed)}
            fill="#BA7517"
            r="22"
          />
          <path
            d={`M280 ${Math.max(82, 208 - speed)}V198`}
            stroke="#2C2B28"
            strokeWidth="3"
          />
          <path
            d="M265 180L280 200L295 180"
            fill="none"
            stroke="#2C2B28"
            strokeWidth="3"
          />
        </svg>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-medium">
            {copy[locale].lesson.gravity}
            <input
              max="16"
              min="2"
              onChange={(event) => {
                setGravity(Number(event.target.value))
                setInteracted(true)
              }}
              step="0.2"
              type="range"
              value={gravity}
            />
          </label>
          <p className="text-sm text-[var(--muted)]">
            {gravity.toFixed(1)} m/s^2
          </p>
        </div>
      </div>
      <BlockCompletionControl
        disabled={!interacted}
        locale={locale}
        onComplete={onComplete}
        state={state}
      />
      {!interacted ? <SimulationHint locale={locale} /> : null}
    </section>
  )
}

function QuestionBlockView({
  blockId,
  lessonSlug,
  locale,
  onCorrect,
  question,
  state,
}: {
  blockId: string
  lessonSlug: string
  locale: Locale
  onCorrect: () => void
  question: LearnifyQuestion
  state: BlockState
}) {
  const t = copy[locale].lesson
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const feedback =
    submitted && selected && isCorrect !== null
      ? generateRuleBasedLumiFeedback({ locale, isCorrect, question })
      : null

  async function submitAttempt() {
    if (!selected) {
      return
    }

    setSaving(true)
    setError(null)

    const response = await fetch("/api/questions/attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lessonSlug,
        blockId,
        questionId: question.id,
        selectedOptionId: selected,
        locale,
      }),
    })
    const result = (await response
      .json()
      .catch(() => null)) as QuestionAttemptResponse | null

    if (result?.redirectTo) {
      window.location.assign(result.redirectTo)
      return
    }

    setSaving(false)

    if (!response.ok) {
      setError(result?.error ?? "Could not save your answer.")
      return
    }

    const correct = Boolean(result?.isCorrect)

    setSubmitted(true)
    setIsCorrect(correct)

    if (correct) {
      onCorrect()
    }
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <HelpCircle aria-hidden="true" size={16} />
        {t.question}
      </div>
      <p className="mt-3 leading-7">
        {selectLocalizedText(
          { en: question.question_en, th: question.question_th },
          locale
        )}
      </p>
      <div className="mt-4 grid gap-2">
        {question.options.map((option) => (
          <button
            className="flex min-h-11 items-center justify-between rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--brand)] disabled:cursor-default"
            disabled={saving}
            key={option.id}
            onClick={() => {
              setSelected(option.id)
              setSubmitted(false)
              setIsCorrect(null)
              setError(null)
            }}
            type="button"
          >
            <span>
              {selectLocalizedText(
                { en: option.label_en, th: option.label_th },
                locale
              )}
            </span>
            {selected === option.id ? (
              <Check aria-hidden="true" size={16} />
            ) : null}
          </button>
        ))}
      </div>
      <button
        className="mt-4 rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={!selected || saving}
        onClick={submitAttempt}
        type="button"
      >
        {saving
          ? t.saving
          : submitted && isCorrect
            ? t.correct
            : submitted
              ? t.retry
              : t.checkAnswer}
      </button>
      {state.completed ? (
        <span className="ml-3 text-sm text-[var(--muted)]">{t.saved}</span>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {feedback ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6">
          <p className="font-medium">{t.lumi}</p>
          <p className="mt-1 text-[var(--muted)]">{feedback}</p>
        </div>
      ) : null}
    </section>
  )
}

function LumiHintBlockView({
  locale,
  onComplete,
  state,
}: {
  locale: Locale
  onComplete: () => void
  state: BlockState
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-sm font-medium">{copy[locale].lesson.lumi}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {copy[locale].lesson.lumiHint}
      </p>
      <BlockCompletionControl
        locale={locale}
        onComplete={onComplete}
        state={state}
      />
    </section>
  )
}

function SimulationHint({ locale }: { locale: Locale }) {
  return (
    <p className="mt-2 text-sm text-[var(--muted)]">
      {copy[locale].lesson.simulationHint}
    </p>
  )
}

function BlockCompletionControl({
  disabled = false,
  locale,
  onComplete,
  state,
}: {
  disabled?: boolean
  locale: Locale
  onComplete: () => void
  state: BlockState
}) {
  const label = state.completed
    ? copy[locale].lesson.saved
    : state.saving
      ? copy[locale].lesson.saving
      : copy[locale].lesson.continue

  return (
    <div className="mt-4">
      <button
        className="rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        disabled={disabled || state.saving || state.completed}
        onClick={onComplete}
        type="button"
      >
        {label}
      </button>
      {state.error ? (
        <p className="mt-3 text-sm text-red-700">{state.error}</p>
      ) : null}
    </div>
  )
}
