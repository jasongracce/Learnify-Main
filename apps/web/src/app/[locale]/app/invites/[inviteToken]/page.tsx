import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { SchoolInviteTokenForm } from "@/components/classroom/classroom-forms"
import { ClassroomShell } from "@/components/classroom/classroom-ui"
import { requireSchoolPageUser } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale; inviteToken: string }> }

export default async function SchoolInvitePage({ params }: Props) {
  const { locale, inviteToken } = await params
  await requireSchoolPageUser(locale)

  return (
    <>
      <AppNav active="school" locale={locale} showSchool />
      <ClassroomShell eyebrow="School invite" title="Accept your school invite">
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Accept this invite while signed in with the exact email address that received it. Expired, revoked, and email mismatch states are checked before activation.
        </p>
        <SchoolInviteTokenForm token={inviteToken} />
      </ClassroomShell>
    </>
  )
}
