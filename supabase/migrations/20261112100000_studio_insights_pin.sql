-- Studio insights v2: PIN-protected link, unique visitors, click tracking. Old key-only RPCs are revoked.
alter table public.studio_views add column if not exists visitor text, add column if not exists device text, add column if not exists src text;
alter table public.studio_insight_keys add column if not exists pin_hash text, add column if not exists fail_count int not null default 0, add column if not exists locked_until timestamptz;
create table if not exists public.studio_clicks (
  id bigint generated always as identity primary key,
  design_id uuid not null references public.studio_designs(id) on delete cascade,
  kind text not null, visitor text, clicked_at timestamptz not null default now()
);
create index if not exists studio_clicks_design_time on public.studio_clicks(design_id, clicked_at);
alter table public.studio_clicks enable row level security;
revoke all on public.studio_clicks from anon, authenticated;

revoke execute on function public.studio_track_view(text, text) from anon, authenticated;
revoke execute on function public.studio_insights_link(uuid) from authenticated;
revoke execute on function public.studio_insights(text) from anon, authenticated;

create or replace function public.studio_track(p_slug text, p_type text, p_kind text, p_visitor text, p_device text, p_src text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_vis text := left(coalesce(p_visitor, ''), 40);
begin
  if p_type not in ('invitation','visiting') or p_slug is null or length(p_slug) not between 3 and 60
     or p_kind not in ('view','call','whatsapp','map','savecontact','savecard','email','website','share') then return; end if;
  select id into v_id from studio_designs where slug = p_slug and product_type = p_type and status = 'published';
  if v_id is null then return; end if;
  if p_kind = 'view' then
    insert into studio_views(design_id, visitor, device, src) values (v_id, nullif(v_vis, ''), case when p_device in ('mobile','desktop') then p_device end, nullif(left(coalesce(p_src, ''), 60), ''));
  else
    insert into studio_clicks(design_id, kind, visitor) values (v_id, p_kind, nullif(v_vis, ''));
  end if;
end $$;
revoke all on function public.studio_track(text, text, text, text, text, text) from public;
grant execute on function public.studio_track(text, text, text, text, text, text) to anon, authenticated;

create or replace function public.studio_new_pin() returns text language sql volatile set search_path = public, extensions as $$
  select ((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint % 900000) + 100000)::text $$;
revoke all on function public.studio_new_pin() from public, anon, authenticated;

create or replace function public.studio_insights_setup(p_design uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_key text; v_pin text; v_hash text;
begin
  if auth.uid() is null or not exists (select 1 from studio_designs where id = p_design and user_id = auth.uid()) then raise exception 'not_allowed'; end if;
  insert into studio_insight_keys(design_id) values (p_design) on conflict do nothing;
  select key, pin_hash into v_key, v_hash from studio_insight_keys where design_id = p_design;
  if v_hash is null then
    v_pin := studio_new_pin();
    update studio_insight_keys set pin_hash = crypt(v_pin, gen_salt('bf')), fail_count = 0, locked_until = null where design_id = p_design;
  end if;
  return jsonb_build_object('key', v_key, 'pin', v_pin);
end $$;
revoke all on function public.studio_insights_setup(uuid) from public;
grant execute on function public.studio_insights_setup(uuid) to authenticated;

create or replace function public.studio_insights_reset(p_design uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_pin text;
begin
  if auth.uid() is null or not exists (select 1 from studio_designs where id = p_design and user_id = auth.uid()) then raise exception 'not_allowed'; end if;
  insert into studio_insight_keys(design_id) values (p_design) on conflict do nothing;
  v_pin := studio_new_pin();
  update studio_insight_keys set pin_hash = crypt(v_pin, gen_salt('bf')), fail_count = 0, locked_until = null where design_id = p_design;
  return v_pin;
end $$;
revoke all on function public.studio_insights_reset(uuid) from public;
grant execute on function public.studio_insights_reset(uuid) to authenticated;

create or replace function public.studio_insights(p_key text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare k record; d record; v_days jsonb; v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{32}$' or p_pin is null or p_pin !~ '^[0-9]{6}$' then return jsonb_build_object('ok', false, 'err', 'invalid'); end if;
  select * into k from studio_insight_keys where key = p_key;
  if k.design_id is null or k.pin_hash is null then return jsonb_build_object('ok', false, 'err', 'invalid'); end if;
  if k.locked_until is not null and k.locked_until > now() then return jsonb_build_object('ok', false, 'err', 'locked'); end if;
  if crypt(p_pin, k.pin_hash) <> k.pin_hash then
    if k.fail_count + 1 >= 5 then
      update studio_insight_keys set fail_count = 0, locked_until = now() + interval '15 minutes' where design_id = k.design_id;
      return jsonb_build_object('ok', false, 'err', 'locked');
    end if;
    update studio_insight_keys set fail_count = fail_count + 1 where design_id = k.design_id;
    return jsonb_build_object('ok', false, 'err', 'wrong');
  end if;
  update studio_insight_keys set fail_count = 0, locked_until = null where design_id = k.design_id and (fail_count <> 0 or locked_until is not null);
  select id, title, product_type, slug, status into d from studio_designs where id = k.design_id;
  select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g, 'YYYY-MM-DD'),
           'n', (select count(*) from studio_views v where v.design_id = d.id and (v.viewed_at at time zone 'Asia/Kolkata')::date = g::date)) order by g), '[]'::jsonb)
    into v_days from generate_series(v_today - 13, v_today, interval '1 day') g;
  return jsonb_build_object('ok', true, 'title', d.title, 'type', d.product_type, 'slug', d.slug, 'status', d.status,
    'total', (select count(*) from studio_views where design_id = d.id),
    'unique', (select count(distinct visitor) from studio_views where design_id = d.id and visitor is not null),
    'today', (select count(*) from studio_views where design_id = d.id and (viewed_at at time zone 'Asia/Kolkata')::date = v_today),
    'last7', (select count(*) from studio_views where design_id = d.id and viewed_at > now() - interval '7 days'),
    'days', v_days,
    'clicks', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from studio_clicks where design_id = d.id group by kind) c), '{}'::jsonb),
    'devices', coalesce((select jsonb_object_agg(device, n) from (select device, count(*) n from studio_views where design_id = d.id and device is not null group by device) c), '{}'::jsonb),
    'sources', coalesce((select jsonb_object_agg(src, n) from (select coalesce(src, 'direct') src, count(*) n from studio_views where design_id = d.id group by 1 order by 2 desc limit 8) c), '{}'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('k', kind, 'at', at) order by at desc) from (
        select 'view' kind, viewed_at at from studio_views where design_id = d.id
        union all select kind, clicked_at from studio_clicks where design_id = d.id order by at desc limit 20) r), '[]'::jsonb));
end $$;
revoke all on function public.studio_insights(text, text) from public;
grant execute on function public.studio_insights(text, text) to anon, authenticated;

revoke select on public.studio_insight_keys from authenticated;
grant select (design_id, key, created_at) on public.studio_insight_keys to authenticated;

-- Super admin: per-card counts and full insights (no PIN needed), admin only
create or replace function public.studio_admin_view_counts()
returns table(design_id uuid, views bigint, uniq bigint, clicks bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'not_allowed'; end if;
  return query
    select d.id,
      (select count(*) from studio_views v where v.design_id = d.id),
      (select count(distinct v.visitor) from studio_views v where v.design_id = d.id and v.visitor is not null),
      (select count(*) from studio_clicks c where c.design_id = d.id)
    from studio_designs d;
end $$;
revoke all on function public.studio_admin_view_counts() from public, anon;
grant execute on function public.studio_admin_view_counts() to authenticated;
-- studio_admin_insights(uuid): same stats as studio_insights, gated by studio_is_admin() (see live DB)
