import Link from "next/link"
import { Building2 } from "lucide-react"
import { listSchools } from "@learnify/database"
import type { Locale } from "@learnify/shared"
import { AppNav } from "@/components/app-nav"
import { CreateSchoolForm } from "@/components/classroom/classroom-forms"
import {
  ClassroomShell,
  DataList,
  DataRow,
  EmptyState,
  StatusBadge,
} from "@/components/classroom/classroom-ui"
import { requireLearnifyAdminPage } from "@/lib/auth/school-pages"

type Props = { params: Promise<{ locale: Locale }> }

export default async function AdminSchoolsPage({ params }: Props) {
  const { locale } = await params
  const { serviceSupabase } = await requireLearnifyAdminPage(locale)
  const schools = await listSchools({ supabase: serviceSupabase })

  return (
    <>
      <AppNav active="adminSchools" locale={locale} showAdmin />
      <ClassroomShell eyebrow="Learnify admin" title="Schools">
        <CreateSchoolForm />
        <DataList title="School contracts">
          {schools.length === 0 ? <EmptyState>No schools yet.</EmptyState> : null}
          {schools.map((school) => (
            <DataRow
              actions={
                <Link
                  className="rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-sm font-medium text-white"
                  href={`/${locale}/app/admin/schools/${school.slug}`}
                >
                  Open
                </Link>
              }
              key={school.id}
            >
              <div className="flex items-start gap-3">
                <Building2 className="mt-1 text-[var(--muted)]" size={16} />
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {school.slug} / {school.teacher_seat_limit} teachers /{" "}
                    {school.student_seat_limit} students
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <StatusBadge>{school.subscription_status}</StatusBadge>
              </div>
            </DataRow>
          ))}
        </DataList>
      </ClassroomShell>
    </>
  )
}
