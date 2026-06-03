create extension if not exists pgcrypto;

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  key_hash text not null,
  request_count integer not null default 0 check (request_count >= 0),
  window_started_at timestamptz not null default now(),
  reset_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (namespace, key_hash)
);

create index if not exists rate_limits_reset_at_idx
  on public.rate_limits (reset_at);

alter table public.rate_limits enable row level security;

revoke all on table public.rate_limits from public, anon, authenticated;
grant all on table public.rate_limits to service_role;

create or replace function public.consume_rate_limit(
  rate_limit_key text,
  rate_limit_namespace text,
  max_attempts integer,
  window_seconds integer
)
returns table (
  allowed boolean,
  limit_value integer,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_key text;
  normalized_namespace text;
  hashed_key text;
  now_value timestamptz := now();
  next_reset_at timestamptz;
  current_count integer;
begin
  normalized_key := nullif(btrim(rate_limit_key), '');
  normalized_namespace := nullif(btrim(rate_limit_namespace), '');

  if normalized_key is null or normalized_namespace is null then
    raise exception 'rate limit key and namespace are required';
  end if;

  if max_attempts < 1 or window_seconds < 1 then
    raise exception 'rate limit and window must be positive';
  end if;

  hashed_key := encode(digest(normalized_namespace || ':' || normalized_key, 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtextextended(normalized_namespace || ':' || hashed_key, 0));

  select rate_limits.request_count, rate_limits.reset_at
  into current_count, next_reset_at
  from public.rate_limits
  where rate_limits.namespace = normalized_namespace
    and rate_limits.key_hash = hashed_key
  for update;

  if not found or next_reset_at <= now_value then
    current_count := 1;
    next_reset_at := now_value + make_interval(secs => window_seconds);

    insert into public.rate_limits (
      namespace,
      key_hash,
      request_count,
      window_started_at,
      reset_at,
      updated_at
    )
    values (
      normalized_namespace,
      hashed_key,
      current_count,
      now_value,
      next_reset_at,
      now_value
    )
    on conflict (namespace, key_hash) do update
    set request_count = excluded.request_count,
        window_started_at = excluded.window_started_at,
        reset_at = excluded.reset_at,
        updated_at = excluded.updated_at;
  else
    current_count := current_count + 1;

    update public.rate_limits
    set request_count = current_count,
        updated_at = now_value
    where rate_limits.namespace = normalized_namespace
      and rate_limits.key_hash = hashed_key;
  end if;

  allowed := current_count <= max_attempts;
  limit_value := max_attempts;
  remaining := greatest(max_attempts - current_count, 0);
  reset_at := next_reset_at;
  retry_after_seconds := case
    when allowed then 0
    else greatest(ceil(extract(epoch from (next_reset_at - now_value)))::integer, 1)
  end;

  return next;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;
