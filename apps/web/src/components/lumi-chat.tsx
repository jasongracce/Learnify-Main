"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUp, Sparkles } from "lucide-react"
import clsx from "clsx"
import type { Locale, LumiChatResponse, LumiMessage } from "@learnify/shared"
import { copy } from "@/lib/copy"
import {
  getLumiSourceDisplay,
  type LumiChatSource,
} from "@/lib/lumi-sources"

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
  sources?: LumiChatSource[]
  suggestedNextAction?: string
}

export function LumiChat({
  locale,
  initialConversationId,
  initialMessages,
  currentLessonSlug,
  variant = "full",
  titleOverride,
  bodyOverride,
}: LumiChatProps) {
  const t = copy[locale].lumi
  const inputId = useId()
  const title = titleOverride ?? t.title
  const body = bodyOverride ?? t.body
  const isCompact = variant === "compact"
  const [conversationId, setConversationId] = useState(initialConversationId)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [suggestedPrompts, setSuggestedPrompts] = useState(t.starterPrompts)
  const [relatedLessonSlug, setRelatedLessonSlug] = useState<string | null>(
    null
  )
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const canSend = input.trim().length > 0 && !isSending
  const visibleMessages = useMemo(() => messages.slice(-30), [messages])
  const hasMessages = visibleMessages.length > 0

  useEffect(() => {
    const list = listRef.current

    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [visibleMessages.length, isSending])

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
          sources: payload.sources,
          suggestedNextAction: payload.suggestedNextAction,
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

  return (
    <section
      className={clsx(
        "flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow-card)]",
        isCompact
          ? "h-[440px]"
          : "h-[calc(100dvh-170px)] min-h-[440px] max-h-[820px]"
      )}
    >
      <div
        className={clsx(
          "flex items-center gap-3 border-b border-[var(--border)]",
          isCompact ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        <span
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-full bg-[var(--text)] text-white",
            isCompact ? "h-8 w-8" : "h-9 w-9"
          )}
        >
          <Sparkles aria-hidden="true" size={isCompact ? 14 : 16} />
        </span>
        <div className="min-w-0">
          <p className={clsx("font-semibold", isCompact ? "text-sm" : "")}>
            {title}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">{t.subtitle}</p>
        </div>
      </div>

      <div
        className={clsx(
          "flex-1 overflow-y-auto",
          isCompact ? "p-4" : "p-5"
        )}
        ref={listRef}
      >
        {hasMessages ? (
          <div className="grid gap-3">
            {visibleMessages.map((message) => (
              <div
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-[18px] rounded-br-[6px] bg-[var(--text)] px-4 py-2.5 text-sm leading-6 text-white"
                    : "mr-auto max-w-[85%] rounded-[18px] rounded-bl-[6px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm leading-6 shadow-[var(--shadow-card)]"
                }
                key={message.id}
              >
                <p>{message.message}</p>
                {message.role === "assistant" &&
                (message.suggestedNextAction ||
                  (message.sources && message.sources.length > 0)) ? (
                  <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--muted)]">
                    {message.suggestedNextAction ? (
                      <p>
                        <span className="font-medium text-[var(--text)]">
                          {t.next}:
                        </span>{" "}
                        {message.suggestedNextAction}
                      </p>
                    ) : null}
                    {message.sources && message.sources.length > 0 ? (
                      <div className="mt-2">
                        <p className="font-medium text-[var(--text)]">
                          {t.sources}
                        </p>
                        <ul className="mt-1 grid gap-1">
                          {message.sources.map((source) => {
                            const sourceDisplay = getLumiSourceDisplay({
                              source,
                              locale,
                            })

                            return (
                              <li key={source.id}>
                                {sourceDisplay.href ? (
                                  <Link
                                    className="underline decoration-[var(--border)] underline-offset-2 transition-colors hover:text-[var(--text)]"
                                    href={sourceDisplay.href}
                                  >
                                    {sourceDisplay.text}
                                  </Link>
                                ) : (
                                  <span>{sourceDisplay.text}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
            {isSending ? <TypingBubble /> : null}
            {relatedLessonSlug ? (
              <Link
                className="mr-auto inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2 text-sm font-medium transition-colors hover:border-[var(--muted-soft)]"
                href={`/${locale}/app/lessons/${relatedLessonSlug}`}
              >
                {t.relatedLesson}
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span
              className={clsx(
                "flex items-center justify-center rounded-full bg-[var(--text)] text-white",
                isCompact ? "h-10 w-10" : "h-12 w-12"
              )}
            >
              <Sparkles aria-hidden="true" size={isCompact ? 16 : 20} />
            </span>
            <p className="font-semibold">{t.emptyTitle}</p>
            <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
              {body}
            </p>
            <div
              className={clsx(
                "mt-2 flex flex-wrap justify-center gap-2",
                isCompact ? "" : "max-w-md"
              )}
            >
              {suggestedPrompts.map((prompt) => (
                <PromptChip
                  disabled={isSending}
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  prompt={prompt}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={clsx(
          "border-t border-[var(--border)]",
          isCompact ? "p-3" : "p-4"
        )}
      >
        {hasMessages && suggestedPrompts.length > 0 && !isCompact ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <PromptChip
                disabled={isSending}
                key={prompt}
                onClick={() => void sendMessage(prompt)}
                prompt={prompt}
              />
            ))}
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void sendMessage(input)
          }}
        >
          <label className="sr-only" htmlFor={inputId}>
            {t.input}
          </label>
          <div className="flex items-end gap-2 rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-[var(--muted-soft)]">
            <textarea
              className="max-h-32 min-h-8 flex-1 resize-none self-center bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-[var(--muted-soft)]"
              id={inputId}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage(input)
                }
              }}
              placeholder={t.input}
              rows={1}
              value={input}
            />
            <button
              aria-label={isSending ? t.sending : t.send}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--text)] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canSend}
              type="submit"
            >
              <ArrowUp aria-hidden="true" size={16} />
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
          ) : null}
        </form>
      </div>
    </section>
  )
}

function PromptChip({
  disabled,
  onClick,
  prompt,
}: {
  disabled: boolean
  onClick: () => void
  prompt: string
}) {
  return (
    <button
      className="rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-strong)] px-3.5 py-1.5 text-left text-sm leading-5 transition-colors hover:border-[var(--muted-soft)] hover:bg-[var(--surface-subtle)] disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {prompt}
    </button>
  )
}

function TypingBubble() {
  return (
    <div className="mr-auto flex items-center gap-1.5 rounded-[18px] rounded-bl-[6px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 shadow-[var(--shadow-card)]">
      <span className="lumi-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
      <span className="lumi-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
      <span className="lumi-typing-dot h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
    </div>
  )
}
