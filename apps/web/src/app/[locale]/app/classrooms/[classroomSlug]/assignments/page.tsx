import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import {
  getClassroomRosterDetailBySlug,
  getSchoolById,
  getTeacherAssignmentDetail,
  listAssignmentsForClassroom,
} from "@learnify/database"
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
import { getPreferredSchoolMembership } from "@/lib/auth/school-pages"
import { formatAssignmentDate } from "@/lib/student-assignments"

type Props = { params: Promise<{ locale: Locale; classroomSlug: string }> }

export default async function ClassroomAssignmentsPage({ params }: Props) {
  const { locale, classroomSlug } = await params
  const { membership, serviceSupabase } = await getPreferredSchoolMembership({
    locale,
    roles: ["teacher"],
  })
  const detail = await getClassroomRosterDetailBySlug({
    supabase: serviceSupabase,
    classroomSlug,
  })
  if (!detail) notFound()
  if (detail.classroom.owner_membership_id !== membership.id) {
    redirect(`/${locale}/app/classrooms`)
  }

  const [school, assignments] = await Promise.all([
    getSchoolById({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
    }),
    listAssignmentsForClassroom({
      supabase: serviceSupabase,
      classroomId: detail.classroom.id,
    }),
  ])
  const assignmentDetails = await Promise.all(
    assignments.map((assignment) =>
      getTeacherAssignmentDetail({
        supabase: serviceSupabase,
        assignmentId: assignment.id,
      })
    )
  )
  const submittedCount = assignmentDetails.reduce(
    (total, assignment) =>
      total +
      (assignment?.submissions.filter((submission) =>
        ["submitted", "late_submitted", "resubmitted", "graded"].includes(
          submission.status
        )
      ).length ?? 0),
    0
  )

  return (
    <>
      <AppNav
        active="classrooms"
        classroomBadge={detail.pendingRequests.length}
        locale={locale}
        showClassrooms
      />
      <ClassroomShell
        eyebrow={school?.name ?? "Teacher"}
        tabs={[
          { href: `/${locale}/app/classrooms/${classroomSlug}`, label: "Overview" },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/roster`,
            label: "Roster",
            badge: detail.pendingRequests.length,
          },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/assignments`,
            label: "Assignments",
            active: true,
          },
        ]}
        title={`${detail.classroom.name} assignments`}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile label="Assignments" value={assignments.length} />
          <MetricTile label="Recipients" value={detail.activeRoster.length} />
          <MetricTile label="Submitted work" value={submittedCount} />
        </div>

        <DataList title="Assignments">
          {assignments.length === 0 ? (
            <EmptyState>No assignments yet.</EmptyState>
          ) : null}
          {assignmentDetails.map((assignmentDetail) => {
            if (!assignmentDetail) return null
            const assignment = assignmentDetail.assignment
            const title = selectLocalizedText(
              { en: assignment.title_en, th: assignment.title_th },
              locale
            )
            const submitted = assignmentDetail.submissions.filter((submission) =>
              ["submitted", "late_submitted", "resubmitted", "graded"].includes(
                submission.status
              )
            ).length
            const graded = assignmentDetail.submissions.filter(
              (submission) => submission.status === "graded"
            ).length

            return (
              <DataRow
                actions={
                  <Link
                    className="rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-sm font-medium text-white"
                    href={`/${locale}/app/classrooms/${classroomSlug}/assignments/${assignment.id}`}
                  >
                    Review
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
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                      <StatusBadge>{assignment.status}</StatusBadge>
                      <span>
                        Due: {formatAssignmentDate(assignment.due_at, locale)}
                      </span>
                      <span>{assignment.total_points} points</span>
                      <span>{assignmentDetail.recipients.length} recipients</span>
                      <span>{submitted} submitted</span>
                      <span>{graded} graded</span>
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
