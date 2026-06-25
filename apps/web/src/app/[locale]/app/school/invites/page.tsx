import {
  getSchoolAdminNotificationSummary,
  getSchoolById,
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
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { getPreferredSchoolMembership } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale }> }

export default async function SchoolInvitesPage({ params }: Props) {
  const { locale } = await params
  const { membership, serviceSupabase } = await getPreferredSchoolMembership({
    locale,
    roles: ["school_admin"],
  })
  const [school, invites, summary] = await Promise.all([
    getSchoolById({ supabase: serviceSupabase, schoolId: membership.school_id }),
    listPendingSchoolInvites({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
    }),
    getSchoolAdminNotificationSummary({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
    }),
  ])
  const schoolBadge = summary.pendingCapacityMemberships + summary.pendingInvites

  return (
    <>
      <AppNav
        active="schoolInvites"
        locale={locale}
        schoolBadge={schoolBadge}
        showSchool
      />
      <ClassroomShell
        eyebrow="School admin"
        tabs={[
          { href: `/${locale}/app/school`, label: "Overview" },
          { href: `/${locale}/app/school/users`, label: "Users" },
          {
            href: `/${locale}/app/school/invites`,
            label: "Invites",
            active: true,
            badge: invites.length,
          },
        ]}
        title={`${school?.name ?? "School"} invites`}
      >
        <InviteForm
          endpoint="/api/school/invites/admin"
          label="Invite admin"
          schoolId={membership.school_id}
        />
        <InviteForm
          endpoint="/api/school/invites/teacher"
          label="Invite teacher"
          schoolId={membership.school_id}
        />
        <DataList title="Pending invites">
          {invites.length === 0 ? <EmptyState>No pending invites.</EmptyState> : null}
          {invites.map((invite) => (
            <DataRow
              actions={
                <RowActionButton
                  body={{ schoolId: membership.school_id }}
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
      </ClassroomShell>
    </>
  )
}
