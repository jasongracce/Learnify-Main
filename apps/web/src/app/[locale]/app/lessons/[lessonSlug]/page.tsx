import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getPhysicsLesson,
  physicsQuestions,
  type Locale,
} from "@learnify/shared"
import { selectLocalizedText } from "@learnify/core"
import {
  getCompletedLessonBlockSlugsForUser,
  getRecentLumiMessagesForUser,
} from "@learnify/database"
import { LessonRenderer } from "@/components/lesson/lesson-renderer"
import { LumiChat } from "@/components/lumi-chat"
import { requireBetaUser } from "@/lib/auth/protected"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { copy } from "@/lib/copy"

type LessonPageProps = {
  params: Promise<{ locale: Locale; lessonSlug: string }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { locale, lessonSlug } = await params
  const user = await requireBetaUser(locale)

  const lesson = getPhysicsLesson(lessonSlug)

  if (!lesson) {
    notFound()
  }

  const completedBlockIds = await getCompletedBlockIds({
    lessonSlug,
    userId: user.id,
  })
  const lumiHistory = await getLumiHistory({
    lessonSlug,
    userId: user.id,
  })
  const completedCount = completedBlockIds.length
  const totalCount = lesson.blocks.length

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
        <p className="mt-2 text-sm text-[var(--muted)]">
          {locale === "th"
            ? `บันทึกแล้ว ${completedCount}/${totalCount} บล็อก`
            : `${completedCount}/${totalCount} blocks saved`}
        </p>
      </div>
      <div className="mb-6 max-w-3xl">
        <LumiChat
          bodyOverride={copy[locale].lesson.askLumiBody}
          currentLessonSlug={lesson.slug}
          initialConversationId={lumiHistory.conversationId}
          initialMessages={lumiHistory.messages}
          locale={locale}
          titleOverride={copy[locale].lesson.askLumi}
          variant="compact"
        />
      </div>
      <LessonRenderer
        blocks={lesson.blocks}
        initialCompletedBlockIds={completedBlockIds}
        lessonSlug={lesson.slug}
        locale={locale}
        questions={physicsQuestions}
      />
    </main>
  )
}

async function getCompletedBlockIds(input: {
  userId: string
  lessonSlug: string
}) {
  try {
    const supabase = await createSupabaseServerClient()

    return getCompletedLessonBlockSlugsForUser({
      supabase,
      userId: input.userId,
      lessonSlug: input.lessonSlug,
    })
  } catch {
    return []
  }
}

async function getLumiHistory(input: { userId: string; lessonSlug: string }) {
  try {
    const supabase = await createSupabaseServerClient()

    return getRecentLumiMessagesForUser({
      supabase,
      userId: input.userId,
      currentLessonSlug: input.lessonSlug,
      limit: 12,
    })
  } catch {
    return {
      conversationId: null,
      messages: [],
    }
  }
}
