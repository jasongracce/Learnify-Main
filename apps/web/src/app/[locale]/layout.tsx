import { notFound } from "next/navigation"
import type { Locale } from "@learnify/shared"
import { TopNav } from "@/components/top-nav"
import { isLocale } from "@/lib/locales"

type LocaleLayoutProps = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return (
    <div className="learnify-shell" lang={locale}>
      <TopNav locale={locale as Locale} />
      {children}
    </div>
  )
}
