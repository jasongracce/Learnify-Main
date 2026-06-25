import Link from "next/link"
import { notFound } from "next/navigation"
import { getStudentAssignmentDetail } from "@learnify/database"
import { createSupabaseServiceClientFromEnv } from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { AppNav } from "@/components/app-nav"
import { StudentAssignmentWorkspace } from "@/components/student-assignment-workspace"
import {
  ClassroomShell,
  MetricTile,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { requireBetaUser } from "@/lib/auth/protected"
import { requireSupabaseServiceEnv } from "@/lib/env"
import { formatAssignmentDate } from "@/lib/student-assignments"

type Props = {
  params: Promise<{ assignmentId: string; locale: Locale }>
}

const labels = {
  en: {
    assignments: "Assignments",
    back: "Back to assignments",
    due: "Due",
    items: "Items",
    points: "Points",
    status: "Status",
  },
  th: {
    assignments: "Assignments",
    back: "Back to assignments",
    due: "Due",
    items: "Items",
    points: "Points",
    status: "Status",
  },
} satisfies Record<Locale, Record<string, string>>

export default async function AssignmentDetailPage({ params }: Props) {
  const { assignmentId, locale } = await params
  const user = await requireBetaUser(locale)
  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )
  const detail = await getStudentAssignmentDetail({
    supabase: serviceSupabase,
    assignmentId,
    studentUserId: user.id,
  })

  if (!detail) notFound()

  const t = labels[locale]
  const title = selectLocalizedText(
    { en: detail.assignment.title_en, th: detail.assignment.title_th },
    locale
  )
  const description = selectLocalizedText(
    {
      en: detail.assignment.description_en ?? "",
      th: detail.assignment.description_th ?? undefined,
    },
    locale
  )

  return (
    <>
      <AppNav active="assignments" locale={locale} />
      <ClassroomShell
        eyebrow={t.assignments}
        title={title}
        actions={
          <Link
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium"
            href={`/${locale}/app/assignments`}
          >
            {t.back}
          </Link>
        }
      >
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label={t.items} value={detail.items.length} />
          <MetricTile label={t.points} value={detail.assignment.total_points} />
          <MetricTile
            label={t.due}
            value={formatAssignmentDate(
              detail.recipient.due_at ?? detail.assignment.due_at,
              locale
            )}
          />
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
            <p className="text-sm text-[var(--muted)]">{t.status}</p>
            <div className="mt-3">
              <StatusBadge>
                {detail.submission?.status ?? detail.recipient.status}
              </StatusBadge>
            </div>
          </div>
        </div>

        <StudentAssignmentWorkspace detail={detail} locale={locale} />
      </ClassroomShell>
    </>
  )
}
