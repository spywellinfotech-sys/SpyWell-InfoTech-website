-- Studio phases 3-5: slug check, publish guard, AI usage log, admin stats/customers.
-- Reconstructed from the live database (already applied); function bodies are as deployed.
create or replace function public.studio_slug_free(p_slug text, p_id uuid) returns boolean
 language sql stable security definer set search_path to 'public' as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(p_slug) between 3 and 60
     and not exists(select 1 from public.studio_designs where slug=p_slug and id is distinct from p_id)
$$;
revoke all on function public.studio_slug_free(text,uuid) from public, anon;
grant execute on function public.studio_slug_free(text,uuid) to authenticated;

create or replace function public.studio_design_guard() returns trigger
 language plpgsql security definer set search_path to 'public' as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'user_id is immutable'; end if;
  if new.product_type is distinct from old.product_type then raise exception 'product_type is immutable'; end if;
  if new.status='published' and new.slug is null then raise exception 'a published design needs a slug'; end if;
  if new.status='published' and old.status is distinct from 'published' then new.published_at=now(); end if;
  return new;
end $$;

create table if not exists public.studio_ai_usage(
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  product_type text, mode text,
  status text not null default 'started' check (status in ('started','ok','error')),
  model text, input_tokens int, output_tokens int, error text);
alter table public.studio_ai_usage enable row level security;
drop policy if exists sau_select on public.studio_ai_usage;
create policy sau_select on public.studio_ai_usage for select using (user_id = auth.uid() or public.studio_is_admin());
grant select on public.studio_ai_usage to authenticated;

create or replace function public.studio_admin_stats() returns jsonb
 language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'customers', (select count(*) from studio_profiles),
    'invitations', (select count(*) from studio_designs where product_type='invitation'),
    'visiting', (select count(*) from studio_designs where product_type='visiting'),
    'published', (select count(*) from studio_designs where status='published'),
    'drafts', (select count(*) from studio_designs where status='draft'),
    'unpublished', (select count(*) from studio_designs where status='unpublished'),
    'templates_active', (select count(*) from studio_templates where active),
    'ai_calls_7d', (select count(*) from studio_ai_usage where created_at > now() - interval '7 days'),
    'ai_tokens_7d', (select coalesce(sum(coalesce(input_tokens,0)+coalesce(output_tokens,0)),0) from studio_ai_usage where created_at > now() - interval '7 days'));
end $$;

create or replace function public.studio_admin_customers(p_search text default '')
 returns table(id uuid, full_name text, phone text, email text, created_at timestamptz, designs bigint, published bigint)
 language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return query
    select p.id, p.full_name, p.phone, u.email::text, p.created_at,
           (select count(*) from studio_designs d where d.user_id=p.id),
           (select count(*) from studio_designs d where d.user_id=p.id and d.status='published')
    from studio_profiles p join auth.users u on u.id=p.id
    where coalesce(p_search,'')='' or p.full_name ilike '%'||p_search||'%' or p.phone ilike '%'||p_search||'%' or u.email ilike '%'||p_search||'%'
    order by p.created_at desc limit 300;
end $$;
