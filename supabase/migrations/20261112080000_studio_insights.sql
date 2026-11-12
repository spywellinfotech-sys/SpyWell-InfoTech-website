-- Studio insights: view counting + secret owner insights link (additive; no existing table changed)
create table if not exists public.studio_views (
  id bigint generated always as identity primary key,
  design_id uuid not null references public.studio_designs(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists studio_views_design_time on public.studio_views(design_id, viewed_at);
alter table public.studio_views enable row level security;
revoke all on public.studio_views from anon, authenticated;

create table if not exists public.studio_insight_keys (
  design_id uuid primary key references public.studio_designs(id) on delete cascade,
  key text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);
alter table public.studio_insight_keys enable row level security;
revoke all on public.studio_insight_keys from anon, authenticated;
grant select on public.studio_insight_keys to authenticated;
create policy sik_owner_select on public.studio_insight_keys for select to authenticated
  using (exists (select 1 from public.studio_designs d where d.id = design_id and d.user_id = auth.uid()));

create or replace function public.studio_track_view(p_slug text, p_type text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_type not in ('invitation','visiting') or p_slug is null or length(p_slug) not between 3 and 60 then return; end if;
  select id into v_id from studio_designs where slug = p_slug and product_type = p_type and status = 'published';
  if v_id is not null then insert into studio_views(design_id) values (v_id); end if;
end $$;
revoke all on function public.studio_track_view(text, text) from public;
grant execute on function public.studio_track_view(text, text) to anon, authenticated;

create or replace function public.studio_insights_link(p_design uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_key text;
begin
  if auth.uid() is null or not exists (select 1 from studio_designs where id = p_design and user_id = auth.uid()) then
    raise exception 'not_allowed';
  end if;
  insert into studio_insight_keys(design_id) values (p_design) on conflict do nothing;
  select key into v_key from studio_insight_keys where design_id = p_design;
  return v_key;
end $$;
revoke all on function public.studio_insights_link(uuid) from public;
grant execute on function public.studio_insights_link(uuid) to authenticated;

create or replace function public.studio_insights(p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_d record; v_days jsonb;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{32}$' then return null; end if;
  select d.id, d.title, d.product_type, d.slug, d.status into v_d
    from studio_insight_keys k join studio_designs d on d.id = k.design_id where k.key = p_key;
  if v_d.id is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g, 'YYYY-MM-DD'),
           'n', (select count(*) from studio_views v where v.design_id = v_d.id and (v.viewed_at at time zone 'Asia/Kolkata')::date = g::date)) order by g), '[]'::jsonb)
    into v_days from generate_series((now() at time zone 'Asia/Kolkata')::date - 13, (now() at time zone 'Asia/Kolkata')::date, interval '1 day') g;
  return jsonb_build_object('title', v_d.title, 'type', v_d.product_type, 'slug', v_d.slug, 'status', v_d.status,
    'total', (select count(*) from studio_views where design_id = v_d.id),
    'today', (select count(*) from studio_views where design_id = v_d.id and (viewed_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date),
    'last7', (select count(*) from studio_views where design_id = v_d.id and viewed_at > now() - interval '7 days'),
    'last_viewed', (select max(viewed_at) from studio_views where design_id = v_d.id),
    'days', v_days);
end $$;
revoke all on function public.studio_insights(text) from public;
grant execute on function public.studio_insights(text) to anon, authenticated;
