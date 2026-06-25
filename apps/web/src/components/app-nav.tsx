import Link from "next/link"
import type { Locale } from "@learnify/shared"
import { LogoutButton } from "@/components/logout-button"
import { copy } from "@/lib/copy"

type AppNavProps = {
  classroomBadge?: number
  locale: Locale
  schoolBadge?: number
  showAdmin?: boolean
  showClassrooms?: boolean
  showSchool?: boolean
  active:
    | "dashboard"
    | "courses"
    | "assignments"
    | "lumi"
    | "insights"
    | "lesson"
    | "school"
    | "schoolUsers"
    | "schoolInvites"
    | "classrooms"
    | "classroomRoster"
    | "adminSchools"
}

const navItems = [
  { key: "dashboard", href: "dashboard" },
  { key: "courses", href: "courses" },
  { key: "assignments", href: "assignments" },
  { key: "lumi", href: "lumi" },
  { key: "insights", href: "insights" },
] as const

const roleNavItems = [
  { key: "classrooms", href: "classrooms", flag: "showClassrooms" },
  { key: "school", href: "school", flag: "showSchool" },
  { key: "adminSchools", href: "admin/schools", flag: "showAdmin" },
] as const

export function AppNav({
  active,
  classroomBadge = 0,
  locale,
  schoolBadge = 0,
  showAdmin = false,
  showClassrooms = false,
  showSchool = false,
}: AppNavProps) {
  const labels = copy[locale].nav
  const roleFlags = { showAdmin, showClassrooms, showSchool }
  const badges: Partial<Record<AppNavProps["active"], number>> = {
    classrooms: classroomBadge,
    school: schoolBadge,
  }
  const visibleNavItems = [
    ...navItems,
    ...roleNavItems.filter((item) => roleFlags[item.flag]),
  ]

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
          {visibleNavItems.map((item) => {
            const isActive =
              active === item.key ||
              (active === "lesson" && item.key === "courses") ||
              (active === "classroomRoster" && item.key === "classrooms") ||
              ((active === "schoolUsers" || active === "schoolInvites") &&
                item.key === "school")

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
                {badges[item.key] ? (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-[4px] bg-[var(--brand)] px-1.5 py-0.5 text-xs font-semibold text-white">
                    {badges[item.key]}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
        <LogoutButton className="w-fit" locale={locale} />
      </div>
    </header>
  )
}
