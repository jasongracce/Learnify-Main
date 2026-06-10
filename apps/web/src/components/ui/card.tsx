import type { ReactNode } from "react"
import clsx from "clsx"

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </section>
  )
}

type CardHeaderProps = {
  icon?: ReactNode
  title: string
  action?: ReactNode
  className?: string
}

export function CardHeader({ icon, title, action, className }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-3 px-5 pt-5",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      {action}
    </div>
  )
}

type CardSectionProps = {
  children: ReactNode
  className?: string
}

export function CardSection({ children, className }: CardSectionProps) {
  return <div className={clsx("px-5 py-5", className)}>{children}</div>
}
