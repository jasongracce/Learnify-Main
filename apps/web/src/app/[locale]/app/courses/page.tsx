import Link from "next/link"
import { ArrowRight, BookOpen, Check, Clock3 } from "lucide-react"
import { physicsFoundationsCourse, type Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import {
  getLessonProgressForUser,
  type LessonProgressSummary,
} from "@learnify/database"
import { AppNav } from "@/components/app-nav"
import { Card, CardSection } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { ProgressBar } from "@/components/ui/progress"
import { requireBetaUser } from "@/lib/auth/protected"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { copy } from "@/lib/copy"

type CoursesPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)

  const t = copy[locale].courses
  const course = physicsFoundationsCourse
  const progress = await getProgress(user.id)
  const progressByLessonSlug = new Map(
    progress.map((item) => [item.lessonSlug, item])
  )
  const lessons = course.modules.flatMap((module) => module.lessons)
  const coursePercent =
    lessons.length > 0
      ? Math.round(
          lessons.reduce(
            (sum, lesson) =>
              sum +
              (progressByLessonSlug.get(lesson.slug)?.progressPercent ?? 0),
            0
          ) / lessons.length
        )
      : 0

  return (
    <>
      <AppNav active="courses" locale={locale} />
      <main className="learnify-container py-6 md:py-10">
        <PageHeader subtitle={t.body} title={t.title} />

        <Card className="animate-fade-in-up">
          <CardSection className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--surface)]">
                <BookOpen aria-hidden="true" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  {selectLocalizedText(
                    { en: course.title_en, th: course.title_th },
                    locale
                  )}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  {selectLocalizedText(
                    { en: course.description_en, th: course.description_th },
                    locale
                  )}
                </p>
              </div>
            </div>
            <ProgressBar
              className="mt-5"
              percent={coursePercent}
              value={`${coursePercent}%`}
            />
          </CardSection>

          {course.modules.map((module) => (
            <div
              className="border-t border-[var(--border)] px-6 py-5 md:px-8"
              key={module.id}
            >
              <p className="text-sm font-medium text-[var(--muted)]">
                {t.module}:{" "}
                {selectLocalizedText(
                  { en: module.title_en, th: module.title_th },
                  locale
                )}
              </p>
              <div className="mt-4 grid gap-2.5">
                {module.lessons.map((lesson, index) => {
                  const lessonProgress = progressByLessonSlug.get(lesson.slug)
                  const isCompleted =
                    lessonProgress?.status === "completed" &&
                    lessonProgress.progressPercent === 100
                  const isInProgress =
                    !isCompleted && (lessonProgress?.progressPercent ?? 0) > 0

                  return (
                    <Link
                      className="group flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] px-4 py-3.5 transition-all hover:border-[var(--muted-soft)] hover:shadow-[var(--shadow-card)]"
                      href={`/${locale}/app/lessons/${lesson.slug}`}
                      key={lesson.id}
                    >
                      <span
                        className={
                          isCompleted
                            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"
                            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-medium"
                        }
                      >
                        {isCompleted ? (
                          <Check aria-hidden="true" size={15} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {selectLocalizedText(
                            { en: lesson.title_en, th: lesson.title_th },
                            locale
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                          <Clock3 aria-hidden="true" size={12} />
                          {lesson.estimated_minutes}{" "}
                          {copy[locale].lesson.minutes}
                          {isInProgress
                            ? ` · ${lessonProgress?.progressPercent ?? 0}%`
                            : ""}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="shrink-0 text-[var(--muted-soft)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--text)]"
                        size={16}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
      </main>
    </>
  )
}

async function getProgress(userId: string): Promise<LessonProgressSummary[]> {
  try {
    const supabase = await createSupabaseServerClient()

    return await getLessonProgressForUser({
      supabase,
      userId,
    })
  } catch {
    return []
  }
}
