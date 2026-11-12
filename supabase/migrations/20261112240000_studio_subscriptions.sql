-- Yearly plans (built but OFF): visiting card ₹600/yr, mini website ₹1200/yr, website + own domain ₹6000/yr.
-- Upgrade card -> website -> domain pays only the price difference; same year-end date.
-- After expiry: grace_days (7) then the public link turns off (data stays; reactivates on payment).
-- Invitation cards stay a one-time fee (pub_price_invitation). Everything is free while pay_bypass = '1'.
insert into public.studio_settings(k,v) values
 ('sub_price_card','600'),('sub_price_site','1200'),('sub_price_domain','6000'),('sub_grace_days','7')
on conflict (k) do nothing;
update public.studio_settings set v='6000' where k='domain_price_inr' and v in ('','0');

create table if not exists public.studio_subs(
  design_id uuid primary key references public.studio_designs(id) on delete cascade,
  plan text not null check (plan in ('card','site','domain')),
  paid_until timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.studio_subs enable row level security;
-- no policies: read via studio_sub_info(), written by the server only

alter table public.studio_pub_orders add column if not exists plan text;
alter table public.studio_pub_orders add column if not exists new_until timestamptz;

create or replace function public.studio_plan_rank(p text) returns int language sql immutable as $$
  select case p when 'card' then 1 when 'site' then 2 when 'domain' then 3 else 0 end $$;

create or replace function public.studio_sub_enabled() returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select v from studio_settings where k='pay_bypass'),'1') <> '1' $$;

create or replace function public.studio_sub_price(p text) returns int language sql stable security definer set search_path=public as $$
  select coalesce((select nullif(v,'')::int from studio_settings where k='sub_price_'||p),0) $$;

create or replace function public.studio_sub_grace() returns int language sql stable security definer set search_path=public as $$
  select coalesce((select nullif(v,'')::int from studio_settings where k='sub_grace_days'),7) $$;

create or replace function public.studio_sub_required(p_id uuid) returns text language sql stable security definer set search_path=public as $$
  select case when product_type='visiting' then case when content_json->'style'->>'site'='true' then 'site' else 'card' end end
  from studio_designs where id=p_id $$;

-- state: free | unpaid | active | grace | expired | upgrade
create or replace function public.studio_sub_state(p_id uuid) returns text language plpgsql stable security definer set search_path=public as $$
declare req text; s record; g int := studio_sub_grace();
begin
  req := studio_sub_required(p_id);
  if req is null or not studio_sub_enabled() then return 'free'; end if;
  select * into s from studio_subs where design_id=p_id;
  if not found then return 'unpaid'; end if;
  if now() > s.paid_until + make_interval(days=>g) then return 'expired'; end if;
  if studio_plan_rank(s.plan) < studio_plan_rank(req) then return 'upgrade'; end if;
  if now() > s.paid_until then return 'grace'; end if;
  return 'active';
end $$;
revoke all on function public.studio_sub_state(uuid) from public, anon, authenticated;

-- What would paying for plan p_target cost right now?
create or replace function public.studio_sub_quote(p_id uuid, p_target text) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare s record; fullp int := studio_sub_price(p_target); live boolean;
begin
  select * into s from studio_subs where design_id=p_id;
  live := found and now() <= s.paid_until;
  if not live then return jsonb_build_object('amount',fullp,'kind','new','until',now()+interval '1 year'); end if;
  if p_target = s.plan then return jsonb_build_object('amount',fullp,'kind','renew','until',s.paid_until+interval '1 year'); end if;
  if studio_plan_rank(p_target) > studio_plan_rank(s.plan) then
    return jsonb_build_object('amount',greatest(fullp-studio_sub_price(s.plan),0),'kind','upgrade','until',s.paid_until); end if;
  return jsonb_build_object('amount',0,'kind','none','until',s.paid_until);
end $$;
revoke all on function public.studio_sub_quote(uuid,text) from public, anon, authenticated;

create or replace function public.studio_sub_info(p_id uuid) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare d record; s record; req text; st text; nxt text; q jsonb;
begin
  select user_id into d from studio_designs where id=p_id;
  if not found or (d.user_id <> auth.uid() and not studio_is_admin()) then return null; end if;
  req := studio_sub_required(p_id); st := studio_sub_state(p_id);
  select * into s from studio_subs where design_id=p_id;
  nxt := case when s.plan is null or st in ('expired','unpaid') then req
              when st='upgrade' then req else s.plan end;
  q := case when req is null then null else studio_sub_quote(p_id, coalesce(nxt,req)) end;
  return jsonb_build_object('enabled',studio_sub_enabled(),'required',req,'plan',s.plan,'paid_until',s.paid_until,'state',st,'grace_days',studio_sub_grace(),
    'prices',jsonb_build_object('card',studio_sub_price('card'),'site',studio_sub_price('site'),'domain',studio_sub_price('domain')),
    'next_plan',nxt,'next_amount',q->'amount','next_kind',q->>'kind',
    'domain_amount',case when req is null then null else studio_sub_quote(p_id,'domain')->'amount' end,
    'domain_kind',case when req is null then null else studio_sub_quote(p_id,'domain')->>'kind' end);
end $$;
revoke all on function public.studio_sub_info(uuid) from public, anon;
grant execute on function public.studio_sub_info(uuid) to authenticated;

-- Public: is this published link switched on?
create or replace function public.studio_pub_live(p_slug text, p_type text) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare d record; st text;
begin
  select id into d from studio_designs where slug=p_slug and product_type=p_type and status='published';
  if not found then return jsonb_build_object('live',false,'state','missing'); end if;
  st := studio_sub_state(d.id);
  return jsonb_build_object('live', st in ('free','active','grace'), 'state', st);
end $$;
grant execute on function public.studio_pub_live(text,text) to anon, authenticated;

-- Publishing check: visiting -> needs a valid plan; invitation -> one-time fee. Both only when payments are ON.
create or replace function public.studio_pub_info(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d record; pr int; si jsonb;
begin
  select user_id, product_type into d from studio_designs where id = p_id;
  if not found or (d.user_id <> auth.uid() and not studio_is_admin()) then return null; end if;
  if not studio_sub_enabled() or studio_is_admin() then return jsonb_build_object('price',0,'paid',true); end if;
  if d.product_type = 'visiting' then
    si := studio_sub_info(p_id);
    return jsonb_build_object('price',coalesce((si->>'next_amount')::int,0),'paid',(si->>'state') in ('active','grace','free'),'sub',si);
  end if;
  pr := studio_pub_price(d.product_type);
  return jsonb_build_object('price', pr, 'paid', (pr <= 0 or exists(select 1 from studio_pub_paid where design_id = p_id)));
end $$;

create or replace function public.studio_design_guard() returns trigger
 language plpgsql security definer set search_path to 'public' as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'user_id is immutable'; end if;
  if new.product_type is distinct from old.product_type then raise exception 'product_type is immutable'; end if;
  if new.status='published' and new.slug is null then raise exception 'a published design needs a slug'; end if;
  if new.status='published' and old.status is distinct from 'published' then
    if studio_sub_enabled() and not studio_is_admin() then
      if new.product_type='visiting' then
        if studio_sub_state(new.id) not in ('active','grace','free') then raise exception 'payment_required' using errcode='P0001'; end if;
      elsif studio_pub_price(new.product_type) > 0 and not exists(select 1 from studio_pub_paid where design_id = new.id) then
        raise exception 'payment_required' using errcode = 'P0001';
      end if;
    end if;
    new.published_at=now();
  end if;
  return new;
end $$;

-- Own domain needs the domain plan (only while payments are ON).
create or replace function public.studio_request_domain(p_design uuid, p_domain text) returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare d text := lower(trim(coalesce(p_domain,''))); own uuid; r public.studio_domain_requests; sp text;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
  d := regexp_replace(d, '^https?://', ''); d := regexp_replace(d, '/.*$', ''); d := regexp_replace(d, '^www\.', '');
  select user_id into own from studio_designs where id = p_design and product_type = 'visiting';
  if own is null or own <> auth.uid() then raise exception 'forbidden' using errcode='42501'; end if;
  if d !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' or length(d) > 253 then raise exception 'bad_domain'; end if;
  if d = 'spywell.in' or d like '%.spywell.in' then raise exception 'bad_domain'; end if;
  if studio_sub_enabled() then
    select plan into sp from studio_subs where design_id=p_design and now() <= paid_until + make_interval(days=>studio_sub_grace());
    if sp is distinct from 'domain' then raise exception 'upgrade_required'; end if;
  end if;
  if exists (select 1 from studio_domain_requests where domain = d and status <> 'rejected' and design_id <> p_design) then raise exception 'domain_taken'; end if;
  insert into studio_domain_requests(user_id, design_id, domain) values (auth.uid(), p_design, d)
    on conflict (design_id) do update set domain = excluded.domain, status = 'pending', note = '', updated_at = now()
    returning * into r;
  return jsonb_build_object('id', r.id, 'domain', r.domain, 'status', r.status);
end $$;

-- Admin master switch. Turning ON gives every already-live visiting card/website a 30-day starting period.
create or replace function public.studio_admin_set_payments(p_on boolean) returns void language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_on then
    insert into studio_subs(design_id,plan,paid_until)
    select id, studio_sub_required(id), now()+interval '30 days' from studio_designs
    where product_type='visiting' and status='published'
    on conflict (design_id) do nothing;
  end if;
  update studio_settings set v=case when p_on then '0' else '1' end where k='pay_bypass';
end $$;
revoke all on function public.studio_admin_set_payments(boolean) from public, anon;
grant execute on function public.studio_admin_set_payments(boolean) to authenticated;
