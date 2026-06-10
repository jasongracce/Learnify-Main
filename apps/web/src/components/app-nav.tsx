import Link from "next/link"
import type { Locale } from "@learnify/shared"
import { LanguageToggle } from "@/components/language-toggle"
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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:rgba(249,249,247,0.85)] backdrop-blur">
      <div className="learnify-container flex min-h-14 items-center justify-between gap-3 py-2.5">
        <Link
          className="learnify-wordmark text-lg leading-none"
          href={`/${locale}/app/dashboard`}
        >
          Learnify.
        </Link>
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 text-sm">
          {navItems.map((item) => {
            const isActive =
              active === item.key || (active === "lesson" && item.key === "courses")

            return (
              <Link
                className={
                  isActive
                    ? "whitespace-nowrap rounded-[var(--radius-pill)] bg-[var(--text)] px-3.5 py-1.5 font-medium text-white"
                    : "whitespace-nowrap rounded-[var(--radius-pill)] px-3.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)]"
                }
                href={`/${locale}/app/${item.href}`}
                key={item.key}
              >
                {labels[item.key]}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle locale={locale} />
          <LogoutButton className="whitespace-nowrap" hideLabelOnMobile locale={locale} />
        </div>
      </div>
    </header>
  )
}
