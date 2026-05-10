import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Locale } from "@learnify/shared"
import { getRecentLumiMessagesForUser } from "@learnify/database"
import { requireBetaUser } from "@/lib/auth/protected"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { LumiChat } from "@/components/lumi-chat"
import { copy } from "@/lib/copy"

type LumiPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function LumiPage({ params }: LumiPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)
  const history = await getLumiHistory(user.id)

  return (
    <main className="learnify-container py-8">
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)]"
        href={`/${locale}/app/dashboard`}
      >
        <ArrowLeft aria-hidden="true" size={16} />
        {copy[locale].nav.dashboard}
      </Link>
      <LumiChat
        initialConversationId={history.conversationId}
        initialMessages={history.messages}
        locale={locale}
      />
    </main>
  )
}

async function getLumiHistory(userId: string) {
  try {
    const supabase = await createSupabaseServerClient()

    return getRecentLumiMessagesForUser({
      supabase,
      userId,
      limit: 20,
    })
  } catch {
    return {
      conversationId: null,
      messages: [],
    }
  }
}
