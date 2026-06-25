import { notFound, redirect } from "next/navigation"
import { getClassroomRosterDetailBySlug, getSchoolById } from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { RowActionButton } from "@/components/classroom/classroom-forms"
import {
  ClassroomShell,
  DataList,
  DataRow,
  EmptyState,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { getPreferredSchoolMembership } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale; classroomSlug: string }> }

export default async function ClassroomRosterPage({ params }: Props) {
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
  const school = await getSchoolById({
    supabase: serviceSupabase,
    schoolId: membership.school_id,
  })

  return (
    <>
      <AppNav
        active="classroomRoster"
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
            active: true,
            badge: detail.pendingRequests.length,
          },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/assignments`,
            label: "Assignments",
          },
        ]}
        title={`${detail.classroom.name} roster`}
      >
        <DataList title="Pending join requests">
          {detail.pendingRequests.length === 0 ? (
            <EmptyState>No pending requests.</EmptyState>
          ) : null}
          {detail.pendingRequests.map((request) => (
            <DataRow
              actions={
                <>
                  <RowActionButton
                    body={{ schoolId: membership.school_id }}
                    url={`/api/classrooms/join-requests/${request.id}/approve`}
                  >
                    Approve
                  </RowActionButton>
                  <RowActionButton
                    body={{ schoolId: membership.school_id }}
                    icon="x"
                    url={`/api/classrooms/join-requests/${request.id}/reject`}
                  >
                    Reject
                  </RowActionButton>
                </>
              }
              key={request.id}
            >
              <p className="font-medium">
                {request.email ?? request.email_normalized ?? request.student_user_id ?? "Student"}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {request.source} / requested {new Date(request.requested_at).toLocaleDateString()}
              </p>
              <StatusBadge>{request.status}</StatusBadge>
            </DataRow>
          ))}
        </DataList>
        <DataList title="Active roster">
          {detail.activeRoster.length === 0 ? (
            <EmptyState>No active students.</EmptyState>
          ) : null}
          {detail.activeRoster.map((student) => (
            <DataRow
              actions={
                <RowActionButton
                  body={{ schoolId: membership.school_id }}
                  icon="remove"
                  url={`/api/classrooms/${detail.classroom.id}/students/${student.id}/remove`}
                >
                  Remove
                </RowActionButton>
              }
              key={student.id}
            >
              <p className="font-medium">{student.student_user_id}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Joined {student.joined_at ? new Date(student.joined_at).toLocaleDateString() : "recently"}
              </p>
              <StatusBadge>{student.status}</StatusBadge>
            </DataRow>
          ))}
        </DataList>
      </ClassroomShell>
    </>
  )
}
