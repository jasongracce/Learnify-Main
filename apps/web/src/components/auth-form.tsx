"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

export function AuthForm({ locale, mode }: AuthFormProps) {
  const t = copy[locale].auth
  const [state, setState] = useState<AuthState>({ status: "idle" })
  const [showPassword, setShowPassword] = useState(false)

  const isSignup = mode === "signup"
  const heading = isSignup ? t.signupHeading : t.loginTitle
  const submitLabel = isSignup ? t.submit : t.submitLogin

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
        password: form.get("password"),
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
    <div className="w-full max-w-sm">
      <h1 className="text-4xl font-semibold tracking-tight text-[#1a1a1a]">
        {heading}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">
        {t.subtitle}
      </p>

      {/* Email + primary */}
      <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm font-medium text-[#1a1a1a]">
          {t.email}
          <div className="relative">
            <Mail
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
            />
            <input
              className="w-full rounded-xl border border-[#d4d4d4] bg-[#f9f9f7] py-2.5 pl-10 pr-4 text-sm font-normal text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#1a1a1a] focus:bg-white"
              name="email"
              type="email"
              placeholder="you@email.com"
              required
            />
          </div>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-[#1a1a1a]">
          {t.password}
          <div className="relative">
            <Lock
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9a9a]"
            />
            <input
              className="w-full rounded-xl border border-[#d4d4d4] bg-[#f9f9f7] py-2.5 pl-10 pr-11 text-sm font-normal text-[#1a1a1a] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[#1a1a1a] focus:bg-white"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] transition-colors hover:text-[#1a1a1a]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        <button
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#2a2a2a] disabled:opacity-60"
          disabled={state.status === "submitting"}
          type="submit"
        >
          {state.status === "submitting" ? t.submitting : submitLabel}
        </button>
        {state.status === "check_email" ? (
          <p className="text-sm leading-6 text-[#6b6b6b]">{state.message}</p>
        ) : null}
        {state.status === "error" ? (
          <p className="text-sm leading-6 text-red-600">{state.message}</p>
        ) : null}
      </form>

      {/* Cross-link */}
      <p className="mt-4 text-center text-sm text-[#6b6b6b]">
        {isSignup ? t.haveAccount : t.noAccount}{" "}
        <Link
          className="font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
          href={`/${locale}/auth/${isSignup ? "login" : "signup"}`}
        >
          {isSignup ? t.loginTitle : t.signupTitle}
        </Link>
      </p>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#ececec]" />
        <span className="text-xs text-[#9a9a9a]">{t.or}</span>
        <span className="h-px flex-1 bg-[#ececec]" />
      </div>

      {/* Google */}
      <a
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#d4d4d4] bg-white px-4 py-2.5 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#1a1a1a] hover:shadow-sm"
        href={`/api/auth/google?locale=${locale}`}
      >
        <GoogleIcon />
        {t.google}
      </a>
    </div>
  )
}
