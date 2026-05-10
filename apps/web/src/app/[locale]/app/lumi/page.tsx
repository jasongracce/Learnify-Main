import type { Locale } from "@learnify/shared"
import { getRecentLumiMessagesForUser } from "@learnify/database"
import { AppNav } from "@/components/app-nav"
import { requireBetaUser } from "@/lib/auth/protected"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { LumiChat } from "@/components/lumi-chat"

type LumiPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function LumiPage({ params }: LumiPageProps) {
  const { locale } = await params
  const user = await requireBetaUser(locale)
  const history = await getLumiHistory(user.id)

  return (
    <>
      <AppNav active="lumi" locale={locale} />
      <main className="learnify-container py-8">
        <LumiChat
          initialConversationId={history.conversationId}
          initialMessages={history.messages}
          locale={locale}
        />
      </main>
    </>
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
