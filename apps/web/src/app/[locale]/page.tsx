import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, CheckCircle2 } from "lucide-react"
import { copy } from "@/lib/copy"
import { isLocale } from "@/lib/locales"

type HomePageProps = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  const t = copy[locale].home

  return (
    <main>
      <section className="learnify-container grid gap-8 py-14 md:grid-cols-[1fr_380px] md:items-start md:py-20">
        <div className="max-w-2xl">
          <h1 className="learnify-wordmark text-5xl text-[var(--text)] md:text-7xl">
            {t.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
            {t.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/waitlist`}
              className="rounded-[var(--radius-pill)] bg-[var(--text)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              {t.primary}
            </Link>
            <Link
              href={`/${locale}/app/courses`}
              className="rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-2.5 text-sm font-medium transition-colors hover:border-[var(--muted-soft)]"
            >
              {t.secondary}
            </Link>
          </div>
        </div>
        <aside className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <div className="flex items-start gap-3">
            <BookOpen
              aria-hidden="true"
              className="mt-1 text-[var(--brand)]"
              size={20}
            />
            <div>
              <h2 className="text-base font-semibold">{t.course}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{t.lesson}</p>
            </div>
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <div className="flex gap-3 text-sm leading-6 text-[var(--muted)]">
              <CheckCircle2
                aria-hidden="true"
                className="mt-1 shrink-0 text-[var(--brand)]"
                size={18}
              />
              <p>{t.detail}</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
