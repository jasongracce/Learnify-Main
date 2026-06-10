import type { ReactNode } from "react"
import clsx from "clsx"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-6 py-8 text-center",
        className
      )}
    >
      {icon && <div className="text-[var(--muted-soft)]">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="max-w-sm text-sm text-[var(--muted)]">{body}</p>}
      {action}
    </div>
  )
}
