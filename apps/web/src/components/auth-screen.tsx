import type { Locale } from "@learnify/shared"
import { AuthForm } from "@/components/auth-form"
import { copy } from "@/lib/copy"
import { marketingSiteUrl } from "@/lib/site"

type AuthScreenProps = {
  locale: Locale
  mode: "login" | "signup"
}

export function AuthScreen({ locale, mode }: AuthScreenProps) {
  const t = copy[locale].auth
  const fontFamily =
    locale === "th"
      ? "var(--font-kanit), var(--font-geist), system-ui, sans-serif"
      : "var(--font-geist), var(--font-kanit), system-ui, sans-serif"

  return (
    <main
      className="grid min-h-screen md:grid-cols-2"
      style={{ fontFamily }}
    >
      {/* Left: brand panel — fills the full left half */}
      <div
        className="relative hidden flex-col justify-between p-12 text-white md:flex"
        style={{
          backgroundImage: "url('/auth-panel.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay keeps the white text readable over the image */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.5) 100%)",
          }}
        />
        <a
          href={marketingSiteUrl}
          className="relative text-[24px] leading-none tracking-tight"
          style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 900 }}
        >
          Learnify.
        </a>
        <div className="relative max-w-md">
          <p className="text-sm text-white/70">{t.panelEyebrow}</p>
          <h2 className="mt-2 text-4xl font-semibold leading-tight tracking-tight">
            {t.panelTitle}
          </h2>
        </div>
      </div>

      {/* Right: form — fills the full right half */}
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 md:min-h-0">
        <div className="w-full max-w-sm">
          {/* Wordmark for mobile, where the brand panel is hidden */}
          <a
            href={marketingSiteUrl}
            className="mb-8 block text-[22px] leading-none tracking-tight text-[#1a1a1a] md:hidden"
            style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 900 }}
          >
            Learnify.
          </a>
          <AuthForm locale={locale} mode={mode} />
        </div>
      </div>
    </main>
  )
}
