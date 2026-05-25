import type { Locale, LumiChatResponse } from "@learnify/shared"

export type LumiChatSource = NonNullable<LumiChatResponse["sources"]>[number]

export type LumiSourceDisplay = {
  text: string
  href?: string
}

export function formatLumiSourceKind(kind: LumiChatSource["kind"]) {
  switch (kind) {
    case "published_lesson":
      return "lesson"
    case "verified_rag_chunk":
      return "verified source"
    case "question":
      return "question"
    case "skill":
      return "skill"
    case "recent_mistake":
      return "recent answer"
    default:
      return "source"
  }
}

export function getLumiSourceDisplay(input: {
  source: LumiChatSource
  locale: Locale
}): LumiSourceDisplay {
  const title = input.source.title ?? input.source.id
  const text = input.source.kind
    ? `${title} (${formatLumiSourceKind(input.source.kind)})`
    : title

  return {
    text,
    ...(input.source.lessonSlug
      ? { href: `/${input.locale}/app/lessons/${input.source.lessonSlug}` }
      : {}),
  }
}
