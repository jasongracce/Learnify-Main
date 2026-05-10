"use client"

import { LogOut } from "lucide-react"
import type { Locale } from "@learnify/shared"

type LogoutButtonProps = {
  locale: Locale
}

export function LogoutButton({ locale }: LogoutButtonProps) {
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
      className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text)]"
      onClick={handleLogout}
      type="button"
    >
      <LogOut aria-hidden="true" size={16} />
      Log out
    </button>
  )
}
