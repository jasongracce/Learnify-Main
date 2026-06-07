"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageDropdown from "@/components/ui/dropdown";
import { useLanguage } from "@/lib/i18n";

type Props = { simplified?: boolean };

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.learnify.academy";
const LOGIN_URL = `${APP_URL}/login`;

export default function Header({ simplified = false }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: t.nav.about, href: "#about" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.survey, href: "#survey" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#f9f9f7]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-[24px] leading-none tracking-tight text-[#1a1a1a]"
          style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 900 }}
        >
          Learnify.
        </Link>

        {simplified ? (
          /* Simplified: just the language toggle on the right */
          <LanguageDropdown />
        ) : (
          <>
            {/* Desktop Nav */}
            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[#6b6b6b] transition-colors hover:text-[#1a1a1a]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA + Language */}
            <div className="hidden items-center gap-3 md:flex">
              <a
                href={LOGIN_URL}
                className="rounded-full border border-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#1a1a1a] transition-all hover:bg-[#1a1a1a] hover:text-white"
              >
                {t.login}
              </a>
              <LanguageDropdown />
            </div>

            {/* Mobile: language + toggle */}
            <div className="flex items-center gap-3 md:hidden">
              <LanguageDropdown />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex flex-col gap-1.5"
                aria-label="Toggle menu"
              >
                <span
                  className={`h-0.5 w-5 bg-[#1a1a1a] transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
                />
                <span
                  className={`h-0.5 w-5 bg-[#1a1a1a] transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`h-0.5 w-5 bg-[#1a1a1a] transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
                />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile menu — only in full variant */}
      {!simplified && mobileOpen && (
        <div className="border-t border-black/5 bg-[#f9f9f7] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#6b6b6b] transition-colors hover:text-[#1a1a1a]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={LOGIN_URL}
              className="mt-2 inline-flex w-fit rounded-full border border-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#1a1a1a] transition-all hover:bg-[#1a1a1a] hover:text-white"
            >
              {t.login}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
