import Link from "next/link"
import {
  countPendingJoinRequestsForTeacher,
  getSchoolById,
  listClassroomsForTeacher,
} from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { CreateClassroomForm } from "@/components/classroom/classroom-forms"
import {
  ClassroomShell,
  DataList,
  DataRow,
  EmptyState,
  MetricTile,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { getPreferredSchoolMembership } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale }> }

export default async function ClassroomsPage({ params }: Props) {
  const { locale } = await params
  const { membership, serviceSupabase } = await getPreferredSchoolMembership({
    locale,
    roles: ["teacher"],
  })
  const [school, classrooms, pendingCount] = await Promise.all([
    getSchoolById({ supabase: serviceSupabase, schoolId: membership.school_id }),
    listClassroomsForTeacher({
      supabase: serviceSupabase,
      ownerMembershipId: membership.id,
    }),
    countPendingJoinRequestsForTeacher({
      supabase: serviceSupabase,
      ownerMembershipId: membership.id,
    }),
  ])

  return (
    <>
      <AppNav
        active="classrooms"
        classroomBadge={pendingCount}
        locale={locale}
        showClassrooms
      />
      <ClassroomShell eyebrow={school?.name ?? "Teacher"} title="Classrooms">
        <div className="grid gap-3 md:grid-cols-2">
          <MetricTile label="Owned classrooms" value={classrooms.length} />
          <MetricTile
            detail="Across active classrooms"
            label="Pending joins"
            value={pendingCount}
          />
        </div>
        <CreateClassroomForm locale={locale} schoolId={membership.school_id} />
        <DataList title="Classroom list">
          {classrooms.length === 0 ? (
            <EmptyState>No classrooms yet.</EmptyState>
          ) : null}
          {classrooms.map((classroom) => (
            <DataRow
              actions={
                <>
                  <Link
                    className="rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-sm font-medium text-white"
                    href={`/${locale}/app/classrooms/${classroom.slug}`}
                  >
                    Open
                  </Link>
                  <Link
                    className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium"
                    href={`/${locale}/app/classrooms/${classroom.slug}/roster`}
                  >
                    Roster
                  </Link>
                </>
              }
              key={classroom.id}
            >
              <p className="font-medium">{classroom.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {[
                  classroom.subject_label,
                  classroom.grade_label ?? "No grade",
                  classroom.school_year ?? "No year",
                ].join(" / ")}
              </p>
              <StatusBadge>{classroom.status}</StatusBadge>
            </DataRow>
          ))}
        </DataList>
      </ClassroomShell>
    </>
  )
}
