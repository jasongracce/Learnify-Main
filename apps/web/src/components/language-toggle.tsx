"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Locale } from "@learnify/shared"
import { alternateLocale } from "@/lib/locales"
import { copy } from "@/lib/copy"

type LanguageToggleProps = {
  locale: Locale
  className?: string
}

export function LanguageToggle({ locale, className = "" }: LanguageToggleProps) {
  const pathname = usePathname()
  const nextLocale = alternateLocale(locale)
  const nextPath = pathname?.startsWith(`/${locale}`)
    ? pathname.replace(`/${locale}`, `/${nextLocale}`)
    : `/${nextLocale}`

  return (
    <Link
      className={`inline-flex items-center justify-center rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-[var(--muted-soft)] hover:text-[var(--text)] ${className}`}
      href={nextPath}
    >
      {copy[locale].nav.language}
    </Link>
  )
}
