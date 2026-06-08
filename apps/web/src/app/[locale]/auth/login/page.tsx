import type { Locale } from "@learnify/shared"
import { AuthScreen } from "@/components/auth-screen"

type LoginPageProps = {
  params: Promise<{ locale: Locale }>
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params
  return <AuthScreen locale={locale} mode="login" />
}
