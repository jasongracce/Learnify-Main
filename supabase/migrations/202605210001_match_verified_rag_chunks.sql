create or replace function public.match_verified_rag_chunks(
  query_embedding vector(1536),
  match_locale text,
  match_subject text default null,
  match_course_slug text default null,
  match_lesson_slug text default null,
  match_count integer default 6
)
returns table (
  id uuid,
  document_id uuid,
  document_title text,
  content text,
  locale text,
  subject text,
  source_type text,
  source_url text,
  chunk_index integer,
  metadata jsonb,
  score double precision,
  created_at timestamptz
)
language sql
stable
set search_path = public
as $$
  select
    rag_chunks.id,
    rag_chunks.document_id,
    rag_documents.title as document_title,
    rag_chunks.content,
    rag_documents.language as locale,
    rag_documents.subject,
    rag_documents.source_type,
    rag_documents.source_url,
    rag_chunks.chunk_index,
    rag_chunks.metadata,
    1 - (rag_chunks.embedding <=> query_embedding) as score,
    rag_chunks.created_at
  from public.rag_chunks
  inner join public.rag_documents
    on rag_documents.id = rag_chunks.document_id
  where rag_chunks.verified = true
    and rag_chunks.embedding is not null
    and rag_documents.status = 'processed'
    and rag_documents.verified = true
    and rag_documents.language = match_locale
    and (match_subject is null or rag_documents.subject = match_subject)
    and (
      match_course_slug is null
      or rag_chunks.metadata @> jsonb_build_object('course_slug', match_course_slug)
    )
    and (
      match_lesson_slug is null
      or rag_chunks.metadata @> jsonb_build_object('lesson_slug', match_lesson_slug)
    )
  order by rag_chunks.embedding <=> query_embedding, rag_chunks.chunk_index asc
  limit least(greatest(match_count, 1), 20);
$$;

grant execute on function public.match_verified_rag_chunks(
  vector,
  text,
  text,
  text,
  text,
  integer
) to authenticated, service_role;
