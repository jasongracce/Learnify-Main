import { describe, expect, it } from "vitest"
import { consumeRateLimit, type SupabaseClient } from "../index"

type RpcResult = {
  data?: unknown[]
  error?: { message: string } | null
}

class MockRpcQuery {
  constructor(private readonly result: RpcResult) {}

  returns<T>() {
    return Promise.resolve({
      data: (this.result.data ?? []) as T,
      error: this.result.error ?? null,
    })
  }
}

function createMockSupabase(result: RpcResult) {
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = []
  const supabase = {
    rpc(name: string, args: Record<string, unknown>) {
      rpcCalls.push({ name, args })

      return new MockRpcQuery(result)
    },
  } as unknown as SupabaseClient

  return { supabase, rpcCalls }
}

describe("consumeRateLimit", () => {
  it("returns allowed limiter status from the RPC", async () => {
    const resetAt = "2026-05-28T01:00:00.000Z"
    const { supabase, rpcCalls } = createMockSupabase({
      data: [
        {
          allowed: true,
          limit_value: 60,
          remaining: 59,
          reset_at: resetAt,
          retry_after_seconds: 0,
        },
      ],
    })

    const result = await consumeRateLimit({
      supabase,
      key: "203.0.113.10",
      namespace: "lumi-chat-ip",
      limit: 60,
      windowSeconds: 60,
    })

    expect(rpcCalls).toEqual([
      {
        name: "consume_rate_limit",
        args: {
          rate_limit_key: "203.0.113.10",
          rate_limit_namespace: "lumi-chat-ip",
          max_attempts: 60,
          window_seconds: 60,
        },
      },
    ])
    expect(result).toEqual({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAtMs: Date.parse(resetAt),
      retryAfterSeconds: 0,
    })
  })

  it("returns blocked limiter status with retry seconds", async () => {
    const resetAt = "2026-05-28T01:00:20.000Z"
    const { supabase } = createMockSupabase({
      data: [
        {
          allowed: false,
          limit_value: 20,
          remaining: 0,
          reset_at: resetAt,
          retry_after_seconds: 20,
        },
      ],
    })

    await expect(
      consumeRateLimit({
        supabase,
        key: "user-1",
        namespace: "lumi-chat-user",
        limit: 20,
        windowSeconds: 60,
      })
    ).resolves.toMatchObject({
      allowed: false,
      limit: 20,
      remaining: 0,
      retryAfterSeconds: 20,
    })
  })

  it("surfaces expired-window resets as a fresh allowed status", async () => {
    const resetAt = "2026-05-28T01:01:00.000Z"
    const { supabase } = createMockSupabase({
      data: [
        {
          allowed: true,
          limit_value: 20,
          remaining: 19,
          reset_at: resetAt,
          retry_after_seconds: 0,
        },
      ],
    })

    await expect(
      consumeRateLimit({
        supabase,
        key: "user-1",
        namespace: "lumi-chat-user",
        limit: 20,
        windowSeconds: 60,
      })
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 19,
      resetAtMs: Date.parse(resetAt),
    })
  })

  it("turns RPC errors into controlled helper errors", async () => {
    const { supabase } = createMockSupabase({
      error: { message: "permission denied for function consume_rate_limit" },
    })

    await expect(
      consumeRateLimit({
        supabase,
        key: "user-1",
        namespace: "lumi-chat-user",
        limit: 20,
        windowSeconds: 60,
      })
    ).rejects.toThrow(
      "Rate limit check failed: permission denied for function consume_rate_limit"
    )
  })
})
