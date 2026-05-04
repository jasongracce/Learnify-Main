import Link from "next/link"
import { Lightbulb, Target } from "lucide-react"
import {
  physicsFoundationsCourse,
  physicsSkills,
  type Locale,
} from "@learnify/shared"
import {
  generateRuleBasedLumiInsight,
  recommendNextLesson,
  selectLocalizedText,
} from "@learnify/core"
import { copy } from "@/lib/copy"

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params
  const t = copy[locale].dashboard
  const lessons = physicsFoundationsCourse.modules.flatMap(
    (module) => module.lessons
  )
  const nextLesson = recommendNextLesson({
    lessons,
    completedLessonSlugs: [],
    currentLessonSlug: "gravity-and-falling-objects",
  })
  const weakSkill = physicsSkills[0]
  const insight = generateRuleBasedLumiInsight({
    locale,
    mastery: [
      {
        skillId: weakSkill.id,
        masteryScore: 25,
        confidenceLevel: "low",
        attempts: 1,
        correctAttempts: 0,
      },
    ],
    nextLessonTitle: {
      en: nextLesson?.title_en ?? "Gravity and Falling Objects",
      th: nextLesson?.title_th,
    },
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
            <span className="px-3 py-2">Lumi</span>
            <span className="px-3 py-2">Insights</span>
          </nav>
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
              {nextLesson ? (
                <>
                  <h2 className="mt-3 font-semibold">
                    {selectLocalizedText(
                      { en: nextLesson.title_en, th: nextLesson.title_th },
                      locale
                    )}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {selectLocalizedText(
                      { en: nextLesson.summary_en, th: nextLesson.summary_th },
                      locale
                    )}
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white"
                    href={`/${locale}/app/lessons/${nextLesson.slug}`}
                  >
                    {copy[locale].courses.start}
                  </Link>
                </>
              ) : null}
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb aria-hidden="true" size={16} />
                {t.insight}
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {insight}
              </p>
              <p className="mt-4 text-sm font-medium">{t.weakSkill}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {selectLocalizedText(
                  { en: weakSkill.title_en, th: weakSkill.title_th },
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
