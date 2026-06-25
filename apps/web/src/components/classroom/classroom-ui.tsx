import Link from "next/link"
import type { ReactNode } from "react"

type ShellTab = {
  href: string
  label: string
  active?: boolean
  badge?: number
}

export function ClassroomShell({
  actions,
  children,
  eyebrow,
  tabs,
  title,
}: {
  actions?: ReactNode
  children: ReactNode
  eyebrow?: string
  tabs?: ShellTab[]
  title: string
}) {
  return (
    <main className="learnify-container py-6 md:py-8">
      <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        </div>
        {actions}
      </div>
      {tabs ? <RoleTabs tabs={tabs} /> : null}
      <div className="mt-5 grid gap-4">{children}</div>
    </main>
  )
}

export function RoleTabs({ tabs }: { tabs: ShellTab[] }) {
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {tabs.map((tab) => (
        <Link
          className={
            tab.active
              ? "inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 font-medium text-white"
              : "inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          }
          href={tab.href}
          key={tab.href}
        >
          {tab.label}
          {tab.badge ? (
            <span className="rounded-[4px] bg-[var(--brand)] px-1.5 py-0.5 text-xs text-white">
              {tab.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  )
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
      {children}
    </span>
  )
}

export function MetricTile({
  detail,
  label,
  value,
}: {
  detail?: string
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {detail ? <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p> : null}
    </div>
  )
}

export function DataList({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)]">
      {title ? (
        <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-medium">
          {title}
        </div>
      ) : null}
      <div className="divide-y divide-[var(--border)]">{children}</div>
    </section>
  )
}

export function DataRow({
  actions,
  children,
}: {
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">{children}</div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-sm text-[var(--muted)]">{children}</div>
}

export function InlineError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return (
    <p className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  )
}

export const fieldClass =
  "w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--brand)]"

export const buttonClass =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"

export const secondaryButtonClass =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
