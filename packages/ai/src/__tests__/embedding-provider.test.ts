import { describe, expect, it } from "vitest"
import {
  createOpenAiEmbeddingProvider,
  createOpenAiEmbeddingProviderFromEnv,
  EmbeddingProviderError,
  parseOpenAiEmbeddingResponse,
  resolveOpenAiEmbeddingProviderConfig,
} from "../index"

describe("OpenAI embedding provider adapter", () => {
  it("resolves embedding config only when an API key is present", () => {
    expect(resolveOpenAiEmbeddingProviderConfig({})).toBeNull()

    expect(
      resolveOpenAiEmbeddingProviderConfig({
        OPENAI_API_KEY: " key ",
        OPENAI_EMBEDDING_MODEL: " text-embedding-test ",
        OPENAI_EMBEDDING_DIMENSIONS: "1536",
      })
    ).toMatchObject({
      apiKey: "key",
      model: "text-embedding-test",
      dimensions: 1536,
    })
  })

  it("posts an embeddings request and validates float output", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const provider = createOpenAiEmbeddingProvider({
      apiKey: "test-key",
      model: "text-embedding-test",
      endpoint: "https://openai.test/v1/embeddings",
      dimensions: 3,
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })

        return new Response(
          JSON.stringify({
            object: "list",
            data: [
              {
                object: "embedding",
                index: 0,
                embedding: [0.1, -0.2, 0.3],
              },
            ],
            model: "text-embedding-test",
            usage: {
              prompt_tokens: 4,
              total_tokens: 4,
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      },
    })

    const output = await provider.embed({
      input: "Gravity creates downward acceleration.",
      user: "student-1",
    })

    expect(output).toEqual({
      embeddings: [[0.1, -0.2, 0.3]],
      model: "text-embedding-test",
      dimensions: 3,
      usage: {
        promptTokens: 4,
        totalTokens: 4,
      },
    })
    expect(calls[0]?.url).toBe("https://openai.test/v1/embeddings")
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: "Bearer test-key",
    })

    const body = JSON.parse(String(calls[0]?.init.body))

    expect(body).toMatchObject({
      input: "Gravity creates downward acceleration.",
      model: "text-embedding-test",
      encoding_format: "float",
      dimensions: 3,
      user: "student-1",
    })
  })

  it("supports batch embedding inputs", async () => {
    const provider = createOpenAiEmbeddingProvider({
      apiKey: "test-key",
      model: "text-embedding-test",
      endpoint: "https://openai.test/v1/embeddings",
      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body))

        expect(body.input).toEqual(["Gravity", "Forces"])

        return new Response(
          JSON.stringify({
            data: [
              { index: 0, embedding: [0.1, 0.2] },
              { index: 1, embedding: [0.3, 0.4] },
            ],
            model: "text-embedding-test",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      },
    })

    await expect(provider.embed({ input: ["Gravity", "Forces"] })).resolves.toMatchObject({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
      dimensions: 2,
    })
  })

  it("rejects malformed embedding output", () => {
    expect(() =>
      parseOpenAiEmbeddingResponse({
        expectedCount: 1,
        expectedDimensions: 3,
        response: {
          data: [{ embedding: [0.1, Number.NaN] }],
          model: "text-embedding-test",
        },
      })
    ).toThrow(EmbeddingProviderError)
  })

  it("rejects empty embedding input", async () => {
    const provider = createOpenAiEmbeddingProvider({
      apiKey: "test-key",
      fetch: async () => {
        throw new Error("should not call provider")
      },
    })

    await expect(provider.embed({ input: "   " })).rejects.toMatchObject({
      reason: "invalid_input",
    })
  })

  it("returns an unavailable provider when env config is missing", async () => {
    const provider = createOpenAiEmbeddingProviderFromEnv({})

    await expect(provider.embed({ input: "Gravity" })).rejects.toMatchObject({
      reason: "provider_unavailable",
    })
  })
})
