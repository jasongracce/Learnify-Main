"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Check, HelpCircle, Sparkles } from "lucide-react"
import clsx from "clsx"
import {
  generateRuleBasedLumiFeedback,
  selectLocalizedText,
} from "@learnify/core"
import type { LearnifyQuestion, LessonBlock, Locale } from "@learnify/shared"
import { ButtonLink } from "@/components/ui/button"
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

const blockCardClass =
  "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow-card)] md:p-6"

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
            error: result?.error ?? copy[locale].lesson.saveError,
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
    <div className="grid gap-4">
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
                className={clsx(blockCardClass, "text-center")}
                key={block.id}
              >
                <p className="text-sm font-medium text-[var(--muted)]">
                  {copy[locale].lesson.nextLesson}
                </p>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <ButtonLink
                    href={`/${locale}/app/lessons/${block.lesson_slug}`}
                  >
                    {copy[locale].lesson.nextLesson}
                    <ArrowRight aria-hidden="true" size={16} />
                  </ButtonLink>
                  <BlockCompletionControl
                    align="center"
                    locale={locale}
                    onComplete={() => completeBlock(block.id)}
                    state={state}
                  />
                </div>
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
    <section className={blockCardClass}>
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
    <section className={blockCardClass}>
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
        className="stroke-[var(--border)]"
        strokeWidth="2"
        x1="80"
        x2="560"
        y1="188"
        y2="188"
      />
      <circle className="fill-[var(--brand)]" cx="320" cy="66" r="20" />
      <path
        className="stroke-[var(--text)]"
        d="M320 96V160"
        fill="none"
        strokeWidth="3"
      />
      <path
        className="stroke-[var(--text)]"
        d="M305 145L320 164L335 145"
        fill="none"
        strokeWidth="3"
      />
      <text className="fill-[var(--muted)]" fontSize="14" x="344" y="134">
        gravity
      </text>
    </svg>
  )
}

function ForceDiagram() {
  return (
    <svg className="h-48 w-full" role="img" viewBox="0 0 640 220">
      <rect
        className="fill-[var(--surface)] stroke-[var(--brand)]"
        height="54"
        rx="8"
        width="84"
        x="278"
        y="84"
      />
      <path
        className="stroke-[var(--text)]"
        d="M362 111H500"
        fill="none"
        strokeWidth="4"
      />
      <path
        className="stroke-[var(--text)]"
        d="M484 96L504 111L484 126"
        fill="none"
        strokeWidth="4"
      />
      <path
        className="stroke-[var(--muted)]"
        d="M278 111H198"
        fill="none"
        strokeWidth="3"
      />
      <path
        className="stroke-[var(--muted)]"
        d="M214 98L194 111L214 124"
        fill="none"
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
      <section className={blockCardClass}>
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
    <section className={blockCardClass}>
      <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
        <svg className="h-56 w-full" role="img" viewBox="0 0 560 260">
          <line
            className="stroke-[var(--border)]"
            strokeWidth="2"
            x1="88"
            x2="472"
            y1="220"
            y2="220"
          />
          <circle
            className="fill-[var(--brand)]"
            cx="280"
            cy={Math.max(52, 178 - speed)}
            r="22"
          />
          <path
            className="stroke-[var(--text)]"
            d={`M280 ${Math.max(82, 208 - speed)}V198`}
            fill="none"
            strokeWidth="3"
          />
          <path
            className="stroke-[var(--text)]"
            d="M265 180L280 200L295 180"
            fill="none"
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
      setError(result?.error ?? t.answerError)
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
    <section className={blockCardClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HelpCircle aria-hidden="true" size={16} />
          {t.question}
        </div>
        {state.completed ? <CompletedPill label={t.saved} /> : null}
      </div>
      <p className="mt-3 leading-7">
        {selectLocalizedText(
          { en: question.question_en, th: question.question_th },
          locale
        )}
      </p>
      <div className="mt-4 grid gap-2">
        {question.options.map((option) => {
          const isSelected = selected === option.id
          const showCorrect =
            submitted && option.id === question.correct_option_id
          const showIncorrect =
            submitted && isSelected && option.id !== question.correct_option_id

          return (
            <button
              className={clsx(
                "flex min-h-11 items-center justify-between rounded-[var(--radius)] border px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-default",
                showCorrect
                  ? "border-[color:rgba(22,163,74,0.4)] bg-[var(--success-soft)] text-[var(--success)]"
                  : showIncorrect
                    ? "border-[color:rgba(220,38,38,0.4)] bg-[var(--danger-soft)] text-[var(--danger)]"
                    : isSelected
                      ? "border-[var(--text)] bg-[var(--surface-subtle)] font-medium"
                      : "border-[var(--border)] hover:border-[var(--muted-soft)]"
              )}
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
              {isSelected || showCorrect ? (
                <Check aria-hidden="true" size={16} />
              ) : null}
            </button>
          )
        })}
      </div>
      <button
        className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--text)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
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
      {error ? (
        <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      {feedback ? <LumiFeedbackBubble label={t.lumi} text={feedback} /> : null}
    </section>
  )
}

function LumiFeedbackBubble({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-4 max-w-[90%] rounded-[18px] rounded-bl-[6px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm leading-6 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-1.5 font-medium">
        <Sparkles aria-hidden="true" size={14} />
        {label}
      </p>
      <p className="mt-1 text-[var(--muted)]">{text}</p>
    </div>
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
    <section className={blockCardClass}>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Sparkles aria-hidden="true" size={14} />
        {copy[locale].lesson.lumi}
      </p>
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

function CompletedPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[color:rgba(22,163,74,0.2)] bg-[var(--success-soft)] px-2.5 py-1 text-xs font-medium text-[var(--success)]">
      <Check aria-hidden="true" size={13} />
      {label}
    </span>
  )
}

function BlockCompletionControl({
  align = "end",
  disabled = false,
  locale,
  onComplete,
  state,
}: {
  align?: "end" | "center"
  disabled?: boolean
  locale: Locale
  onComplete: () => void
  state: BlockState
}) {
  const t = copy[locale].lesson

  return (
    <div
      className={clsx(
        "mt-4 flex flex-col gap-2",
        align === "end" ? "items-end" : "items-center"
      )}
    >
      {state.completed ? (
        <CompletedPill label={t.markedRead} />
      ) : (
        <button
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || state.saving}
          onClick={onComplete}
          type="button"
        >
          <Check aria-hidden="true" size={15} />
          {state.saving ? t.saving : t.markRead}
        </button>
      )}
      {state.error ? (
        <p className="text-sm text-[var(--danger)]">{state.error}</p>
      ) : null}
    </div>
  )
}
