import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { listStudentAssignments } from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { AppNav } from "@/components/app-nav"
import {
  ClassroomShell,
  DataList,
  DataRow,
  EmptyState,
  MetricTile,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { requireBetaUser } from "@/lib/auth/protected"
import { requireSupabaseServiceEnv } from "@/lib/env"
import { createSupabaseServiceClientFromEnv } from "@learnify/database"
import { formatAssignmentDate } from "@/lib/student-assignments"

type Props = { params: Promise<{ locale: Locale }> }

const labels = {
  en: {
    assigned: "Assigned",
    assignments: "Assignments",
    due: "Due",
    empty: "No assignments yet.",
    open: "Open",
    openWork: "Open work",
    points: "points",
    source: "Published classroom work assigned to you",
    submitted: "Submitted",
  },
  th: {
    assigned: "Assigned",
    assignments: "Assignments",
    due: "Due",
    empty: "No assignments yet.",
    open: "Open",
    openWork: "Open work",
    points: "points",
    source: "Published classroom work assigned to you",
    submitted: "Submitted",
  },
} satisfies Record<Locale, Record<string, string>>

export default async function AssignmentsPage({ params }: Props) {
  const { locale } = await params
  const user = await requireBetaUser(locale)
  const serviceSupabase = createSupabaseServiceClientFromEnv(
    requireSupabaseServiceEnv()
  )
  const assignments = await listStudentAssignments({
    supabase: serviceSupabase,
    studentUserId: user.id,
  })
  const t = labels[locale]
  const submittedCount = assignments.filter((item) =>
    item.submission
      ? ["submitted", "late_submitted", "resubmitted", "graded"].includes(
          item.submission.status
        )
      : false
  ).length

  return (
    <>
      <AppNav active="assignments" locale={locale} />
      <ClassroomShell eyebrow={t.source} title={t.assignments}>
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile label={t.assigned} value={assignments.length} />
          <MetricTile
            label={t.openWork}
            value={assignments.length - submittedCount}
          />
          <MetricTile label={t.submitted} value={submittedCount} />
        </div>

        <DataList title={t.assignments}>
          {assignments.length === 0 ? <EmptyState>{t.empty}</EmptyState> : null}
          {assignments.map(({ assignment, recipient, submission }) => {
            const title = selectLocalizedText(
              { en: assignment.title_en, th: assignment.title_th },
              locale
            )
            const description = selectLocalizedText(
              {
                en: assignment.description_en ?? "",
                th: assignment.description_th ?? undefined,
              },
              locale
            )

            return (
              <DataRow
                actions={
                  <Link
                    className="rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-sm font-medium text-white"
                    href={`/${locale}/app/assignments/${assignment.id}`}
                  >
                    {t.open}
                  </Link>
                }
                key={assignment.id}
              >
                <div className="flex items-start gap-3">
                  <ClipboardList
                    aria-hidden="true"
                    className="mt-1 text-[var(--brand)]"
                    size={18}
                  />
                  <div>
                    <p className="font-medium">{title}</p>
                    {description ? (
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                      <StatusBadge>
                        {submission?.status ?? recipient.status}
                      </StatusBadge>
                      <span>
                        {t.due}:{" "}
                        {formatAssignmentDate(
                          recipient.due_at ?? assignment.due_at,
                          locale
                        )}
                      </span>
                      <span>
                        {assignment.total_points} {t.points}
                      </span>
                    </div>
                  </div>
                </div>
              </DataRow>
            )
          })}
        </DataList>
      </ClassroomShell>
    </>
  )
}
