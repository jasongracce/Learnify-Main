"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { Mail } from "lucide-react"
import type { Locale } from "@learnify/shared"
import { copy } from "@/lib/copy"

type AuthFormProps = {
  locale: Locale
  mode: "login" | "signup"
}

type AuthState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "check_email"; message: string }
  | { status: "error"; message: string }

type AuthResponse = {
  ok?: boolean
  status?: "check_email"
  message?: string
  error?: string
  redirectTo?: string
}

export function AuthForm({ locale, mode }: AuthFormProps) {
  const t = copy[locale].auth
  const [state, setState] = useState<AuthState>({ status: "idle" })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "submitting" })

    const form = new FormData(event.currentTarget)
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.get("email"),
        locale,
      }),
    })

    const result = (await response.json().catch(() => null)) as
      | AuthResponse
      | null

    if (!response.ok) {
      setState({
        status: "error",
        message: result?.error ?? "Could not continue. Try again.",
      })

      if (result?.redirectTo) {
        window.setTimeout(() => {
          window.location.assign(result.redirectTo as string)
        }, 900)
      }

      return
    }

    if (result?.status === "check_email") {
      setState({
        status: "check_email",
        message: result.message ?? "Check your email to confirm your account.",
      })
      return
    }

    window.location.assign(result?.redirectTo ?? `/${locale}/app/dashboard`)
  }

  return (
    <div className="mt-6 grid gap-4">
      <a
        className="inline-flex w-full items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--brand)]"
        href={`/api/auth/google?locale=${locale}`}
      >
        {t.google}
      </a>
      <form className="grid gap-4 border-t border-[var(--border)] pt-4" onSubmit={handleSubmit}>
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
        <button
          className="inline-flex w-fit items-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
          disabled={state.status === "submitting"}
          type="submit"
        >
          <Mail aria-hidden="true" size={16} />
          {state.status === "submitting" ? t.submitting : t.submit}
        </button>
        {state.status === "check_email" ? (
          <p className="text-sm leading-6 text-[var(--muted)]">
            {state.message}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p className="text-sm leading-6 text-red-700">{state.message}</p>
        ) : null}
      </form>
    </div>
  )
}
