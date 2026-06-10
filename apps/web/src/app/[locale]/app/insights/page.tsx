import {
  ArrowRight,
  Brain,
  Flame,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react"
import type { Locale } from "@learnify/shared"
import { physicsFoundationsCourse } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { AppNav } from "@/components/app-nav"
import { SkillMasteryList } from "@/components/skill-mastery-list"
import { ConfidenceBadge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { Card, CardHeader, CardSection } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { ProgressBar } from "@/components/ui/progress"
import { StatCard } from "@/components/ui/stat"
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
  const dashboardCopy = copy[locale].dashboard
  const confidenceLabels = copy[locale].common.confidence
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
  const hasPractice = dashboard.recentPractice.total > 0
  const lessons = physicsFoundationsCourse.modules.flatMap(
    (module) => module.lessons
  )
  const skillItems = dashboard.skillMastery.map((item) => {
    const practiceLesson = lessons.find((lesson) =>
      lesson.skill_ids.includes(item.skill.id)
    )

    return {
      id: item.skill.id,
      title: selectLocalizedText(
        {
          en: item.skill.title_en,
          th: item.skill.title_th,
        },
        locale
      ),
      masteryScore: item.masteryScore,
      confidenceLevel: item.confidenceLevel,
      href: practiceLesson
        ? `/${locale}/app/lessons/${practiceLesson.slug}`
        : undefined,
    }
  })

  return (
    <>
      <AppNav active="insights" locale={locale} />
      <main className="learnify-container py-6 md:py-10">
        <PageHeader subtitle={t.body} title={t.title} />

        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_352px]">
            <Card className="animate-fade-in-up">
              <CardSection className="flex h-full flex-col gap-4 p-6 md:p-8">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                  <Lightbulb aria-hidden="true" size={16} />
                  {t.lumiInsight}
                </div>
                <p className="max-w-3xl text-lg leading-8">
                  {dashboard.insight}
                </p>
                <div className="mt-auto border-t border-[var(--border)] pt-5">
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {t.recommendedAction}
                  </p>
                  <ButtonLink
                    className="mt-3"
                    href={`/${locale}/app/lessons/${dashboard.nextLesson.slug}`}
                  >
                    {nextLessonTitle}
                    <ArrowRight aria-hidden="true" size={16} />
                  </ButtonLink>
                </div>
              </CardSection>
            </Card>

            <Card className="animate-fade-in-up animation-delay-100">
              <CardHeader
                icon={<Target aria-hidden="true" size={16} />}
                title={t.skillToReview}
              />
              <CardSection>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{weakSkillTitle}</p>
                  <ConfidenceBadge
                    label={confidenceLabels[dashboard.weakSkillConfidence]}
                    level={dashboard.weakSkillConfidence}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {selectLocalizedText(
                    {
                      en: dashboard.weakSkill.description_en,
                      th: dashboard.weakSkill.description_th,
                    },
                    locale
                  )}
                </p>
                <ProgressBar
                  className="mt-4"
                  percent={dashboard.weakSkillMastery}
                  value={`${dashboard.weakSkillMastery}%`}
                />
                {dashboard.weakSkillLessonSlug && (
                  <ButtonLink
                    className="mt-4 w-full"
                    href={`/${locale}/app/lessons/${dashboard.weakSkillLessonSlug}`}
                    variant="secondary"
                  >
                    {dashboardCopy.labels.review}
                    <ArrowRight aria-hidden="true" size={16} />
                  </ButtonLink>
                )}
              </CardSection>
            </Card>
          </div>

          <div className="grid gap-4 animate-fade-in-up animation-delay-200 md:grid-cols-2">
            {hasPractice ? (
              <StatCard
                detail={t.recentPracticeBody}
                icon={<TrendingUp aria-hidden="true" size={16} />}
                label={t.recentPractice}
                value={`${dashboard.recentPractice.correct}/${dashboard.recentPractice.total}`}
              />
            ) : (
              <EmptyState
                body={t.noPractice}
                icon={<TrendingUp aria-hidden="true" size={20} />}
                title={t.recentPractice}
              />
            )}
            <StatCard
              detail={
                dashboard.streakDays > 0
                  ? dashboardCopy.labels.streakUnit(dashboard.streakDays)
                  : dashboardCopy.labels.zeroStreak
              }
              icon={<Flame aria-hidden="true" size={16} />}
              label={dashboardCopy.labels.practiceStreak}
              value={dashboard.streakDays > 0 ? `${dashboard.streakDays}` : "—"}
            />
          </div>

          <Card className="animate-fade-in-up animation-delay-300">
            <CardHeader
              icon={<Brain aria-hidden="true" size={16} />}
              title={dashboardCopy.labels.skillMastery}
            />
            <div className="mt-2">
              <SkillMasteryList
                confidenceLabels={confidenceLabels}
                items={skillItems}
                practiceLabel={dashboardCopy.labels.practice}
              />
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
