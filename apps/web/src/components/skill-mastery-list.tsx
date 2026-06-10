import Link from "next/link"
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ui/badge"
import { ProgressBar } from "@/components/ui/progress"

export type SkillMasteryListItem = {
  id: string
  title: string
  masteryScore: number
  confidenceLevel: ConfidenceLevel
  href?: string
}

type SkillMasteryListProps = {
  items: SkillMasteryListItem[]
  confidenceLabels: Record<ConfidenceLevel, string>
  practiceLabel: string
}

export function SkillMasteryList({
  items,
  confidenceLabels,
  practiceLabel,
}: SkillMasteryListProps) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {items.map((item) => (
        <div
          className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_200px_110px] md:items-center"
          key={item.id}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title}</p>
            <ConfidenceBadge
              label={confidenceLabels[item.confidenceLevel]}
              level={item.confidenceLevel}
            />
          </div>
          <ProgressBar percent={item.masteryScore} value={`${item.masteryScore}%`} />
          {item.href ? (
            <Link
              className="text-sm font-medium underline-offset-4 hover:underline md:text-right"
              href={item.href}
            >
              {practiceLabel}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}
