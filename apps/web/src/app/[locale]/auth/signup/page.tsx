import Link from "next/link"
import type { Locale } from "@learnify/shared"
import { copy } from "@/lib/copy"
import { marketingSiteUrl } from "@/lib/site"

type SignupPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params
  const t = copy[locale].auth

  return (
    <main className="learnify-container py-10">
      <div className="max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <h1 className="text-2xl font-semibold">{t.signupTitle}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{t.body}</p>
        <form className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            {t.email}
            <input
              className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
              name="email"
              type="email"
              placeholder="student@example.com"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t.password}
            <input
              className="rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--brand)]"
              name="password"
              type="password"
            />
          </label>
          <button
            className="rounded-[var(--radius)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-white opacity-60"
            disabled
            type="button"
          >
            {t.submit}
          </button>
        </form>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {t.disabledNote}
        </p>
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
