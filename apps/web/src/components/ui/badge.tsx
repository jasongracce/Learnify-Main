import type { ReactNode } from "react"
import clsx from "clsx"

type BadgeTone = "neutral" | "success" | "warning" | "danger"

const tones: Record<BadgeTone, string> = {
  neutral: "border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted)]",
  success: "border-[color:rgba(22,163,74,0.2)] bg-[var(--success-soft)] text-[var(--success)]",
  warning: "border-[color:rgba(186,117,23,0.25)] bg-[color:rgba(186,117,23,0.08)] text-[var(--brand)]",
  danger: "border-[color:rgba(220,38,38,0.2)] bg-[var(--danger-soft)] text-[var(--danger)]",
}

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export type ConfidenceLevel = "low" | "medium" | "high"

const confidenceTones: Record<ConfidenceLevel, BadgeTone> = {
  low: "danger",
  medium: "warning",
  high: "success",
}

type ConfidenceBadgeProps = {
  level: ConfidenceLevel
  label: string
  className?: string
}

export function ConfidenceBadge({ level, label, className }: ConfidenceBadgeProps) {
  return (
    <Badge className={className} tone={confidenceTones[level]}>
      {label}
    </Badge>
  )
}
