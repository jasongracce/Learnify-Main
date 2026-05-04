"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import type { Locale } from "@learnify/shared"
import { copy } from "@/lib/copy"

type WaitlistFormProps = {
  locale: Locale
}

type SubmitState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; access: "approved" | "pending" }
  | { status: "error"; message: string }

export function WaitlistForm({ locale }: WaitlistFormProps) {
  const t = copy[locale].waitlist
  const [state, setState] = useState<SubmitState>({ status: "idle" })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "saving" })

    const form = new FormData(event.currentTarget)
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.get("email"),
        name: form.get("name") || undefined,
        role: form.get("role") || undefined,
        grade_level: form.get("grade_level") || undefined,
        preferred_language: locale,
        interest_reason: form.get("interest_reason") || undefined,
      }),
    })

    const result: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      setState({
        status: "error",
        message:
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : t.error,
      })
      return
    }

    const access =
      result &&
      typeof result === "object" &&
      "status" in result &&
      result.status === "approved"
        ? "approved"
        : "pending"

    setState({ status: "success", access })
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        {t.email}
        <input
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
          name="email"
          type="email"
          placeholder="student@example.com"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        {t.name}
        <input
          className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
          name="name"
          type="text"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {t.role}
          <input
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
            name="role"
            type="text"
            placeholder="Student"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {t.gradeLevel}
          <input
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
            name="grade_level"
            type="text"
            placeholder="Grade 10"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        {t.interestReason}
        <textarea
          className="min-h-24 rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
          name="interest_reason"
        />
      </label>
      <button
        className="w-fit rounded-[var(--radius)] bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-60"
        disabled={state.status === "saving"}
        type="submit"
      >
        {state.status === "saving" ? t.saving : t.submit}
      </button>
      {state.status === "success" ? (
        <p className="text-sm leading-6 text-[var(--muted)]">
          {state.access === "approved" ? t.successApproved : t.successPending}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="text-sm leading-6 text-red-700">{state.message}</p>
      ) : null}
    </form>
  )
}
