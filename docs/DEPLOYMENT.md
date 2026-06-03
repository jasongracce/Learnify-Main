# Vercel Deployment

This guide covers the first-time Vercel setup for `apps/web`. The repo is a pnpm workspace; Vercel deploys only the Next.js app, while `packages/*` are consumed as workspace dependencies.

## 1. Create the Vercel project

1. In the Vercel dashboard, click **Add New → Project** and import this GitHub repository.
2. On the configuration screen:
   - **Framework Preset**: Next.js (auto-detected).
   - **Root Directory**: `apps/web`.
   - **Build Command**: leave default (`next build`).
   - **Install Command**: leave default. Vercel detects pnpm from `packageManager` in the root `package.json` and runs the install at the repo root, which resolves the `workspace:*` deps.
   - **Output Directory**: leave default (`.next`).
   - **Node.js Version**: 20.x or later.

Do not commit a `vercel.json` — the dashboard config above is sufficient and avoids drift.

## 2. Environment variables

Set these under **Project → Settings → Environment Variables** for **Production, Preview, and Development**:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | From Supabase project settings. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only. Never expose to the client. |
| `NEXT_PUBLIC_APP_URL` | yes | Production: `https://app.learnify.academy` (or the Vercel-assigned URL until the custom domain is attached). Preview: leave unset to let it default, or use the deployment URL. |
| `NEXT_PUBLIC_MARKETING_URL` | yes | `https://learnify.academy`. |
| `OPENAI_API_KEY` | yes when `LEARNIFY_LUMI_MODE=rag_ai` | Required for live AI chat. |
| `LEARNIFY_LUMI_MODE` | optional | `rag_ai` (default), `mock`, or `rule`. Use `rule` for the first deploy to validate the app without spending OpenAI credits, then switch to `rag_ai`. |
| `OPENAI_MODEL` | optional | Defaults to `gpt-5.4`. |
| `OPENAI_MAX_OUTPUT_TOKENS` | optional | Defaults to `900`. |
| `OPENAI_EMBEDDING_MODEL` | optional | Defaults to `text-embedding-3-small`. |
| `OPENAI_EMBEDDING_DIMENSIONS` | optional | Defaults to `1536`. Must match the `vector(1536)` column in `rag_chunks`. |

Do **not** set `SUPABASE_DB_URL` in Vercel — that variable is only used by the local Supabase CLI for migrations.

## 3. Supabase configuration

Before the first authenticated session works, update Supabase Auth settings:

1. **Authentication → URL Configuration → Site URL**: set to the production `NEXT_PUBLIC_APP_URL`.
2. **Redirect URLs**: add every host that calls `/auth/callback`:
   - `http://localhost:3000/auth/callback` (dev)
   - The Vercel preview wildcard, e.g. `https://*.vercel.app/auth/callback`
   - The production URL, e.g. `https://app.learnify.academy/auth/callback`
3. If Google sign-in is enabled, copy the redirect URI from Supabase into the Google OAuth client's allowed redirect URIs.

## 4. Database migrations

Migrations live in `supabase/migrations/`. Apply them to the production Supabase project before the first real beta user logs in:

```powershell
pnpm dlx supabase@latest link --project-ref <prod-ref>
pnpm dlx supabase@latest db push --dry-run
pnpm dlx supabase@latest db push
```

Then run the embedding backfill so verified RAG chunks have vectors:

```powershell
pnpm --filter @learnify/ai backfill:rag-embeddings -- --dry-run --limit=10
pnpm --filter @learnify/ai backfill:rag-embeddings -- --limit=10 --batch-size=8
```

See `docs/MILESTONE2_RAG_SETUP.md` for the SQL verification queries to confirm the seeds landed.

## 5. Post-deploy verification

After the first successful Vercel deploy:

1. Open `https://<deploy-url>/api/health/config` and confirm:
   - `publicApp.configured` is `true`.
   - `supabase.serviceRoleConfigured` is `true`.
   - `lumi.mode` matches what was set.
   - `lumi.openAiConfigured` is `true` if running in `rag_ai` mode.
   - The response lists *names* of any missing variables — never values.
2. Open `https://<deploy-url>/api/health/supabase`. Expect `{ ok: true, source: "beta_signups" }`.
3. Visit `/en/waitlist`, submit a test email, and confirm a row appears in `public.beta_signups`.
4. Sign in with an email already in `beta_signups` and open the dashboard, a lesson, and the Lumi chat. Confirm:
   - Lesson blocks save progress on completion.
   - A wrong quiz answer triggers Lumi feedback; a correct answer marks the block complete.
   - The Lumi chat returns a grounded response with `confidence` and `sources`.
5. In Supabase, inspect `public.lumi_messages.retrieved_context_ids` for the most recent assistant message — `ragRetrieval.chunkCount` should be non-zero if embeddings are populated.

## 6. Branch and preview flow

- `main` → production.
- Any other branch → automatic preview deploy with its own URL. Preview deploys read the **Preview** scope of the env vars set in Step 2.
- The Lumi rate limiter is durable (Supabase-RPC backed), so preview deploys share quota with production. Use `LEARNIFY_LUMI_MODE=mock` on preview if you need to avoid that.
