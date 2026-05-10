import Link from "next/link"
import type { Locale } from "@learnify/shared"
import { LogoutButton } from "@/components/logout-button"
import { copy } from "@/lib/copy"

type AppNavProps = {
  locale: Locale
  active: "dashboard" | "courses" | "lumi" | "insights" | "lesson"
}

const navItems = [
  { key: "dashboard", href: "dashboard" },
  { key: "courses", href: "courses" },
  { key: "lumi", href: "lumi" },
  { key: "insights", href: "insights" },
] as const

export function AppNav({ active, locale }: AppNavProps) {
  const labels = copy[locale].nav

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface-strong)]">
      <div className="learnify-container flex min-h-14 flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <Link
          className="learnify-wordmark text-sm"
          href={`/${locale}/app/dashboard`}
        >
          LEARNIFY
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {navItems.map((item) => {
            const isActive =
              active === item.key || (active === "lesson" && item.key === "courses")

            return (
              <Link
                className={
                  isActive
                    ? "rounded-[var(--radius)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
                    : "rounded-[var(--radius)] px-3 py-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
                }
                href={`/${locale}/app/${item.href}`}
                key={item.key}
              >
                {labels[item.key]}
              </Link>
            )
          })}
        </nav>
        <LogoutButton className="w-fit" locale={locale} />
      </div>
    </header>
  )
}
