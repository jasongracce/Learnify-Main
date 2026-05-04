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
  questions: LearnifyQuestion[]
  locale: Locale
}

export function LessonRenderer({
  blocks,
  questions,
  locale,
}: LessonRendererProps) {
  const questionById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions]
  )

  return (
    <div className="grid gap-4">
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return <TextBlockView key={block.id} block={block} locale={locale} />
          case "visual":
            return <VisualBlockView key={block.id} block={block} locale={locale} />
          case "simulation":
            return <SimulationBlockView key={block.id} block={block} locale={locale} />
          case "multiple_choice": {
            const question = questionById.get(block.question_id)

            return question ? (
              <QuestionBlockView
                key={block.id}
                locale={locale}
                question={question}
              />
            ) : null
          }
          case "lumi_hint":
            return <LumiHintBlockView key={block.id} locale={locale} />
          case "reflection":
            return (
              <TextBlockView
                key={block.id}
                block={{
                  id: block.id,
                  type: "text",
                  content_en: block.prompt_en,
                  content_th: block.prompt_th,
                }}
                locale={locale}
              />
            )
          case "next_lesson":
            return (
              <div
                key={block.id}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <Link
                  className="text-sm font-medium text-[var(--brand-strong)]"
                  href={`/${locale}/app/lessons/${block.lesson_slug}`}
                >
                  {copy[locale].lesson.nextLesson}
                </Link>
              </div>
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
}: {
  block: Extract<LessonBlock, { type: "text" }>
  locale: Locale
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <p className="max-w-3xl leading-7 text-[var(--text)]">
        {selectLocalizedText(
          { en: block.content_en, th: block.content_th },
          locale
        )}
      </p>
    </section>
  )
}

function VisualBlockView({
  block,
  locale,
}: {
  block: Extract<LessonBlock, { type: "visual" }>
  locale: Locale
}) {
  const title = selectLocalizedText(
    { en: block.title_en ?? "", th: block.title_th },
    locale
  )

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      {title ? <p className="mb-4 text-sm text-[var(--muted)]">{title}</p> : null}
      {block.visual_type === "force-diagram" ? <ForceDiagram /> : <FallingObjectDiagram />}
    </section>
  )
}

function FallingObjectDiagram() {
  return (
    <svg className="h-48 w-full" role="img" viewBox="0 0 640 220">
      <line x1="80" x2="560" y1="188" y2="188" stroke="#d8d0bf" strokeWidth="2" />
      <circle cx="320" cy="66" r="20" fill="#BA7517" />
      <path d="M320 96V160" stroke="#2C2B28" strokeWidth="3" />
      <path d="M305 145L320 164L335 145" fill="none" stroke="#2C2B28" strokeWidth="3" />
      <text x="344" y="134" fill="#69645b" fontSize="14">
        gravity
      </text>
    </svg>
  )
}

function ForceDiagram() {
  return (
    <svg className="h-48 w-full" role="img" viewBox="0 0 640 220">
      <rect x="278" y="84" width="84" height="54" rx="8" fill="#F3F0E8" stroke="#BA7517" />
      <path d="M362 111H500" stroke="#2C2B28" strokeWidth="4" />
      <path d="M484 96L504 111L484 126" fill="none" stroke="#2C2B28" strokeWidth="4" />
      <path d="M278 111H198" stroke="#69645b" strokeWidth="3" />
      <path d="M214 98L194 111L214 124" fill="none" stroke="#69645b" strokeWidth="3" />
    </svg>
  )
}

function SimulationBlockView({
  block,
  locale,
}: {
  block: Extract<LessonBlock, { type: "simulation" }>
  locale: Locale
}) {
  const [gravity, setGravity] = useState(9.8)
  const speed = Math.round(gravity * 6)

  if (block.simulation_type !== "gravity-slider") {
    return (
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
        <FallingObjectDiagram />
      </section>
    )
  }

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="grid gap-5 md:grid-cols-[1fr_260px] md:items-center">
        <svg className="h-56 w-full" role="img" viewBox="0 0 560 260">
          <line x1="88" x2="472" y1="220" y2="220" stroke="#d8d0bf" strokeWidth="2" />
          <circle cx="280" cy={Math.max(52, 178 - speed)} r="22" fill="#BA7517" />
          <path d={`M280 ${Math.max(82, 208 - speed)}V198`} stroke="#2C2B28" strokeWidth="3" />
          <path d="M265 180L280 200L295 180" fill="none" stroke="#2C2B28" strokeWidth="3" />
        </svg>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-medium">
            {locale === "th" ? "แรงโน้มถ่วง" : "Gravity"}
            <input
              min="2"
              max="16"
              step="0.2"
              type="range"
              value={gravity}
              onChange={(event) => setGravity(Number(event.target.value))}
            />
          </label>
          <p className="text-sm text-[var(--muted)]">
            {gravity.toFixed(1)} m/s²
          </p>
        </div>
      </div>
    </section>
  )
}

function QuestionBlockView({
  locale,
  question,
}: {
  locale: Locale
  question: LearnifyQuestion
}) {
  const t = copy[locale].lesson
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const isCorrect = selected === question.correct_option_id
  const feedback =
    submitted && selected
      ? generateRuleBasedLumiFeedback({ locale, isCorrect, question })
      : null

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
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
          >
            <span>
              {selectLocalizedText(
                { en: option.label_en, th: option.label_th },
                locale
              )}
            </span>
            {selected === option.id ? <Check aria-hidden="true" size={16} /> : null}
          </button>
        ))}
      </div>
      <button
        className="mt-4 rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        type="button"
        disabled={!selected}
        onClick={() => setSubmitted(true)}
      >
        {submitted && isCorrect ? t.correct : submitted ? t.retry : t.checkAnswer}
      </button>
      {feedback ? (
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6">
          <p className="font-medium">{t.lumi}</p>
          <p className="mt-1 text-[var(--muted)]">{feedback}</p>
        </div>
      ) : null}
    </section>
  )
}

function LumiHintBlockView({ locale }: { locale: Locale }) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-sm font-medium">{copy[locale].lesson.lumi}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {locale === "th"
          ? "ถ้าคำตอบผิด ให้ดูว่าค่าแรงโน้มถ่วงเปลี่ยนความเร่งอย่างไร ไม่ใช่แค่ความเร็ว ณ ตอนใดตอนหนึ่ง"
          : "If an answer feels confusing, focus on how gravity changes acceleration, not just the speed at one moment."}
      </p>
    </section>
  )
}
