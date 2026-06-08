import type { Locale } from "@learnify/shared"
import { AuthForm } from "@/components/auth-form"
import { marketingSiteUrl } from "@/lib/site"

type AuthScreenProps = {
  locale: Locale
  mode: "login" | "signup"
}

export function AuthScreen({ locale, mode }: AuthScreenProps) {
  const fontFamily =
    locale === "th"
      ? "var(--font-kanit), var(--font-geist), system-ui, sans-serif"
      : "var(--font-geist), var(--font-kanit), system-ui, sans-serif"

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f9f9f7] px-6 py-12"
      style={{ fontFamily }}
    >
      {/* Soft radial accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 30%, rgba(255,255,255,0.95) 0%, rgba(249,249,247,0) 72%)",
        }}
      />

      {/* Wordmark */}
      <a
        href={marketingSiteUrl}
        className="absolute left-6 top-6 text-[22px] leading-none tracking-tight text-[#1a1a1a]"
        style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 900 }}
      >
        Learnify.
      </a>

      <div className="relative flex w-full flex-col items-center">
        <AuthForm locale={locale} mode={mode} />

        <a
          href={marketingSiteUrl}
          className="mt-6 text-sm text-[#9a9a9a] transition-colors hover:text-[#1a1a1a]"
        >
          ← learnify.academy
        </a>
      </div>
    </main>
  )
}
