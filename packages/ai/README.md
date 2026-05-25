# @learnify/ai

Milestone 2 AI foundation for Learnify.

This package owns provider-neutral AI contracts before the app connects a live model. It currently includes:

- Lumi chat input and output schemas
- verified/published source filtering
- prompt contract construction
- a provider interface for structured JSON responses
- an OpenAI Responses API provider adapter
- an OpenAI embeddings provider adapter
- deterministic orchestration tests

Backfill verified RAG chunk embeddings:

```powershell
pnpm --filter @learnify/ai backfill:rag-embeddings -- --dry-run --limit=10
pnpm --filter @learnify/ai backfill:rag-embeddings -- --limit=10 --batch-size=8
```

The script reads `apps/web/.env.local`, uses the Supabase service role key, and only updates verified `rag_chunks` from processed/verified documents where `embedding is null`.

Current boundaries:

- no direct Supabase access from this package
- no UI changes
- vector search is implemented through database package repositories and app routes
- UI source rendering is handled by the web app

Provider env:

```txt
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4
OPENAI_MAX_OUTPUT_TOKENS=900
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
```

The web route can run in `LEARNIFY_LUMI_MODE=rule`, `mock`, or `rag_ai`. `rag_ai` uses the OpenAI provider when configured and falls back safely when unavailable.
