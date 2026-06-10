import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock3 } from "lucide-react"
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
import { AppNav } from "@/components/app-nav"
import { LessonRenderer } from "@/components/lesson/lesson-renderer"
import { LumiChat } from "@/components/lumi-chat"
import { ProgressBar } from "@/components/ui/progress"
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
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <>
      <AppNav active="lesson" locale={locale} />
      <div className="sticky top-14 z-30 border-b border-[var(--border)] bg-[color:rgba(249,249,247,0.92)] backdrop-blur">
        <div className="learnify-container flex items-center gap-4 py-2.5">
          <Link
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            href={`/${locale}/app/courses/physics-foundations`}
          >
            <ArrowLeft aria-hidden="true" size={15} />
            {copy[locale].lesson.backToCourse}
          </Link>
          <div className="min-w-0 flex-1">
            <ProgressBar percent={progressPercent} />
          </div>
          <span className="whitespace-nowrap text-sm text-[var(--muted)]">
            {copy[locale].lesson.blocksSaved(completedCount, totalCount)}
          </span>
        </div>
      </div>

      <main className="learnify-container py-8 md:py-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="max-w-3xl">
            <div className="mb-6 animate-fade-in-up">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {selectLocalizedText(
                  { en: lesson.title_en, th: lesson.title_th },
                  locale
                )}
              </h1>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                {selectLocalizedText(
                  { en: lesson.summary_en, th: lesson.summary_th },
                  locale
                )}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                <Clock3 aria-hidden="true" size={15} />
                {lesson.estimated_minutes} {copy[locale].lesson.minutes}
              </div>
            </div>

            <LessonRenderer
              blocks={lesson.blocks}
              initialCompletedBlockIds={completedBlockIds}
              lessonSlug={lesson.slug}
              locale={locale}
              questions={physicsQuestions}
            />
          </div>

          <aside className="xl:sticky xl:top-32">
            <details className="group xl:hidden" open={false}>
              <summary className="cursor-pointer list-none rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4 text-sm font-medium shadow-[var(--shadow-card)]">
                {copy[locale].lesson.askLumi}
              </summary>
              <div className="mt-3">
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
            </details>
            <div className="hidden xl:block">
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
          </aside>
        </div>
      </main>
    </>
  )
}

async function getCompletedBlockIds(input: {
  userId: string
  lessonSlug: string
}) {
  try {
    const supabase = await createSupabaseServerClient()

    return await getCompletedLessonBlockSlugsForUser({
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

    return await getRecentLumiMessagesForUser({
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
