type InviteKind = "school_admin" | "teacher" | "student"
type InviteLocale = "en" | "th"

type SendInviteEmailInput = {
  to: string
  token: string
  locale: InviteLocale
  kind: InviteKind
  schoolName?: string
  classroomName?: string
}

type SendInviteEmailResult =
  | { sent: true; skipped: false }
  | { sent: false; skipped: true; reason: "missing_config" }

const DEFAULT_FROM = "Learnify <onboarding@app.learnify.academy>"

export function shouldExposeInviteToken(
  env: Record<string, string | undefined> = process.env
) {
  return env.NODE_ENV !== "production"
}

export function inviteTokenResponse(
  token: string,
  env: Record<string, string | undefined> = process.env
) {
  return shouldExposeInviteToken(env) ? { inviteToken: token } : {}
}

export async function sendInviteEmail(
  input: SendInviteEmailInput,
  env: Record<string, string | undefined> = process.env
): Promise<SendInviteEmailResult> {
  const apiKey = trim(env.RESEND_API_KEY)
  const appUrl = trim(env.NEXT_PUBLIC_APP_URL)

  if (!apiKey || !appUrl) {
    if (env.NODE_ENV === "production") {
      throw new Error("Missing Resend invite email configuration.")
    }

    return { sent: false, skipped: true, reason: "missing_config" }
  }

  const template = buildInviteEmail({
    ...input,
    appUrl,
  })

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: trim(env.INVITE_EMAIL_FROM) ?? DEFAULT_FROM,
      to: [input.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend invite email failed with status ${response.status}.`)
  }

  return { sent: true, skipped: false }
}

function buildInviteEmail(
  input: SendInviteEmailInput & { appUrl: string }
): { subject: string; html: string; text: string } {
  const locale = input.locale
  const acceptPath =
    input.kind === "student"
      ? `/${locale}/app/join/${encodeURIComponent(input.token)}`
      : `/${locale}/app/invites/${encodeURIComponent(input.token)}`
  const link = `${input.appUrl.replace(/\/$/, "")}${acceptPath}`

  return input.locale === "th"
    ? buildThaiTemplate(input, link)
    : buildEnglishTemplate(input, link)
}

function buildEnglishTemplate(input: SendInviteEmailInput, link: string) {
  const roleLabel = roleLabelFor(input.kind)
  const context =
    input.kind === "student"
      ? `Join ${input.classroomName ?? "your classroom"} at ${input.schoolName ?? "your school"}.`
      : `Join ${input.schoolName ?? "your school"} as a ${roleLabel}.`
  const subject =
    input.kind === "student"
      ? `You're invited to ${input.classroomName ?? "a Learnify classroom"}`
      : `You're invited to Learnify as a ${roleLabel}`

  const text = [
    "Learnify invitation",
    "",
    context,
    "",
    `Accept your invite: ${link}`,
    "",
    "This invite expires in 14 days.",
  ].join("\n")

  return {
    subject,
    text,
    html: wrapHtml("Learnify invitation", context, link, "Accept invite"),
  }
}

function buildThaiTemplate(input: SendInviteEmailInput, link: string) {
  const roleLabel = thaiRoleLabelFor(input.kind)
  const context =
    input.kind === "student"
      ? `เข้าร่วมห้องเรียน ${input.classroomName ?? "ของคุณ"} ที่ ${input.schoolName ?? "โรงเรียนของคุณ"}`
      : `เข้าร่วม ${input.schoolName ?? "โรงเรียนของคุณ"} ในบทบาท ${roleLabel}.`
  const subject =
    input.kind === "student"
      ? `คุณได้รับคำเชิญเข้าห้องเรียน ${input.classroomName ?? "Learnify"}`
      : `คุณได้รับคำเชิญเข้าร่วม Learnify ในบทบาท ${roleLabel}`

  const text = [
    "คำเชิญจาก Learnify",
    "",
    context,
    "",
    `ยอมรับคำเชิญ: ${link}`,
    "",
    "คำเชิญนี้จะหมดอายุใน 14 วัน",
  ].join("\n")

  return {
    subject,
    text,
    html: wrapHtml("คำเชิญจาก Learnify", context, link, "ยอมรับคำเชิญ"),
  }
}

function roleLabelFor(kind: InviteKind) {
  if (kind === "school_admin") return "school admin"
  if (kind === "teacher") return "teacher"
  return "student"
}

function thaiRoleLabelFor(kind: InviteKind) {
  if (kind === "school_admin") return "ผู้ดูแลโรงเรียน"
  if (kind === "teacher") return "ครู"
  return "นักเรียน"
}

function wrapHtml(title: string, body: string, link: string, cta: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#FAF8F3;color:#2C2B28;font-family:Arial,sans-serif;">
    <main style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <p style="letter-spacing:.1em;font-size:12px;color:#BA7517;">LEARNIFY</p>
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;">${escapeHtml(title)}</h1>
      <p style="font-size:16px;line-height:1.5;margin:0 0 24px;">${escapeHtml(body)}</p>
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#2C2B28;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">${escapeHtml(cta)}</a>
      <p style="font-size:13px;line-height:1.5;color:#6F6A5F;margin-top:24px;">This invite expires in 14 days.</p>
    </main>
  </body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function trim(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
