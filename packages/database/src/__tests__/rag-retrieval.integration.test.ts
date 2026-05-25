import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  createSupabaseServiceClientFromEnv,
  retrieveVerifiedRagChunks,
  type SupabaseServerEnv,
} from "../index"

function loadWebEnv(): SupabaseServerEnv {
  const envPath = resolve(process.cwd(), "../../apps/web/.env.local")

  if (!existsSync(envPath)) {
    return process.env
  }

  const entries = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const separatorIndex = line.indexOf("=")

      if (separatorIndex < 0) {
        return null
      }

      const key = line.slice(0, separatorIndex).trim()
      const value = line
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^"|"$/g, "")

      return [key, value] as const
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry))

  return {
    ...process.env,
    ...Object.fromEntries(entries),
  }
}

describe("RAG retrieval integration", () => {
  const env = loadWebEnv()
  const hasSupabaseConfig = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
  )
  const integrationIt = hasSupabaseConfig ? it : it.skip

  integrationIt(
    "retrieves verified Physics chunks from Supabase",
    async () => {
      const supabase = createSupabaseServiceClientFromEnv(env)

      const chunks = await retrieveVerifiedRagChunks({
        supabase,
        locale: "en",
        query: "gravity acceleration",
        subject: "Physics",
        courseSlug: "physics-foundations",
        lessonSlug: "gravity-and-falling-objects",
        limit: 4,
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks.every((chunk) => chunk.locale === "en")).toBe(true)
      expect(chunks.every((chunk) => chunk.subject === "Physics")).toBe(true)
      expect(
        chunks.every(
          (chunk) =>
            chunk.metadata.lesson_slug === "gravity-and-falling-objects"
        )
      ).toBe(true)
      expect(chunks[0]?.content.toLowerCase()).toContain("gravity")
    },
    30_000
  )
})
