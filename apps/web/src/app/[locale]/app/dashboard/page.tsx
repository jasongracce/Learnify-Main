import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  BookOpen,
  Brain,
  ClipboardList,
  CheckCircle2,
  Clock3,
  Flame,
  Lightbulb,
  Target,
} from "lucide-react"
import type { Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import {
  createSupabaseServiceClientFromEnv,
  listStudentAssignments,
} from "@learnify/database"
import { AppNav } from "@/components/app-nav"
import { requireBetaUser } from "@/lib/auth/protected"
import { getStudentDashboardData } from "@/lib/dashboard-data"
import { copy } from "@/lib/copy"
import { requireSupabaseServiceEnv } from "@/lib/env"

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>
}

const dashboardLabels = {
  en: {
    confidence: "Confidence",
    assignments: "Assignments",
    courseProgress: "Course progress",
    currentModule: "Motion, Gravity, and Forces",
    lessonsDone: "Lessons done",
    mastery: "Mastery",
    minutes: "Minutes",
    practiceStreak: "Practice streak",
    recentScore: "Recent score",
    review: "Review",
    skillMastery: "Skill mastery",
    sourceFallback: "Showing seeded course data",
    sourceLive: "Synced with saved progress",
    weakArea: "Weak area",
  },
  th: {
    confidence: "Confidence",
    assignments: "Assignments",
    courseProgress: "Course progress",
    currentModule: "Motion, Gravity, and Forces",
    lessonsDone: "Lessons done",
    mastery: "Mastery",
    minutes: "Minutes",
    practiceStreak: "Practice streak",
    recentScore: "Recent score",
    review: "Review",
    skillMastery: "Skill mastery",
    sourceFallback: "Showing seeded course data",
    sourceLive: "Synced with saved progress",
    weakArea: "Weak area",
  },
} satisfies Record<Locale, Record<string, string>>

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)
  const t = copy[locale].dashboard
  const labels = dashboardLabels[locale]
  const dashboard = await getStudentDashboardData({
    userId: user.id,
    locale,
  })
  const assignmentCount = await getAssignmentCount(user.id)
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
  const weakSkillDescription = selectLocalizedText(
    {
      en: dashboard.weakSkill.description_en,
      th: dashboard.weakSkill.description_th,
    },
    locale
  )
  const recentScore =
    dashboard.recentPractice.total > 0
      ? Math.round(
          (dashboard.recentPractice.correct / dashboard.recentPractice.total) *
            100
        )
      : 0

  return (
    <>
      <AppNav active="dashboard" locale={locale} />
      <main className="learnify-container py-6 md:py-8">
        <section className="grid gap-5">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{t.title}</h1>
              <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
                {t.body}
              </p>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {dashboard.source === "live"
                ? labels.sourceLive
                : labels.sourceFallback}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_352px]">
            <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)]">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target aria-hidden="true" size={16} />
                  {t.continueLearning}
                </div>
                <h2 className="mt-3 text-xl font-semibold">
                  {nextLessonTitle}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  {selectLocalizedText(
                    {
                      en: dashboard.nextLesson.summary_en,
                      th: dashboard.nextLesson.summary_th,
                    },
                    locale
                  )}
                </p>
              </div>

              <div className="grid gap-0 md:grid-cols-3">
                <MetricCard
                  icon={<BookOpen aria-hidden="true" size={16} />}
                  label={labels.courseProgress}
                  value={`${dashboard.courseProgress.percent}%`}
                  detail={`${dashboard.courseProgress.completedLessons}/${dashboard.courseProgress.totalLessons} ${labels.lessonsDone}`}
                />
                <MetricCard
                  icon={<CheckCircle2 aria-hidden="true" size={16} />}
                  label={labels.recentScore}
                  value={
                    dashboard.recentPractice.total > 0
                      ? `${recentScore}%`
                      : "0%"
                  }
                  detail={
                    dashboard.recentPractice.total > 0
                      ? `${dashboard.recentPractice.correct}/${dashboard.recentPractice.total} ${t.recentPractice}`
                      : copy[locale].insights.noPractice
                  }
                />
                <MetricCard
                  icon={<Flame aria-hidden="true" size={16} />}
                  label={labels.practiceStreak}
                  value={`${dashboard.streakDays}`}
                  detail={dashboard.streakDays === 1 ? "day" : "days"}
                />
              </div>

              <div className="border-t border-[var(--border)] px-5 py-4">
                <Link
                  className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-sm transition-colors hover:border-[var(--brand)]"
                  href={`/${locale}/app/assignments`}
                >
                  <span className="inline-flex items-center gap-2 font-medium">
                    <ClipboardList aria-hidden="true" size={16} />
                    {labels.assignments}
                  </span>
                  <span className="text-[var(--muted)]">
                    {assignmentCount}
                  </span>
                </Link>
              </div>

              <div className="border-t border-[var(--border)] px-5 py-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">
                    {labels.currentModule}
                  </span>
                  <span className="font-medium">
                    {dashboard.courseProgress.percent}%
                  </span>
                </div>
                <ProgressBar value={dashboard.courseProgress.percent} />
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Clock3 aria-hidden="true" size={16} />
                  {dashboard.nextLesson.estimated_minutes} {labels.minutes}
                </div>
                <Link
                  className="inline-flex w-fit items-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-strong)]"
                  href={`/${locale}/app/lessons/${dashboard.nextLesson.slug}`}
                >
                  {copy[locale].courses.start}
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </section>

            <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb aria-hidden="true" size={16} />
                {t.insight}
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {dashboard.insight}
              </p>

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium">{labels.weakArea}</p>
                  <span className="text-sm text-[var(--muted)]">
                    {dashboard.weakSkillConfidence}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{weakSkillTitle}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {weakSkillDescription}
                </p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">
                      {labels.mastery}
                    </span>
                    <span className="font-medium">
                      {dashboard.weakSkillMastery}%
                    </span>
                  </div>
                  <ProgressBar value={dashboard.weakSkillMastery} />
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4 text-sm font-medium">
              <Brain aria-hidden="true" size={16} />
              {labels.skillMastery}
            </div>
            <div className="divide-y divide-[var(--border)]">
              {dashboard.skillMastery.map((item) => (
                <SkillMasteryRow
                  confidenceLabel={labels.confidence}
                  item={{
                    confidenceLevel: item.confidenceLevel,
                    masteryScore: item.masteryScore,
                    title: selectLocalizedText(
                      {
                        en: item.skill.title_en,
                        th: item.skill.title_th,
                      },
                      locale
                    ),
                  }}
                  key={item.skill.id}
                  masteryLabel={labels.mastery}
                  reviewLabel={labels.review}
                />
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  )
}

async function getAssignmentCount(userId: string) {
  try {
    const serviceSupabase = createSupabaseServiceClientFromEnv(
      requireSupabaseServiceEnv()
    )
    const assignments = await listStudentAssignments({
      supabase: serviceSupabase,
      studentUserId: userId,
    })

    return assignments.length
  } catch {
    return 0
  }
}

function MetricCard({
  detail,
  icon,
  label,
  value,
}: {
  detail: string
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="border-t border-[var(--border)] p-5 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  )
}

function SkillMasteryRow({
  confidenceLabel,
  item,
  masteryLabel,
  reviewLabel,
}: {
  confidenceLabel: string
  item: {
    confidenceLevel: "low" | "medium" | "high"
    masteryScore: number
    title: string
  }
  masteryLabel: string
  reviewLabel: string
}) {
  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_120px] md:items-center">
      <div>
        <p className="font-medium">{item.title}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {confidenceLabel}: {item.confidenceLevel}
        </p>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">{masteryLabel}</span>
          <span className="font-medium">{item.masteryScore}%</span>
        </div>
        <ProgressBar value={item.masteryScore} />
      </div>
      <p className="text-sm text-[var(--muted)] md:text-right">
        {item.confidenceLevel === "low" ? reviewLabel : item.confidenceLevel}
      </p>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div className="h-2 overflow-hidden rounded-[4px] bg-[var(--surface)]">
      <div
        className="h-full rounded-[4px] bg-[var(--brand)]"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  )
}
