import clsx from "clsx"

type ProgressBarProps = {
  percent: number
  label?: string
  value?: string
  className?: string
}

export function ProgressBar({ percent, label, value, className }: ProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)))

  return (
    <div className={className}>
      {(label || value) && (
        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
          {label && <span className="text-[var(--muted)]">{label}</span>}
          {value && <span className="font-medium">{value}</span>}
        </div>
      )}
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safePercent}
        className="h-2 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface)]"
        role="progressbar"
      >
        <div
          className={clsx(
            "h-full rounded-[var(--radius-pill)] bg-[var(--text)] transition-[width] duration-500"
          )}
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}
