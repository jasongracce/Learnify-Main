# Milestone 2 RAG Setup

This note covers the current RAG foundation for Lumi. Student-facing retrieval must use only `processed` and `verified` RAG documents/chunks.

## Seeded Content

Two migrations add verified RAG content for the same three lessons in different locales:

- `supabase/migrations/202605160002_verified_physics_rag_seed.sql` — English (`language = 'en'`)
- `supabase/migrations/202606030001_verified_physics_rag_seed_thai.sql` — Thai (`language = 'th'`)

Both cover:

- `physics-foundations` / `gravity-and-falling-objects`
- `physics-foundations` / `projectile-motion`
- `physics-foundations` / `forces-and-motion`

Each document and chunk includes deterministic metadata:

```json
{
  "course_slug": "physics-foundations",
  "module_slug": "motion-gravity-forces",
  "lesson_slug": "gravity-and-falling-objects",
  "verification_status": "verified"
}
```

## Local Verification

Run the full local migration stack:

```powershell
pnpm dlx supabase@latest db reset
```

Then verify the seed rows:

```sql
select
  language,
  count(*) as verified_documents
from public.rag_documents
where status = 'processed'
  and verified = true
  and subject = 'Physics'
  and metadata @> '{"course_slug": "physics-foundations"}'::jsonb
group by language
order by language;

select
  d.language,
  d.metadata ->> 'lesson_slug' as lesson_slug,
  count(c.id) as verified_chunks
from public.rag_chunks c
join public.rag_documents d on d.id = c.document_id
where d.status = 'processed'
  and d.verified = true
  and c.verified = true
  and d.metadata @> '{"course_slug": "physics-foundations"}'::jsonb
group by d.language, d.metadata ->> 'lesson_slug'
order by d.language, lesson_slug;
```

Expected result: 3 verified documents per locale (`en` and `th`) and 2 verified chunks per lesson per locale.

## RLS Readiness Check

In SQL editor or `psql`, confirm RLS is enabled:

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('rag_documents', 'rag_chunks');
```

Expected result: both tables have `rowsecurity = true`.

The student read policies require:

- authenticated Supabase user
- email present in `public.beta_signups.email_normalized`
- document `status = 'processed'`
- document `verified = true`
- chunk `verified = true`

Service-role checks bypass RLS, so use an authenticated beta user through the app/API to verify student-visible behavior.

## Embedding Backfill

After migrations and seed data are present, run a dry run first:

```powershell
pnpm --filter @learnify/ai backfill:rag-embeddings -- --dry-run --limit=10
```

Then generate embeddings for verified chunks:

```powershell
pnpm --filter @learnify/ai backfill:rag-embeddings -- --limit=10 --batch-size=8
```

The script only updates `rag_chunks` where:

- the chunk is verified
- the joined document is `processed` and verified
- `embedding is null`

## App Verification

Milestone 2 supports three Lumi modes:

```txt
LEARNIFY_LUMI_MODE=rag_ai
LEARNIFY_LUMI_MODE=mock
LEARNIFY_LUMI_MODE=rule
```

Use `mock` to verify the route/UI without calling a live provider. Use `rag_ai` to verify query embeddings, vector retrieval, live OpenAI response generation, citation validation, and safe rule-based fallback.

Before migration/backfill on a production project, verify config without exposing secrets:

```powershell
curl https://app.learnify.academy/api/health/config
```

Checklist:

- `publicApp.configured` is true for app URL, marketing URL, Supabase URL, and anon key.
- `supabase.serviceRoleConfigured` is true before waitlist, auth gate, or RAG admin checks.
- `lumi.mode` is `rag_ai`, `mock`, or `rule`; invalid values default to `rag_ai`.
- `lumi.openAiConfigured` can be false for fallback testing, but must be true before live AI verification.
- The response lists missing variable names only and never includes key values.

Run the local checks:

```powershell
pnpm test
pnpm --filter web typecheck
pnpm test:rag
```

`pnpm test:rag` reads `apps/web/.env.local`; it skips when Supabase env is missing and verifies retrieval when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.

## Live Project Verification

Do not push migrations to the live project until the target Supabase project is linked and reviewed.

When ready:

```powershell
pnpm dlx supabase@latest db push --dry-run
pnpm dlx supabase@latest db push
```

After pushing, run the same SQL verification queries above in the Supabase SQL editor.
