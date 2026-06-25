import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import {
  getClassroomRosterDetailBySlug,
  getSchoolById,
  getTeacherAssignmentDetail,
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
import { TeacherAssignmentReview } from "@/components/classroom/teacher-assignment-review"
import { getPreferredSchoolMembership } from "@/lib/auth/school-pages"
import { formatAssignmentDate } from "@/lib/student-assignments"

type Props = {
  params: Promise<{
    assignmentId: string
    classroomSlug: string
    locale: Locale
  }>
}

export default async function ClassroomAssignmentDetailPage({ params }: Props) {
  const { assignmentId, classroomSlug, locale } = await params
  const { membership, serviceSupabase } = await getPreferredSchoolMembership({
    locale,
    roles: ["teacher"],
  })
  const [classroomDetail, assignmentDetail] = await Promise.all([
    getClassroomRosterDetailBySlug({
      supabase: serviceSupabase,
      classroomSlug,
    }),
    getTeacherAssignmentDetail({
      supabase: serviceSupabase,
      assignmentId,
    }),
  ])
  if (!classroomDetail || !assignmentDetail) notFound()
  if (
    classroomDetail.classroom.owner_membership_id !== membership.id ||
    assignmentDetail.assignment.classroom_id !== classroomDetail.classroom.id ||
    assignmentDetail.assignment.school_id !== membership.school_id
  ) {
    redirect(`/${locale}/app/classrooms`)
  }

  const school = await getSchoolById({
    supabase: serviceSupabase,
    schoolId: membership.school_id,
  })
  const title = selectLocalizedText(
    {
      en: assignmentDetail.assignment.title_en,
      th: assignmentDetail.assignment.title_th,
    },
    locale
  )
  const description = selectLocalizedText(
    {
      en: assignmentDetail.assignment.description_en ?? "",
      th: assignmentDetail.assignment.description_th ?? undefined,
    },
    locale
  )
  const submittedCount = assignmentDetail.submissions.filter((submission) =>
    ["submitted", "late_submitted", "resubmitted", "graded"].includes(
      submission.status
    )
  ).length
  const gradedCount = assignmentDetail.submissions.filter(
    (submission) => submission.status === "graded"
  ).length

  return (
    <>
      <AppNav
        active="classrooms"
        classroomBadge={classroomDetail.pendingRequests.length}
        locale={locale}
        showClassrooms
      />
      <ClassroomShell
        actions={
          <Link
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium"
            href={`/${locale}/app/classrooms/${classroomSlug}/assignments`}
          >
            Back to assignments
          </Link>
        }
        eyebrow={school?.name ?? "Teacher"}
        tabs={[
          { href: `/${locale}/app/classrooms/${classroomSlug}`, label: "Overview" },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/roster`,
            label: "Roster",
            badge: classroomDetail.pendingRequests.length,
          },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/assignments`,
            label: "Assignments",
            active: true,
          },
        ]}
        title={title}
      >
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Items" value={assignmentDetail.items.length} />
          <MetricTile
            label="Points"
            value={assignmentDetail.assignment.total_points}
          />
          <MetricTile
            label="Due"
            value={formatAssignmentDate(
              assignmentDetail.assignment.due_at,
              locale
            )}
          />
          <MetricTile
            label="Submitted / graded"
            value={`${submittedCount} / ${gradedCount}`}
          />
        </div>

        <DataList title="Items and questions">
          {assignmentDetail.items.map((item) => {
            const questions = assignmentDetail.quizQuestions.filter(
              (question) => question.assignment_item_id === item.id
            )

            return (
              <DataRow key={item.id}>
                <div>
                  <p className="font-medium">{item.title_en}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item.item_type} / {item.points} points
                  </p>
                  {item.instructions_en ? (
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.instructions_en}
                    </p>
                  ) : null}
                  {questions.length > 0 ? (
                    <div className="mt-3 grid gap-2 text-sm">
                      {questions.map((question) => (
                        <div
                          className="rounded-[var(--radius)] bg-[var(--surface)] p-2"
                          key={question.id}
                        >
                          <p className="font-medium">{question.prompt_en}</p>
                          <p className="mt-1 text-[var(--muted)]">
                            {question.question_type} / {question.points} points
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </DataRow>
            )
          })}
        </DataList>

        <DataList title="Recipients and submissions">
          {assignmentDetail.recipients.length === 0 ? (
            <EmptyState>No recipients yet.</EmptyState>
          ) : null}
          {assignmentDetail.recipients.map((recipient) => {
            const submission = assignmentDetail.submissions.find(
              (candidate) => candidate.recipient_id === recipient.id
            )
            const itemSubmissions = submission
              ? assignmentDetail.itemSubmissions.filter(
                  (itemSubmission) =>
                    itemSubmission.submission_id === submission.id
                )
              : []

            return (
              <DataRow key={recipient.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      Student {recipient.student_user_id}
                    </p>
                    <StatusBadge>
                      {submission?.status ?? recipient.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Due:{" "}
                    {formatAssignmentDate(
                      recipient.due_at ?? assignmentDetail.assignment.due_at,
                      locale
                    )}
                    {submission?.submitted_at
                      ? ` / Submitted ${formatAssignmentDate(
                          submission.submitted_at,
                          locale
                        )}`
                      : ""}
                  </p>
                  {submission && itemSubmissions.length > 0 ? (
                    <TeacherAssignmentReview
                      assignmentId={assignmentDetail.assignment.id}
                      items={assignmentDetail.items}
                      itemSubmissions={itemSubmissions}
                      locale={locale}
                      quizQuestions={assignmentDetail.quizQuestions}
                      schoolId={membership.school_id}
                      submission={submission}
                    />
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      No submitted item work yet.
                    </p>
                  )}
                </div>
              </DataRow>
            )
          })}
        </DataList>
      </ClassroomShell>
    </>
  )
}
