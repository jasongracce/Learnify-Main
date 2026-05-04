import type { Locale } from "@learnify/shared"

export const locales = ["en", "th"] as const satisfies readonly Locale[]

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "en" ? "th" : "en"
}
