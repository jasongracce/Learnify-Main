import Link from "next/link"
import { ArrowRight, Lightbulb, Target, TrendingUp } from "lucide-react"
import type { Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { requireBetaUser } from "@/lib/auth/protected"
import { getStudentDashboardData } from "@/lib/dashboard-data"
import { copy } from "@/lib/copy"

type InsightsPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)
  const t = copy[locale].insights
  const dashboard = await getStudentDashboardData({
    userId: user.id,
    locale,
  })
  const nextLessonTitle = selectLocalizedText(
    {
      en: dashboard.nextLesson.title_en,
      th: dashboard.nextLesson.title_th,
    },
    locale
  )
  const weakSkillTitle = selectLocalizedText(
    {
      en: dashboard.weakSkill.title_en,
      th: dashboard.weakSkill.title_th,
    },
    locale
  )

  return (
    <main className="learnify-container py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
            {t.body}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium"
          href={`/${locale}/app/dashboard`}
        >
          {copy[locale].nav.dashboard}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb aria-hidden="true" size={16} />
            {t.lumiInsight}
          </div>
          <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
            {dashboard.insight}
          </p>
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <p className="text-sm font-medium">{t.recommendedAction}</p>
            <Link
              className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white"
              href={`/${locale}/app/lessons/${dashboard.nextLesson.slug}`}
            >
              {nextLessonTitle}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp aria-hidden="true" size={16} />
              {t.recentPractice}
            </div>
            <p className="mt-3 text-2xl font-semibold">
              {dashboard.recentPractice.correct}/
              {dashboard.recentPractice.total}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {dashboard.recentPractice.total > 0
                ? t.recentPracticeBody
                : t.noPractice}
            </p>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target aria-hidden="true" size={16} />
              {t.skillToReview}
            </div>
            <p className="mt-3 font-semibold">{weakSkillTitle}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {selectLocalizedText(
                {
                  en: dashboard.weakSkill.description_en,
                  th: dashboard.weakSkill.description_th,
                },
                locale
              )}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
