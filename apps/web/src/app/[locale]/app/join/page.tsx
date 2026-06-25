import { listOpenJoinRequestsForStudent } from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { JoinByCodeForm, RowActionButton } from "@/components/classroom/classroom-forms"
import {
  ClassroomShell,
  DataList,
  DataRow,
  EmptyState,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { requireSchoolPageUser } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale }> }

export default async function JoinPage({ params }: Props) {
  const { locale } = await params
  const { serviceSupabase, user } = await requireSchoolPageUser(locale)
  const requests = await listOpenJoinRequestsForStudent({
    supabase: serviceSupabase,
    studentUserId: user.id,
  })

  return (
    <>
      <AppNav active="dashboard" locale={locale} />
      <ClassroomShell eyebrow="Student join" title="Join a classroom">
        <JoinByCodeForm />
        <DataList title="Pending join requests">
          {requests.length === 0 ? (
            <EmptyState>No pending join requests.</EmptyState>
          ) : null}
          {requests.map((request) => (
            <DataRow
              actions={
                <RowActionButton
                  icon="x"
                  url={`/api/classrooms/join-requests/${request.id}/cancel`}
                >
                  Cancel
                </RowActionButton>
              }
              key={request.id}
            >
              <p className="font-medium">{request.email ?? user.email}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {request.source} / requested {new Date(request.requested_at).toLocaleDateString()}
              </p>
              <StatusBadge>{request.status}</StatusBadge>
            </DataRow>
          ))}
        </DataList>
      </ClassroomShell>
    </>
  )
}
