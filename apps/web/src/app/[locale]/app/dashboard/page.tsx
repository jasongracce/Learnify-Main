import Link from "next/link"
import { Lightbulb, Target } from "lucide-react"
import type { Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { requireBetaUser } from "@/lib/auth/protected"
import { LogoutButton } from "@/components/logout-button"
import { getStudentDashboardData } from "@/lib/dashboard-data"
import { copy } from "@/lib/copy"

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)

  const t = copy[locale].dashboard
  const dashboard = await getStudentDashboardData({
    userId: user.id,
    locale,
  })

  return (
    <main className="learnify-container py-8">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="learnify-wordmark text-sm">LEARNIFY</p>
          <nav className="mt-6 grid gap-1 text-sm text-[var(--muted)]">
            <span className="rounded-[var(--radius)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--text)]">
              {t.title}
            </span>
            <Link className="px-3 py-2" href={`/${locale}/app/courses`}>
              {copy[locale].nav.courses}
            </Link>
            <Link className="px-3 py-2" href={`/${locale}/app/lumi`}>
              Lumi
            </Link>
            <Link className="px-3 py-2" href={`/${locale}/app/insights`}>
              {copy[locale].insights.title}
            </Link>
          </nav>
          <LogoutButton locale={locale} />
        </aside>
        <section className="grid gap-4">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
              {t.body}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target aria-hidden="true" size={16} />
                {t.continueLearning}
              </div>
              <h2 className="mt-3 font-semibold">
                {selectLocalizedText(
                  {
                    en: dashboard.nextLesson.title_en,
                    th: dashboard.nextLesson.title_th,
                  },
                  locale
                )}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {selectLocalizedText(
                  {
                    en: dashboard.nextLesson.summary_en,
                    th: dashboard.nextLesson.summary_th,
                  },
                  locale
                )}
              </p>
              <Link
                className="mt-4 inline-flex rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white"
                href={`/${locale}/app/lessons/${dashboard.nextLesson.slug}`}
              >
                {copy[locale].courses.start}
              </Link>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb aria-hidden="true" size={16} />
                {t.insight}
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {dashboard.insight}
              </p>
              <p className="mt-4 text-sm font-medium">{t.recentPractice}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {dashboard.recentPractice.total > 0
                  ? `${dashboard.recentPractice.correct}/${dashboard.recentPractice.total}`
                  : locale === "th"
                    ? "ยังไม่มีคำตอบที่บันทึกไว้"
                    : "No saved answers yet"}
              </p>
              <p className="mt-4 text-sm font-medium">{t.weakSkill}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {selectLocalizedText(
                  {
                    en: dashboard.weakSkill.title_en,
                    th: dashboard.weakSkill.title_th,
                  },
                  locale
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
