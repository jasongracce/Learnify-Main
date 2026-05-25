import { describe, expect, it } from "vitest"
import {
  createOpenAiLumiProvider,
  createOpenAiLumiProviderFromEnv,
  extractOpenAiText,
  parseJsonObjectFromText,
  resolveOpenAiProviderConfig,
  type AiProviderRequest,
} from "../index"

const providerRequest: AiProviderRequest = {
  responseFormat: "lumi_chat_json",
  messages: [
    {
      role: "system",
      content: "You are Lumi. Return JSON.",
    },
    {
      role: "user",
      content:
        "Student question: Why does gravity make things faster?\n\nEligible sources:\n1. [lesson-gravity] Gravity creates downward acceleration.",
    },
  ],
}

describe("OpenAI provider adapter", () => {
  it("resolves config only when an API key is present", () => {
    expect(resolveOpenAiProviderConfig({})).toBeNull()

    expect(
      resolveOpenAiProviderConfig({
        OPENAI_API_KEY: " key ",
        OPENAI_MODEL: " gpt-test ",
        OPENAI_MAX_OUTPUT_TOKENS: "1200",
      })
    ).toMatchObject({
      apiKey: "key",
      model: "gpt-test",
      maxOutputTokens: 1200,
    })
  })

  it("extracts text from OpenAI Responses output_text", () => {
    expect(
      extractOpenAiText({
        output_text: "{\"answer\":\"ok\"}",
      })
    ).toBe("{\"answer\":\"ok\"}")
  })

  it("extracts text from OpenAI Responses output content", () => {
    expect(
      extractOpenAiText({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "{\"answer\":\"ok\"}",
              },
            ],
          },
        ],
      })
    ).toBe("{\"answer\":\"ok\"}")
  })

  it("parses raw, fenced, and surrounding JSON output", () => {
    expect(parseJsonObjectFromText("{\"answer\":\"ok\"}")).toEqual({
      answer: "ok",
    })
    expect(parseJsonObjectFromText("```json\n{\"answer\":\"ok\"}\n```")).toEqual(
      {
        answer: "ok",
      }
    )
    expect(parseJsonObjectFromText("Here is JSON: {\"answer\":\"ok\"}")).toEqual(
      {
        answer: "ok",
      }
    )
  })

  it("posts a Responses API request and validates structured JSON", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const provider = createOpenAiLumiProvider({
      apiKey: "test-key",
      model: "gpt-test",
      endpoint: "https://openai.test/v1/responses",
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} })

        return new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              answer:
                "Gravity creates downward acceleration, so speed changes while falling.",
              relatedLessonSlug: "gravity-and-falling-objects",
              suggestedNextAction: null,
              suggestedPrompts: ["What is acceleration?"],
              confidence: "high",
              sources: [{ id: "lesson-gravity", title: null }],
              safetyNotes: [],
            }),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      },
    })

    const output = await provider.completeJson(providerRequest)

    expect(output).toMatchObject({
      confidence: "high",
      relatedLessonSlug: "gravity-and-falling-objects",
    })
    expect(calls[0]?.url).toBe("https://openai.test/v1/responses")
    expect(calls[0]?.init.headers).toMatchObject({
      authorization: "Bearer test-key",
    })

    const body = JSON.parse(String(calls[0]?.init.body))

    expect(body.instructions).toContain("You are Lumi")
    expect(body.input[0].role).toBe("user")
    expect(body.text.format.type).toBe("json_schema")
    expect(body.text.format.strict).toBe(true)
    expect(body.text.format.schema.required).toEqual([
      "answer",
      "relatedLessonSlug",
      "suggestedNextAction",
      "suggestedPrompts",
      "confidence",
      "sources",
      "safetyNotes",
    ])
    expect(body.text.format.schema.properties.relatedLessonSlug.type).toEqual([
      "string",
      "null",
    ])
    expect(body.text.format.schema.properties.suggestedNextAction.type).toEqual([
      "string",
      "null",
    ])
    expect(
      body.text.format.schema.properties.sources.items.required
    ).toEqual(["id", "title"])
    expect(
      body.text.format.schema.properties.sources.items.properties.title.type
    ).toEqual(["string", "null"])
  })

  it("returns an unavailable provider when env config is missing", async () => {
    const provider = createOpenAiLumiProviderFromEnv({})

    await expect(provider.completeJson(providerRequest)).rejects.toThrow(
      "provider_unavailable"
    )
  })
})
