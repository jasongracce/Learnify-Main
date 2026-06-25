import { notFound } from "next/navigation"
import {
  getSchoolBySlug,
  getSchoolSeatSummary,
  listAuditEventsForSchool,
  listPendingSchoolInvites,
} from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { InviteForm, RowActionButton } from "@/components/classroom/classroom-forms"
import {
  ClassroomShell,
  DataList,
  DataRow,
  EmptyState,
  MetricTile,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { requireLearnifyAdminPage } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale; schoolSlug: string }> }

export default async function AdminSchoolDetailPage({ params }: Props) {
  const { locale, schoolSlug } = await params
  const { serviceSupabase } = await requireLearnifyAdminPage(locale)
  const school = await getSchoolBySlug({ supabase: serviceSupabase, slug: schoolSlug })
  if (!school) notFound()

  const [seats, invites, auditEvents] = await Promise.all([
    getSchoolSeatSummary({ supabase: serviceSupabase, schoolId: school.id }),
    listPendingSchoolInvites({ supabase: serviceSupabase, schoolId: school.id }),
    listAuditEventsForSchool({
      supabase: serviceSupabase,
      schoolId: school.id,
      limit: 25,
    }),
  ])

  return (
    <>
      <AppNav active="adminSchools" locale={locale} showAdmin />
      <ClassroomShell eyebrow="School contract" title={school.name}>
        <div className="grid gap-3 md:grid-cols-4">
          <MetricTile label="Subscription" value={school.subscription_status} />
          <MetricTile label="Admins" value={`${seats.activeAdmins}/${seats.adminSeatLimit}`} />
          <MetricTile label="Teachers" value={`${seats.activeTeachers}/${seats.teacherSeatLimit}`} />
          <MetricTile label="Students" value={`${seats.activeStudents}/${seats.studentSeatLimit}`} />
        </div>
        <InviteForm
          endpoint={`/api/admin/schools/${school.id}/school-admin-invites`}
          label="Invite first admin"
        />
        <DataList title="Pending school invites">
          {invites.length === 0 ? <EmptyState>No pending invites.</EmptyState> : null}
          {invites.map((invite) => (
            <DataRow
              actions={
                <RowActionButton
                  body={{ schoolId: school.id }}
                  icon="trash"
                  url={`/api/school/invites/${invite.id}/delete`}
                >
                  Revoke
                </RowActionButton>
              }
              key={invite.id}
            >
              <p className="font-medium">{invite.email}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {invite.role} / expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
              <StatusBadge>{invite.status}</StatusBadge>
            </DataRow>
          ))}
        </DataList>
        <DataList title="Audit events">
          {auditEvents.length === 0 ? <EmptyState>No audit events.</EmptyState> : null}
          {auditEvents.map((event) => (
            <DataRow key={event.id}>
              <p className="font-medium">{event.event_type}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {new Date(event.created_at).toLocaleString()} / {event.target_type}
              </p>
            </DataRow>
          ))}
        </DataList>
      </ClassroomShell>
    </>
  )
}
