import Link from "next/link"
import type { Locale } from "@learnify/shared"
import { AuthForm } from "@/components/auth-form"
import { copy } from "@/lib/copy"
import { marketingSiteUrl } from "@/lib/site"

type LoginPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params
  const t = copy[locale].auth

  return (
    <main className="learnify-container py-10">
      <div className="max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <h1 className="text-2xl font-semibold">{t.loginTitle}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{t.body}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {t.source}
        </p>
        <AuthForm locale={locale} mode="login" />
        <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--border)] pt-5 text-sm">
          <Link
            className="font-medium text-[var(--brand-strong)]"
            href={`/${locale}/waitlist`}
          >
            {t.waitlist}
          </Link>
          <a className="text-[var(--muted)]" href={marketingSiteUrl}>
            learnify.academy
          </a>
        </div>
      </div>
    </main>
  )
}
