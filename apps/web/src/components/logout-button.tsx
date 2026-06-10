"use client"

import { LogOut } from "lucide-react"
import type { Locale } from "@learnify/shared"
import { copy } from "@/lib/copy"

type LogoutButtonProps = {
  locale: Locale
  className?: string
  hideLabelOnMobile?: boolean
}

export function LogoutButton({
  className = "",
  hideLabelOnMobile = false,
  locale,
}: LogoutButtonProps) {
  async function handleLogout() {
    const response = await fetch(`/api/auth/logout?locale=${locale}`, {
      method: "POST",
    })
    const result = (await response.json().catch(() => null)) as {
      redirectTo?: string
    } | null

    window.location.assign(result?.redirectTo ?? `/${locale}/auth/login`)
  }

  return (
    <button
      aria-label={copy[locale].nav.logout}
      className={`inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-[var(--muted-soft)] hover:text-[var(--text)] ${className}`}
      onClick={handleLogout}
      type="button"
    >
      <LogOut aria-hidden="true" size={16} />
      <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>
        {copy[locale].nav.logout}
      </span>
    </button>
  )
}
