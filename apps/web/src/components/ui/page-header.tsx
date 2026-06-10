import type { ReactNode } from "react"
import clsx from "clsx"

type PageHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
