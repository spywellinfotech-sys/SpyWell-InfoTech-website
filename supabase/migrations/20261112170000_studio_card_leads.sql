-- Viewer gate: a card owner can ask visitors for name + mobile before the card opens. Leads are saved and shown in the PIN-protected insights.
create table if not exists public.studio_card_leads(
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.studio_designs(id) on delete cascade,
  name text not null,
  mobile text not null,
  visitor text,
  device text,
  src text,
  views int not null default 1,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique(design_id, mobile)
);
create index if not exists studio_card_leads_design_idx on public.studio_card_leads(design_id, last_seen desc);
alter table public.studio_card_leads enable row level security;
-- no policies: written via studio_lead_add(), read via the PIN-protected studio_insights() (and the admin functions)

create or replace function public.studio_lead_add(p_slug text, p_type text, p_name text, p_mobile text, p_visitor text, p_device text, p_src text)
returns boolean language plpgsql security definer set search_path = public as $$
declare did uuid; nm text := left(btrim(coalesce(p_name, '')), 60); mb text := regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g');
begin
  if length(mb) > 10 then mb := right(mb, 10); end if;
  if length(nm) < 1 or mb !~ '^[0-9]{10}$' then return false; end if;
  select id into did from studio_designs where slug = lower(p_slug) and product_type = p_type and status = 'published';
  if did is null then return false; end if;
  insert into studio_card_leads(design_id, name, mobile, visitor, device, src)
    values (did, nm, mb, left(p_visitor, 40), left(p_device, 12), left(p_src, 80))
  on conflict (design_id, mobile) do update set name = excluded.name, views = studio_card_leads.views + 1, last_seen = now();
  return true;
end $$;
revoke all on function public.studio_lead_add(text, text, text, text, text, text, text) from public;
grant execute on function public.studio_lead_add(text, text, text, text, text, text, text) to anon, authenticated;

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
    'gate', coalesce((select (content_json->'style'->>'gate') = 'true' from studio_designs where id = d.id), false),
    'lead_count', (select count(*) from studio_card_leads where design_id = d.id),
    'leads', coalesce((select jsonb_agg(jsonb_build_object('n', name, 'm', mobile, 'at', last_seen, 'v', views) order by last_seen desc) from (select name, mobile, last_seen, views from studio_card_leads where design_id = d.id order by last_seen desc limit 300) l), '[]'::jsonb),
    'clicks', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from studio_clicks where design_id = d.id group by kind) c), '{}'::jsonb),
    'devices', coalesce((select jsonb_object_agg(device, n) from (select device, count(*) n from studio_views where design_id = d.id and device is not null group by device) c), '{}'::jsonb),
    'sources', coalesce((select jsonb_object_agg(src, n) from (select coalesce(src, 'direct') src, count(*) n from studio_views where design_id = d.id group by 1 order by 2 desc limit 8) c), '{}'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('k', kind, 'at', at) order by at desc) from (
        select 'view' kind, viewed_at at from studio_views where design_id = d.id
        union all select kind, clicked_at from studio_clicks where design_id = d.id order by at desc limit 20) r), '[]'::jsonb));
end $$;
revoke all on function public.studio_insights(text, text) from public;
grant execute on function public.studio_insights(text, text) to anon, authenticated;
