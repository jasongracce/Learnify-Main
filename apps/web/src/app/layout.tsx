import type { Metadata } from "next"
import { Geist, Kanit } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Learnify",
  description:
    "A bilingual Thai and English AI-powered learning platform for students.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${kanit.variable}`}>
      <body>{children}</body>
    </html>
  )
}
