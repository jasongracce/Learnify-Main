create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists pg_trgm;

create or replace function public.is_beta_authenticated()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'authenticated'
    and exists (
      select 1
      from public.beta_signups
      where email_normalized = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'service_role'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
      and role = 'admin'
    );
$$;

create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  grade_level text,
  language text not null default 'en' check (language in ('en', 'th')),
  source_type text,
  source_url text,
  uploaded_by uuid references public.profiles(id),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed', 'archived')),
  verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists rag_documents_retrieval_idx
  on public.rag_documents (language, status, verified, subject);

create index if not exists rag_documents_uploaded_by_idx
  on public.rag_documents (uploaded_by);

create index if not exists rag_documents_metadata_gin_idx
  on public.rag_documents using gin (metadata);

create index if not exists rag_documents_title_trgm_idx
  on public.rag_documents using gin (title gin_trgm_ops);

create index if not exists rag_chunks_document_id_idx
  on public.rag_chunks (document_id);

create index if not exists rag_chunks_verified_idx
  on public.rag_chunks (verified);

create index if not exists rag_chunks_metadata_gin_idx
  on public.rag_chunks using gin (metadata);

create index if not exists rag_chunks_content_trgm_idx
  on public.rag_chunks using gin (content gin_trgm_ops);

create index if not exists rag_chunks_embedding_ivfflat_idx
  on public.rag_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100)
  where embedding is not null and verified = true;

alter table public.rag_documents enable row level security;
alter table public.rag_chunks enable row level security;

drop policy if exists "verified rag documents read" on public.rag_documents;
create policy "verified rag documents read" on public.rag_documents
  for select using (
    public.current_user_is_admin()
    or auth.role() = 'service_role'
    or (
      public.is_beta_authenticated()
      and status = 'processed'
      and verified = true
    )
  );

drop policy if exists "admin rag documents manage" on public.rag_documents;
create policy "admin rag documents manage" on public.rag_documents
  for all
  using (public.current_user_is_admin() or auth.role() = 'service_role')
  with check (public.current_user_is_admin() or auth.role() = 'service_role');

drop policy if exists "verified rag chunks read" on public.rag_chunks;
create policy "verified rag chunks read" on public.rag_chunks
  for select using (
    public.current_user_is_admin()
    or auth.role() = 'service_role'
    or (
      verified = true
      and public.is_beta_authenticated()
      and exists (
        select 1
        from public.rag_documents
        where rag_documents.id = rag_chunks.document_id
        and rag_documents.status = 'processed'
        and rag_documents.verified = true
      )
    )
  );

drop policy if exists "admin rag chunks manage" on public.rag_chunks;
create policy "admin rag chunks manage" on public.rag_chunks
  for all
  using (public.current_user_is_admin() or auth.role() = 'service_role')
  with check (public.current_user_is_admin() or auth.role() = 'service_role');

grant execute on function public.is_beta_authenticated() to anon, authenticated, service_role;
grant execute on function public.current_user_is_admin() to anon, authenticated, service_role;
