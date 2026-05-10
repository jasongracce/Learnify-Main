import Link from "next/link"
import { BookOpen } from "lucide-react"
import { physicsFoundationsCourse, type Locale } from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { requireBetaUser } from "@/lib/auth/protected"
import { copy } from "@/lib/copy"

type CoursesPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { locale } = await params
  await requireBetaUser(locale)

  const t = copy[locale].courses
  const course = physicsFoundationsCourse

  return (
    <main className="learnify-container py-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-2 leading-7 text-[var(--muted)]">{t.body}</p>
      </div>
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
        <div className="flex items-start gap-3">
          <BookOpen
            aria-hidden="true"
            className="mt-1 text-[var(--brand)]"
            size={20}
          />
          <div>
            <h2 className="font-semibold">
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
        <div className="mt-5 border-t border-[var(--border)] pt-5">
          {course.modules.map((module) => (
            <div key={module.id}>
              <p className="text-sm font-medium">
                {t.module}:{" "}
                {selectLocalizedText(
                  { en: module.title_en, th: module.title_th },
                  locale
                )}
              </p>
              <div className="mt-3 grid gap-2">
                {module.lessons.map((lesson) => (
                  <Link
                    className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] px-3 py-3 text-sm transition-colors hover:border-[var(--brand)]"
                    href={`/${locale}/app/lessons/${lesson.slug}`}
                    key={lesson.id}
                  >
                    <span>
                      {selectLocalizedText(
                        { en: lesson.title_en, th: lesson.title_th },
                        locale
                      )}
                    </span>
                    <span className="text-[var(--muted)]">
                      {lesson.estimated_minutes} {copy[locale].lesson.minutes}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
