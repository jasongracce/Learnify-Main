import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createSupabaseServiceClientFromEnv } from "@learnify/database"
import {
  createOpenAiEmbeddingProviderFromEnv,
  EmbeddingProviderError,
  type OpenAiProviderEnv,
} from "../src/index"

type RagChunkBackfillRecord = {
  id: string
  content: string
}

type BackfillOptions = {
  batchSize: number
  dryRun: boolean
  limit: number
  dimensions: number
}

const defaultOptions: BackfillOptions = {
  batchSize: 8,
  dryRun: false,
  limit: 50,
  dimensions: 1536,
}

async function main() {
  const env = loadWebEnv()
  const options = parseArgs(process.argv.slice(2), env)
  const supabase = createSupabaseServiceClientFromEnv(env)

  const { data: chunks, error } = await supabase
    .from("rag_chunks")
    .select("id,content,rag_documents!inner(id,status,verified)")
    .eq("verified", true)
    .is("embedding", null)
    .eq("rag_documents.status", "processed")
    .eq("rag_documents.verified", true)
    .order("created_at", { ascending: true })
    .limit(options.limit)
    .returns<RagChunkBackfillRecord[]>()

  if (error) {
    throw new Error(error.message)
  }

  let embedded = 0
  let skipped = 0
  let failed = 0

  console.log(
    `Found ${chunks.length} verified rag_chunks with missing embeddings.`
  )

  if (options.dryRun) {
    skipped = chunks.length
    console.log("Dry run enabled; no embeddings will be generated or updated.")
    logSummary({ found: chunks.length, embedded, skipped, failed })
    return
  }

  const provider = createOpenAiEmbeddingProviderFromEnv(env)

  for (const batch of chunkArray(chunks, options.batchSize)) {
    const validBatch = batch.filter((chunk) => {
      const content = chunk.content.trim()

      if (content) {
        return true
      }

      skipped += 1
      console.warn(`Skipped ${chunk.id}: empty content.`)
      return false
    })

    if (validBatch.length === 0) {
      continue
    }

    try {
      const output = await provider.embed({
        input: validBatch.map((chunk) => chunk.content.trim()),
        dimensions: options.dimensions,
      })

      for (const [index, chunk] of validBatch.entries()) {
        const embedding = output.embeddings[index]

        if (!embedding || embedding.length !== options.dimensions) {
          failed += 1
          console.error(
            `Failed ${chunk.id}: expected ${options.dimensions} dimensions, got ${embedding?.length ?? 0}.`
          )
          continue
        }

        const { error: updateError } = await supabase
          .from("rag_chunks")
          .update({
            embedding,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chunk.id)
          .is("embedding", null)

        if (updateError) {
          failed += 1
          console.error(`Failed ${chunk.id}: ${updateError.message}`)
          continue
        }

        embedded += 1
        console.log(`Embedded ${chunk.id}.`)
      }
    } catch (error) {
      failed += validBatch.length
      const message =
        error instanceof EmbeddingProviderError || error instanceof Error
          ? error.message
          : "Unknown embedding error."
      console.error(
        `Failed batch ${validBatch.map((chunk) => chunk.id).join(", ")}: ${message}`
      )
    }
  }

  logSummary({ found: chunks.length, embedded, skipped, failed })

  if (failed > 0) {
    process.exitCode = 1
  }
}

function parseArgs(args: string[], env: OpenAiProviderEnv): BackfillOptions {
  const options = {
    ...defaultOptions,
    dimensions:
      parseOptionalPositiveInteger(env.OPENAI_EMBEDDING_DIMENSIONS) ??
      defaultOptions.dimensions,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--dry-run") {
      options.dryRun = true
      continue
    }

    if (arg.startsWith("--limit=")) {
      options.limit = parsePositiveInteger(arg.slice("--limit=".length), "limit")
      continue
    }

    if (arg === "--limit") {
      options.limit = parsePositiveInteger(args[index + 1], "limit")
      index += 1
      continue
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = parsePositiveInteger(
        arg.slice("--batch-size=".length),
        "batch-size"
      )
      continue
    }

    if (arg === "--batch-size") {
      options.batchSize = parsePositiveInteger(args[index + 1], "batch-size")
      index += 1
      continue
    }

    if (arg.startsWith("--dimensions=")) {
      options.dimensions = parsePositiveInteger(
        arg.slice("--dimensions=".length),
        "dimensions"
      )
      continue
    }

    if (arg === "--dimensions") {
      options.dimensions = parsePositiveInteger(args[index + 1], "dimensions")
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

function chunkArray<T>(values: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }

  return chunks
}

function parsePositiveInteger(value: string | undefined, name: string) {
  const parsed = Number.parseInt(value ?? "", 10)

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`--${name} must be a positive integer.`)
  }

  return parsed
}

function parseOptionalPositiveInteger(value: string | undefined) {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function loadWebEnv(): OpenAiProviderEnv {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(scriptDir, "../../..")
  const envPath = resolve(repoRoot, "apps/web/.env.local")

  if (!existsSync(envPath)) {
    return process.env
  }

  const entries = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
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

function logSummary(input: {
  found: number
  embedded: number
  skipped: number
  failed: number
}) {
  console.log(
    `Summary: found=${input.found} embedded=${input.embedded} skipped=${input.skipped} failed=${input.failed}`
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error."
  console.error(`Embedding backfill failed: ${message}`)
  process.exitCode = 1
})
