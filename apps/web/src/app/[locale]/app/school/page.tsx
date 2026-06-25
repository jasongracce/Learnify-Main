import Link from "next/link"
import {
  getSchoolAdminNotificationSummary,
  getSchoolById,
  listPendingSchoolInvites,
  listSchoolMemberships,
} from "@learnify/database"
import type { Locale } from "@learnify/shared"
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

type Props = { params: Promise<{ locale: Locale }> }

export default async function SchoolPage({ params }: Props) {
  const { locale } = await params
  const { membership, serviceSupabase } = await getPreferredSchoolMembership({
    locale,
    roles: ["school_admin"],
  })
  const school = await getSchoolById({
    supabase: serviceSupabase,
    schoolId: membership.school_id,
  })
  const [summary, pendingCapacity, invites] = await Promise.all([
    getSchoolAdminNotificationSummary({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
    }),
    listSchoolMemberships({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
      status: "pending_capacity",
    }),
    listPendingSchoolInvites({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
    }),
  ])
  const schoolBadge = summary.pendingCapacityMemberships + summary.pendingInvites

  return (
    <>
      <AppNav
        active="school"
        locale={locale}
        schoolBadge={schoolBadge}
        showSchool
      />
      <ClassroomShell
        eyebrow="School admin"
        tabs={[
          { href: `/${locale}/app/school`, label: "Overview", active: true },
          { href: `/${locale}/app/school/users`, label: "Users" },
          {
            href: `/${locale}/app/school/invites`,
            label: "Invites",
            badge: invites.length,
          },
        ]}
        title={school?.name ?? "School"}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Subscription" value={summary.subscriptionStatus} />
          <MetricTile label="Admins" value={`${summary.adminSeatsUsed}/${summary.adminSeatLimit}`} />
          <MetricTile label="Teachers" value={`${summary.teacherSeatsUsed}/${summary.teacherSeatLimit}`} />
          <MetricTile label="Students" value={`${summary.studentSeatsUsed}/${summary.studentSeatLimit}`} />
        </div>
        <DataList title="Notifications">
          <DataRow>
            <p className="font-medium">Pending capacity users</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {summary.pendingCapacityMemberships} users are waiting for
              available seats.
            </p>
          </DataRow>
          <DataRow>
            <p className="font-medium">Pending invites</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {summary.pendingInvites} invites are waiting for acceptance.
            </p>
          </DataRow>
        </DataList>
        <DataList title="Pending capacity">
          {pendingCapacity.length === 0 ? (
            <EmptyState>No pending capacity users.</EmptyState>
          ) : null}
          {pendingCapacity.map((item) => (
            <DataRow
              actions={
                <Link
                  className="text-sm font-medium underline"
                  href={`/${locale}/app/school/users`}
                >
                  Manage
                </Link>
              }
              key={item.id}
            >
              <p className="font-medium">{item.email_normalized}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.role}</p>
              <StatusBadge>{item.status}</StatusBadge>
            </DataRow>
          ))}
        </DataList>
      </ClassroomShell>
    </>
  )
}
