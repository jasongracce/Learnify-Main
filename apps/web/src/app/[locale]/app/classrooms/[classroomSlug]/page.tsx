import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getClassroomRosterDetailBySlug, getSchoolById } from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import {
  BulkStudentInviteForm,
  RowActionButton,
} from "@/components/classroom/classroom-forms"
import {
  ClassroomShell,
  DataList,
  DataRow,
  MetricTile,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { getPreferredSchoolMembership } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale; classroomSlug: string }> }

export default async function ClassroomDetailPage({ params }: Props) {
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
        active="classrooms"
        classroomBadge={detail.pendingRequests.length}
        locale={locale}
        showClassrooms
      />
      <ClassroomShell
        eyebrow={school?.name ?? "Teacher"}
        tabs={[
          {
            href: `/${locale}/app/classrooms/${classroomSlug}`,
            label: "Overview",
            active: true,
          },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/roster`,
            label: "Roster",
            badge: detail.pendingRequests.length,
          },
          {
            href: `/${locale}/app/classrooms/${classroomSlug}/assignments`,
            label: "Assignments",
          },
        ]}
        title={detail.classroom.name}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Active roster" value={detail.activeRoster.length} />
          <MetricTile label="Pending joins" value={detail.pendingRequests.length} />
          <MetricTile
            label="Class code"
            value={detail.classroom.join_enabled ? detail.classroom.join_code : "Disabled"}
          />
          <MetricTile
            detail="Raw QR tokens are only shown once."
            label="QR link"
            value="Regenerate"
          />
        </div>
        <DataList title="Join controls">
          <DataRow
            actions={
              <>
                <RowActionButton
                  body={{ schoolId: membership.school_id }}
                  icon="rotate"
                  locale={locale}
                  url={`/api/classrooms/${detail.classroom.id}/join-code/regenerate`}
                >
                  Regenerate QR link
                </RowActionButton>
                <RowActionButton
                  body={{ schoolId: membership.school_id }}
                  icon="x"
                  url={`/api/classrooms/${detail.classroom.id}/join-code/disable`}
                >
                  Disable
                </RowActionButton>
              </>
            }
          >
            <p className="font-medium">Class code: {detail.classroom.join_code}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Existing classrooms cannot reveal the stored QR token because only
              its hash is stored.
            </p>
            <StatusBadge>{detail.classroom.join_enabled ? "enabled" : "disabled"}</StatusBadge>
          </DataRow>
        </DataList>
        <BulkStudentInviteForm
          classroomId={detail.classroom.id}
          locale={locale}
          schoolId={membership.school_id}
        />
        <Link
          className="w-fit rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium"
          href={`/${locale}/app/classrooms`}
        >
          Back to classrooms
        </Link>
      </ClassroomShell>
    </>
  )
}
