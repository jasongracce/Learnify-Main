import {
  getSchoolAdminNotificationSummary,
  getSchoolById,
  listPendingSchoolInvites,
  listSchoolMemberships,
} from "@learnify/database"
import type {
  Locale,
  SchoolMembershipRole,
  SchoolMembershipStatus,
} from "@learnify/shared"
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

type Props = { params: Promise<{ locale: Locale }> }

const roleOrder: SchoolMembershipRole[] = ["school_admin", "teacher", "student"]
const statusOrder: SchoolMembershipStatus[] = [
  "active",
  "invited",
  "pending_capacity",
  "inactive",
  "removed",
]

export default async function SchoolUsersPage({ params }: Props) {
  const { locale } = await params
  const { membership, serviceSupabase } = await getPreferredSchoolMembership({
    locale,
    roles: ["school_admin"],
  })
  const [school, memberships, invites, summary] = await Promise.all([
    getSchoolById({ supabase: serviceSupabase, schoolId: membership.school_id }),
    listSchoolMemberships({
      supabase: serviceSupabase,
      schoolId: membership.school_id,
    }),
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
        active="schoolUsers"
        locale={locale}
        schoolBadge={schoolBadge}
        showSchool
      />
      <ClassroomShell
        eyebrow="School admin"
        tabs={[
          { href: `/${locale}/app/school`, label: "Overview" },
          { href: `/${locale}/app/school/users`, label: "Users", active: true },
          {
            href: `/${locale}/app/school/invites`,
            label: "Invites",
            badge: invites.length,
          },
        ]}
        title={`${school?.name ?? "School"} users`}
      >
        {roleOrder.map((role) => {
          const roleMembers = memberships.filter((item) => item.role === role)
          return (
            <DataList key={role} title={role.replace("_", " ")}>
              {roleMembers.length === 0 ? (
                <EmptyState>No {role} memberships.</EmptyState>
              ) : null}
              {statusOrder.flatMap((status) =>
                roleMembers
                  .filter((item) => item.status === status)
                  .map((item) => (
                    <DataRow
                      actions={
                        item.status === "inactive" ? (
                          <RowActionButton
                            body={{ schoolId: membership.school_id }}
                            url={`/api/school/memberships/${item.id}/reactivate`}
                          >
                            Reactivate
                          </RowActionButton>
                        ) : item.status === "active" ? (
                          <RowActionButton
                            body={{ schoolId: membership.school_id }}
                            icon="remove"
                            url={`/api/school/memberships/${item.id}/deactivate`}
                          >
                            Deactivate
                          </RowActionButton>
                        ) : null
                      }
                      key={item.id}
                    >
                      <p className="font-medium">{item.email_normalized}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {item.seat_consumed ? "Seat used" : "No seat"} / created{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      <StatusBadge>{item.status}</StatusBadge>
                    </DataRow>
                  ))
              )}
            </DataList>
          )
        })}
      </ClassroomShell>
    </>
  )
}
