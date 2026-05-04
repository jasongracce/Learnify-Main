import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Locale } from "@learnify/shared"
import { alternateLocale } from "@/lib/locales"
import { copy } from "@/lib/copy"
import { marketingSiteUrl } from "@/lib/site"

type TopNavProps = {
  locale: Locale
}

export function TopNav({ locale }: TopNavProps) {
  const t = copy[locale].nav
  const nextLocale = alternateLocale(locale)

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="learnify-container flex h-16 items-center justify-between">
        <a href={marketingSiteUrl} className="learnify-wordmark text-sm">
          LEARNIFY
        </a>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={`/${locale}/waitlist`}
            className="rounded-[var(--radius)] px-3 py-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            {t.waitlist}
          </Link>
          <Link
            href={`/${locale}/auth/login`}
            className="rounded-[var(--radius)] px-3 py-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
          >
            {t.login}
          </Link>
          <Link
            href={`/${locale}/app/courses`}
            className="hidden rounded-[var(--radius)] px-3 py-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)] sm:block"
          >
            {t.courses}
          </Link>
          <Link
            href={`/${nextLocale}`}
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-[var(--muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text)]"
          >
            {t.language}
          </Link>
          <Link
            href={`/${locale}/app/dashboard`}
            className="hidden items-center gap-2 rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-white transition-colors hover:bg-black sm:flex"
          >
            {t.dashboard}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </nav>
      </div>
    </header>
  )
}
