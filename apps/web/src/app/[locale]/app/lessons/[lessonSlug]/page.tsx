import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getPhysicsLesson,
  physicsQuestions,
  type Locale,
} from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import { LessonRenderer } from "@/components/lesson/lesson-renderer"
import { copy } from "@/lib/copy"

type LessonPageProps = {
  params: Promise<{ locale: Locale; lessonSlug: string }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { locale, lessonSlug } = await params
  const lesson = getPhysicsLesson(lessonSlug)

  if (!lesson) {
    notFound()
  }

  return (
    <main className="learnify-container py-8">
      <Link
        className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        href={`/${locale}/app/courses/physics-foundations`}
      >
        {copy[locale].lesson.backToCourse}
      </Link>
      <div className="my-6 max-w-3xl">
        <h1 className="text-2xl font-semibold">
          {selectLocalizedText(
            { en: lesson.title_en, th: lesson.title_th },
            locale
          )}
        </h1>
        <p className="mt-2 leading-7 text-[var(--muted)]">
          {selectLocalizedText(
            { en: lesson.summary_en, th: lesson.summary_th },
            locale
          )}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {lesson.estimated_minutes} {copy[locale].lesson.minutes}
        </p>
      </div>
      <LessonRenderer
        blocks={lesson.blocks}
        locale={locale}
        questions={physicsQuestions}
      />
    </main>
  )
}
