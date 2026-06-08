import type { Locale } from "@learnify/shared"
import { AuthScreen } from "@/components/auth-screen"

type SignupPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params
  return <AuthScreen locale={locale} mode="signup" />
}
