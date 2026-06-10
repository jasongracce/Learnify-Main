import type { ReactNode } from "react"
import clsx from "clsx"

type StatCardProps = {
  icon?: ReactNode
  label: string
  value: string
  detail?: string
  className?: string
}

export function StatCard({ icon, label, value, detail, className }: StatCardProps) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>}
    </div>
  )
}
