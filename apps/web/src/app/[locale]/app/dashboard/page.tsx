import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Lightbulb,
  Target,
} from "lucide-react"
import type { Locale } from "@learnify/shared"
import { physicsFoundationsCourse } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { AppNav } from "@/components/app-nav"
import { SkillMasteryList } from "@/components/skill-mastery-list"
import { ConfidenceBadge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { Card, CardHeader, CardSection } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { ProgressBar } from "@/components/ui/progress"
import { StatCard } from "@/components/ui/stat"
import { requireBetaUser } from "@/lib/auth/protected"
import { getStudentDashboardData } from "@/lib/dashboard-data"
import { copy } from "@/lib/copy"

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)
  const t = copy[locale].dashboard
  const labels = t.labels
  const confidenceLabels = copy[locale].common.confidence
  const dashboard = await getStudentDashboardData({
    userId: user.id,
    locale,
  })
  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    ""
  const nextLessonTitle = selectLocalizedText(
    {
      en: dashboard.nextLesson.title_en,
      th: dashboard.nextLesson.title_th,
    },
    locale
  )
  const moduleTitle = selectLocalizedText(
    {
      en: dashboard.currentModule.title_en,
      th: dashboard.currentModule.title_th,
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
  const weakSkillDescription = selectLocalizedText(
    {
      en: dashboard.weakSkill.description_en,
      th: dashboard.weakSkill.description_th,
    },
    locale
  )
  const hasPractice = dashboard.recentPractice.total > 0
  const recentScore = hasPractice
    ? Math.round(
        (dashboard.recentPractice.correct / dashboard.recentPractice.total) *
          100
      )
    : 0
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
      <AppNav active="dashboard" locale={locale} />
      <main className="learnify-container py-6 md:py-10">
        <PageHeader
          subtitle={t.body}
          title={displayName ? `${t.greeting}, ${displayName}` : t.greeting}
        />

        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_352px]">
            <Card className="animate-fade-in-up">
              <CardSection className="flex h-full flex-col gap-5 p-6 md:p-8">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
                  <Target aria-hidden="true" size={16} />
                  {t.continueLearning}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {nextLessonTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    {selectLocalizedText(
                      {
                        en: dashboard.nextLesson.summary_en,
                        th: dashboard.nextLesson.summary_th,
                      },
                      locale
                    )}
                  </p>
                </div>
                <ProgressBar
                  label={moduleTitle}
                  percent={dashboard.currentModule.percent}
                  value={`${dashboard.currentModule.percent}%`}
                />
                <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Clock3 aria-hidden="true" size={16} />
                    {dashboard.nextLesson.estimated_minutes} {labels.minutes}
                  </div>
                  <ButtonLink
                    href={`/${locale}/app/lessons/${dashboard.nextLesson.slug}`}
                  >
                    {copy[locale].courses.start}
                    <ArrowRight aria-hidden="true" size={16} />
                  </ButtonLink>
                </div>
              </CardSection>
            </Card>

            <Card className="animate-fade-in-up animation-delay-100">
              <CardHeader
                icon={<Lightbulb aria-hidden="true" size={16} />}
                title={t.insight}
              />
              <CardSection>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {dashboard.insight}
                </p>

                <div className="mt-5 border-t border-[var(--border)] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{t.weakSkill}</p>
                    <ConfidenceBadge
                      label={confidenceLabels[dashboard.weakSkillConfidence]}
                      level={dashboard.weakSkillConfidence}
                    />
                  </div>
                  <p className="mt-2 font-semibold">{weakSkillTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {weakSkillDescription}
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
                      {labels.review}
                      <ArrowRight aria-hidden="true" size={16} />
                    </ButtonLink>
                  )}
                </div>
              </CardSection>
            </Card>
          </div>

          <div className="grid gap-4 animate-fade-in-up animation-delay-200 md:grid-cols-3">
            <StatCard
              detail={
                dashboard.courseProgress.percent > 0
                  ? `${dashboard.courseProgress.completedLessons}/${dashboard.courseProgress.totalLessons} ${labels.lessonsDone}`
                  : labels.zeroProgress
              }
              icon={<BookOpen aria-hidden="true" size={16} />}
              label={labels.courseProgress}
              value={`${dashboard.courseProgress.percent}%`}
            />
            <StatCard
              detail={
                hasPractice
                  ? `${dashboard.recentPractice.correct}/${dashboard.recentPractice.total} ${t.recentPractice}`
                  : labels.zeroScore
              }
              icon={<CheckCircle2 aria-hidden="true" size={16} />}
              label={labels.recentScore}
              value={hasPractice ? `${recentScore}%` : "—"}
            />
            <StatCard
              detail={
                dashboard.streakDays > 0
                  ? labels.streakUnit(dashboard.streakDays)
                  : labels.zeroStreak
              }
              icon={<Flame aria-hidden="true" size={16} />}
              label={labels.practiceStreak}
              value={
                dashboard.streakDays > 0 ? `${dashboard.streakDays}` : "—"
              }
            />
          </div>

          <Card className="animate-fade-in-up animation-delay-300">
            <CardHeader
              icon={<Brain aria-hidden="true" size={16} />}
              title={labels.skillMastery}
            />
            <div className="mt-2">
              <SkillMasteryList
                confidenceLabels={confidenceLabels}
                items={skillItems}
                practiceLabel={labels.practice}
              />
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
