import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { StudentInviteTokenForm, TokenJoinForm } from "@/components/classroom/classroom-forms"
import { ClassroomShell } from "@/components/classroom/classroom-ui"
import { requireSchoolPageUser } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale; joinToken: string }> }

export default async function JoinTokenPage({ params }: Props) {
  const { locale, joinToken } = await params
  await requireSchoolPageUser(locale)

  return (
    <>
      <AppNav active="classrooms" locale={locale} showClassrooms />
      <ClassroomShell eyebrow="Student join" title="Classroom join link">
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Use the first action for QR/class links. Use the second action if this link came from an email invite. Exact-email mismatches, expired invites, and already-pending states are returned by the classroom API.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <TokenJoinForm joinToken={joinToken} />
          <StudentInviteTokenForm token={joinToken} />
        </div>
      </ClassroomShell>
    </>
  )
}
