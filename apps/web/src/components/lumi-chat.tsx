"use client"

import { useId, useMemo, useState } from "react"
import Link from "next/link"
import { Send } from "lucide-react"
import type { Locale, LumiChatResponse, LumiMessage } from "@learnify/shared"

type LumiChatProps = {
  locale: Locale
  initialConversationId: string | null
  initialMessages: LumiMessage[]
  currentLessonSlug?: string
  variant?: "full" | "compact"
  titleOverride?: string
  bodyOverride?: string
}

type ChatMessage = Pick<LumiMessage, "id" | "role" | "message"> & {
  pending?: boolean
}

const starterPrompts = {
  en: [
    "Why does stronger gravity make things fall faster?",
    "How does net force change motion?",
    "Why does a projectile follow a curved path?",
  ],
  th: [
    "ทำไมแรงโน้มถ่วงที่มากขึ้นทำให้วัตถุตกเร็วขึ้น?",
    "แรงลัพธ์เปลี่ยนการเคลื่อนที่อย่างไร?",
    "ทำไมวัตถุที่ถูกขว้างจึงมีเส้นทางโค้ง?",
  ],
} satisfies Record<Locale, string[]>

const labels = {
  en: {
    title: "Lumi",
    body: "Ask about the Physics module: gravity, projectile motion, or forces.",
    input: "Ask Lumi about Physics",
    send: "Send",
    sending: "Sending...",
    error: "Lumi could not respond. Try again.",
    relatedLesson: "Open related lesson",
  },
  th: {
    title: "Lumi",
    body: "ถามเกี่ยวกับบทเรียนฟิสิกส์: แรงโน้มถ่วง โพรเจกไทล์ หรือแรง",
    input: "ถาม Lumi เกี่ยวกับฟิสิกส์",
    send: "ส่ง",
    sending: "กำลังส่ง...",
    error: "Lumi ยังตอบไม่ได้ ลองอีกครั้ง",
    relatedLesson: "เปิดบทเรียนที่เกี่ยวข้อง",
  },
} satisfies Record<Locale, Record<string, string>>

export function LumiChat({
  locale,
  initialConversationId,
  initialMessages,
  currentLessonSlug,
  variant = "full",
  titleOverride,
  bodyOverride,
}: LumiChatProps) {
  const t = labels[locale]
  const inputId = useId()
  const title = titleOverride ?? t.title
  const body = bodyOverride ?? t.body
  const [conversationId, setConversationId] = useState(initialConversationId)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [suggestedPrompts, setSuggestedPrompts] = useState(
    starterPrompts[locale]
  )
  const [relatedLessonSlug, setRelatedLessonSlug] = useState<string | null>(
    null
  )
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSend = input.trim().length > 0 && !isSending

  const visibleMessages = useMemo(() => messages.slice(-30), [messages])

  async function sendMessage(message: string) {
    const trimmed = message.trim()

    if (!trimmed || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      message: trimmed,
      pending: true,
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch("/api/lumi/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          locale,
          conversationId: conversationId ?? undefined,
          currentLessonSlug: currentLessonSlug ?? undefined,
        }),
      })
      const payload = (await response.json()) as
        | LumiChatResponse
        | { error?: string; redirectTo?: string }

      if (!response.ok) {
        if ("redirectTo" in payload && payload.redirectTo) {
          window.location.href = payload.redirectTo
          return
        }

        throw new Error("error" in payload ? payload.error : t.error)
      }

      if (!("answer" in payload)) {
        throw new Error(t.error)
      }

      setConversationId(payload.conversationId)
      setSuggestedPrompts(payload.suggestedPrompts)
      setRelatedLessonSlug(payload.relatedLessonSlug ?? null)
      setMessages((current) => [
        ...current.filter((item) => item.id !== userMessage.id),
        {
          ...userMessage,
          pending: false,
        },
        {
          id: `local-assistant-${Date.now()}`,
          role: "assistant",
          message: payload.answer,
        },
      ])
    } catch {
      setError(t.error)
      setMessages((current) =>
        current.filter((item) => item.id !== userMessage.id)
      )
    } finally {
      setIsSending(false)
    }
  }

  const isCompact = variant === "compact"

  return (
    <section
      className={
        isCompact ? "grid gap-3" : "grid gap-4 lg:grid-cols-[1fr_280px]"
      }
    >
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)]">
        <div className={isCompact ? "border-b border-[var(--border)] p-4" : "border-b border-[var(--border)] p-5"}>
          {isCompact ? (
            <h2 className="text-base font-semibold">{title}</h2>
          ) : (
            <h1 className="text-2xl font-semibold">{title}</h1>
          )}
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {body}
          </p>
        </div>

        <div
          className={
            isCompact
              ? "grid min-h-[220px] content-end gap-3 p-4"
              : "grid min-h-[420px] content-end gap-3 p-5"
          }
        >
          {visibleMessages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{body}</p>
          ) : (
            visibleMessages.map((message) => (
              <div
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[80%] rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-sm leading-6 text-white"
                    : "mr-auto max-w-[80%] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6"
                }
                key={message.id}
              >
                {message.message}
              </div>
            ))
          )}
        </div>

        <form
          className="border-t border-[var(--border)] p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void sendMessage(input)
          }}
        >
          <label className="sr-only" htmlFor={inputId}>
            {t.input}
          </label>
          <div className="flex gap-2">
            <textarea
              className="min-h-11 flex-1 resize-none rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              id={inputId}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.input}
              rows={2}
              value={input}
            />
            <button
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSend}
              type="submit"
            >
              <Send aria-hidden="true" size={16} />
              {isSending ? t.sending : t.send}
            </button>
          </div>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </form>
      </div>

      <aside
        className={
          isCompact
            ? "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-3"
            : "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4"
        }
      >
        <div
          className={
            isCompact
              ? "grid gap-2 md:grid-cols-3"
              : "grid gap-2"
          }
        >
          {suggestedPrompts.map((prompt) => (
            <button
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-left text-sm leading-5 transition-colors hover:border-[var(--brand)]"
              disabled={isSending}
              key={prompt}
              onClick={() => void sendMessage(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
        {relatedLessonSlug ? (
          <Link
            className="mt-4 inline-flex rounded-[var(--radius)] bg-[var(--surface)] px-3 py-2 text-sm font-medium"
            href={`/${locale}/app/lessons/${relatedLessonSlug}`}
          >
            {t.relatedLesson}
          </Link>
        ) : null}
      </aside>
    </section>
  )
}
