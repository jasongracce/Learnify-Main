import type { Locale } from "@learnify/shared"
import { copy } from "@/lib/copy"
import { WaitlistForm } from "@/components/waitlist-form"

type WaitlistPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function WaitlistPage({ params }: WaitlistPageProps) {
  const { locale } = await params
  const t = copy[locale].waitlist

  return (
    <main className="learnify-container py-10">
      <div className="max-w-xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{t.body}</p>
        <WaitlistForm locale={locale} />
      </div>
    </main>
  )
}
