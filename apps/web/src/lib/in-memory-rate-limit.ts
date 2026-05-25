import { createHash } from "node:crypto"

type RateLimitOptions = {
  identifier: string
  limit: number
  namespace: string
  windowMs: number
  nowMs?: number
}

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAtMs: number
  retryAfterSeconds: number
}

type RateLimitEntry = {
  count: number
  resetAtMs: number
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  learnifyInMemoryRateLimitStore?: Map<string, RateLimitEntry>
}

// MVP guard only: this memory is scoped to the current serverless instance.
const store =
  globalRateLimitStore.learnifyInMemoryRateLimitStore ??
  new Map<string, RateLimitEntry>()

globalRateLimitStore.learnifyInMemoryRateLimitStore = store

export function checkInMemoryRateLimit({
  identifier,
  limit,
  namespace,
  windowMs,
  nowMs = Date.now(),
}: RateLimitOptions): RateLimitResult {
  const safeKey = createSafeRateLimitKey(namespace, identifier)
  const existing = store.get(safeKey)

  if (!existing || existing.resetAtMs <= nowMs) {
    const resetAtMs = nowMs + windowMs
    store.set(safeKey, {
      count: 1,
      resetAtMs,
    })
    pruneExpiredEntries(nowMs)

    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAtMs,
      retryAfterSeconds: 0,
    }
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAtMs: existing.resetAtMs,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAtMs - nowMs) / 1000)
      ),
    }
  }

  existing.count += 1

  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetAtMs: existing.resetAtMs,
    retryAfterSeconds: 0,
  }
}

export function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim()

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

function createSafeRateLimitKey(namespace: string, identifier: string) {
  const digest = createHash("sha256").update(identifier).digest("hex")

  return `${namespace}:${digest.slice(0, 32)}`
}

function pruneExpiredEntries(nowMs: number) {
  if (store.size < 500) {
    return
  }

  for (const [key, entry] of store.entries()) {
    if (entry.resetAtMs <= nowMs) {
      store.delete(key)
    }
  }
}
