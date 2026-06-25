"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Copy, Plus, RotateCcw, Trash2, UserCheck, UserMinus, X } from "lucide-react"
import type { Locale } from "@learnify/shared"
import {
  buttonClass,
  fieldClass,
  InlineError,
  secondaryButtonClass,
} from "@/components/classroom/classroom-ui"

type ApiState = {
  error?: string
  message?: string
  joinUrl?: string
  pending?: boolean
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

function SuccessText({ children }: { children?: string }) {
  if (!children) return null
  return (
    <p className="rounded-[var(--radius)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {children}
    </p>
  )
}

function CopyableJoinLink({
  joinUrl,
  locale,
}: {
  joinUrl: string
  locale: Locale
}) {
  const [copied, setCopied] = useState(false)
  const joinToken = joinUrl.split("/").pop()
  const href = joinToken ? `/${locale}/app/join/${joinToken}` : joinUrl

  async function copyLink() {
    await navigator.clipboard?.writeText(joinUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-white p-3 text-sm md:col-span-full">
      <div>
        <p className="font-medium text-[var(--text)]">Session-only QR link</p>
        <p className="mt-1 text-[var(--muted)]">
          Copy this link now. Learnify stores only a hash, so the raw QR link disappears after refresh.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input className={fieldClass} readOnly value={joinUrl} />
        <button className={secondaryButtonClass} onClick={copyLink} type="button">
          <Copy size={15} /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a className="w-fit font-medium underline" href={href}>
        Open join page
      </a>
    </div>
  )
}

function useApiAction() {
  const router = useRouter()
  const [state, setState] = useState<ApiState>({})

  async function run(
    url: string,
    body: unknown,
    options?: { refresh?: boolean; successMessage?: string }
  ) {
    setState({ pending: true })
    try {
      const payload = await postJson(url, body)
      setState({
        message: payload.message ?? options?.successMessage ?? "Saved.",
        joinUrl: payload.joinUrl,
      })
      if (options?.refresh !== false) router.refresh()
      return payload
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Request failed.",
      })
      return null
    }
  }

  return { run, state }
}

export function CreateSchoolForm() {
  const { run, state } = useApiAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run("/api/admin/schools", {
      name: form.get("name"),
      slug: form.get("slug"),
      adminSeatLimit: Number(form.get("adminSeatLimit") || 3),
      teacherSeatLimit: Number(form.get("teacherSeatLimit") || 1),
      studentSeatLimit: Number(form.get("studentSeatLimit") || 1),
      studentOverageAllowedByLearnify:
        form.get("studentOverageAllowedByLearnify") === "on",
      renewalDate: form.get("renewalDate") || undefined,
    })
    event.currentTarget.reset()
  }

  return (
    <form className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4 md:grid-cols-3" onSubmit={onSubmit}>
      <input className={fieldClass} name="name" placeholder="School name" required />
      <input className={fieldClass} name="slug" placeholder="school-slug" required />
      <input className={fieldClass} min={1} name="adminSeatLimit" placeholder="Admin seats" type="number" defaultValue={3} />
      <input className={fieldClass} min={1} name="teacherSeatLimit" placeholder="Teacher seats" type="number" required />
      <input className={fieldClass} min={1} name="studentSeatLimit" placeholder="Student seats" type="number" required />
      <input className={fieldClass} name="renewalDate" type="date" />
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <input name="studentOverageAllowedByLearnify" type="checkbox" />
        Allow student overage
      </label>
      <button className={buttonClass} disabled={state.pending} type="submit">
        <Plus size={16} /> Create school
      </button>
      <SuccessText>{state.message}</SuccessText>
      <InlineError>{state.error}</InlineError>
    </form>
  )
}

export function InviteForm({
  endpoint,
  label,
  schoolId,
}: {
  endpoint: string
  label: string
  schoolId?: string
}) {
  const { run, state } = useApiAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(endpoint, {
      email: form.get("email"),
      locale: form.get("locale"),
      ...(schoolId ? { schoolId } : {}),
    }, { successMessage: "Invite sent." })
    event.currentTarget.reset()
  }

  return (
    <form className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:grid-cols-[minmax(0,1fr)_120px_auto]" onSubmit={onSubmit}>
      <input className={fieldClass} name="email" placeholder="email@school.ac.th" required type="email" />
      <select className={fieldClass} name="locale" defaultValue="en">
        <option value="en">English</option>
        <option value="th">Thai</option>
      </select>
      <button className={buttonClass} disabled={state.pending} type="submit">
        <Plus size={16} /> {label}
      </button>
      <SuccessText>{state.message}</SuccessText>
      <InlineError>{state.error}</InlineError>
    </form>
  )
}

export function CreateClassroomForm({ locale, schoolId }: { locale: Locale; schoolId: string }) {
  const { run, state } = useApiAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(
      "/api/classrooms",
      {
        schoolId,
        locale,
        name: form.get("name"),
        subjectLabel: form.get("subjectLabel"),
        schoolYear: form.get("schoolYear") || undefined,
        gradeLabel: form.get("gradeLabel") || undefined,
      },
      { refresh: true, successMessage: "Classroom created. Copy the QR link before refreshing." }
    )
    event.currentTarget.reset()
  }

  return (
    <form className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4 md:grid-cols-5" onSubmit={onSubmit}>
      <input className={fieldClass} name="name" placeholder="Classroom name" required />
      <input className={fieldClass} name="subjectLabel" placeholder="Subject" required defaultValue="Physics" />
      <input className={fieldClass} name="schoolYear" placeholder="2026" />
      <input className={fieldClass} name="gradeLabel" placeholder="Grade" />
      <button className={buttonClass} disabled={state.pending} type="submit">
        <Plus size={16} /> Create
      </button>
      <SuccessText>{state.message}</SuccessText>
      {state.joinUrl ? <CopyableJoinLink joinUrl={state.joinUrl} locale={locale} /> : null}
      <InlineError>{state.error}</InlineError>
    </form>
  )
}

export function BulkStudentInviteForm({
  classroomId,
  locale,
  schoolId,
}: {
  classroomId: string
  locale: Locale
  schoolId: string
}) {
  const { run, state } = useApiAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(`/api/classrooms/${classroomId}/student-invites`, {
      schoolId,
      locale,
      emails: form.get("emails"),
    }, { successMessage: "Student invites sent." })
    event.currentTarget.reset()
  }

  return (
    <form className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4" onSubmit={onSubmit}>
      <textarea className={fieldClass} name="emails" placeholder="Paste student emails, one per line" required rows={4} />
      <button className={buttonClass} disabled={state.pending} type="submit">
        <Plus size={16} /> Send invites
      </button>
      <SuccessText>{state.message}</SuccessText>
      <InlineError>{state.error}</InlineError>
    </form>
  )
}

export function JoinByCodeForm() {
  const { run, state } = useApiAction()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(
      "/api/classrooms/join/code",
      { joinCode: form.get("joinCode") },
      { successMessage: "Request sent. Waiting for teacher approval." }
    )
    event.currentTarget.reset()
  }

  return (
    <form className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={onSubmit}>
      <input className={fieldClass} name="joinCode" placeholder="Class code" required />
      <button className={buttonClass} disabled={state.pending} type="submit">
        <UserCheck size={16} /> Request to join
      </button>
      <SuccessText>{state.message}</SuccessText>
      <InlineError>{state.error}</InlineError>
    </form>
  )
}

export function TokenJoinForm({ joinToken }: { joinToken: string }) {
  const { run, state } = useApiAction()

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <button
        className={buttonClass}
        disabled={state.pending}
        onClick={() =>
          run(
            "/api/classrooms/join/token",
            { joinToken },
            { successMessage: "Request sent. Waiting for teacher approval." }
          )
        }
        type="button"
      >
        <UserCheck size={16} /> Request to join
      </button>
      <div className="mt-3">
        <SuccessText>{state.message}</SuccessText>
      </div>
      <div className="mt-3">
        <InlineError>{state.error}</InlineError>
      </div>
    </div>
  )
}

export function StudentInviteTokenForm({ token }: { token: string }) {
  const { run, state } = useApiAction()

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <button
        className={secondaryButtonClass}
        disabled={state.pending}
        onClick={() =>
          run(
            "/api/classrooms/student-invites/accept",
            { token },
            { successMessage: "Invite accepted. Waiting for teacher approval." }
          )
        }
        type="button"
      >
        <UserCheck size={16} /> Accept email invite
      </button>
      <div className="mt-3">
        <SuccessText>{state.message}</SuccessText>
      </div>
      <div className="mt-3">
        <InlineError>{state.error}</InlineError>
      </div>
    </div>
  )
}

export function SchoolInviteTokenForm({ token }: { token: string }) {
  const { run, state } = useApiAction()

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <button
        className={buttonClass}
        disabled={state.pending}
        onClick={() =>
          run(
            "/api/school/invites/accept",
            { token },
            { successMessage: "Invite accepted. You can now open your school workspace." }
          )
        }
        type="button"
      >
        <UserCheck size={16} /> Accept school invite
      </button>
      <div className="mt-3">
        <SuccessText>{state.message}</SuccessText>
      </div>
      <div className="mt-3">
        <InlineError>{state.error}</InlineError>
      </div>
    </div>
  )
}

export function RowActionButton({
  body = {},
  children,
  icon = "check",
  locale,
  url,
}: {
  body?: unknown
  children: string
  icon?: "check" | "x" | "remove" | "rotate" | "trash" | "copy"
  locale?: Locale
  url: string
}) {
  const { run, state } = useApiAction()
  const Icon =
    icon === "x"
      ? X
      : icon === "remove"
        ? UserMinus
        : icon === "rotate"
          ? RotateCcw
          : icon === "trash"
            ? Trash2
            : icon === "copy"
              ? Copy
              : UserCheck

  return (
    <div className="grid gap-2">
      <button
        className={icon === "check" || icon === "rotate" ? buttonClass : secondaryButtonClass}
        disabled={state.pending}
        onClick={() =>
          run(url, body, {
            successMessage:
              icon === "rotate"
                ? "Join link regenerated. Copy it before refreshing."
                : `${children} complete.`,
          })
        }
        type="button"
      >
        <Icon size={15} /> {children}
      </button>
      <SuccessText>{state.joinUrl ? undefined : state.message}</SuccessText>
      {state.joinUrl && locale ? (
        <CopyableJoinLink joinUrl={state.joinUrl} locale={locale} />
      ) : null}
      <InlineError>{state.error}</InlineError>
    </div>
  )
}
