-- Refer & Earn for Studio/DynaMe: friend pays -> referrer gets a % of the friend's first payment in a wallet; wallet reduces the next plan payment.
insert into public.studio_settings(k,v) values ('ref_enabled','1'),('ref_pct','20') on conflict (k) do nothing;

create table if not exists public.studio_ref_codes(user_id uuid primary key references auth.users(id) on delete cascade, code text unique not null);
create table if not exists public.studio_referrals(
  referred_id uuid primary key references auth.users(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  first_paid_at timestamptz,
  reward int not null default 0,
  check (referred_id <> referrer_id));
create index if not exists studio_referrals_referrer on public.studio_referrals(referrer_id);
create table if not exists public.studio_wallet(
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  kind text not null,
  note text not null default '',
  created_at timestamptz not null default now());
create index if not exists studio_wallet_user on public.studio_wallet(user_id);
alter table public.studio_ref_codes enable row level security;
alter table public.studio_referrals enable row level security;
alter table public.studio_wallet enable row level security;
create policy rc_sel on public.studio_ref_codes for select to authenticated using (user_id=auth.uid() or public.studio_is_admin());
create policy rf_sel on public.studio_referrals for select to authenticated using (referrer_id=auth.uid() or referred_id=auth.uid() or public.studio_is_admin());
create policy wl_sel on public.studio_wallet for select to authenticated using (user_id=auth.uid() or public.studio_is_admin());
grant select on public.studio_ref_codes, public.studio_referrals, public.studio_wallet to authenticated;

alter table public.studio_pub_orders add column if not exists wallet_used int not null default 0;
alter table public.studio_manual_pays add column if not exists wallet_used int not null default 0;

create or replace function public.studio_wallet_bal(u uuid) returns int language sql stable security definer set search_path=public as $$ select coalesce(sum(amount),0)::int from studio_wallet where user_id=u $$;
revoke all on function public.studio_wallet_bal(uuid) from public, anon, authenticated;
grant execute on function public.studio_wallet_bal(uuid) to service_role;

create or replace function public.studio_wallet_use(p_user uuid, p_amount int) returns int language sql stable security definer set search_path=public as $$
  select greatest(least(studio_wallet_bal(p_user), p_amount-1),0) $$;
revoke all on function public.studio_wallet_use(uuid,int) from public, anon, authenticated;
grant execute on function public.studio_wallet_use(uuid,int) to service_role;

create or replace function public.studio_wallet_quote(p_amount int) returns jsonb language plpgsql stable security definer set search_path=public as $$
declare u int;
begin
  if auth.uid() is null then return jsonb_build_object('use',0); end if;
  u := studio_wallet_use(auth.uid(), coalesce(p_amount,0));
  return jsonb_build_object('use',u,'balance',studio_wallet_bal(auth.uid()),'pay',greatest(coalesce(p_amount,0)-u,0));
end $$;
revoke all on function public.studio_wallet_quote(int) from public, anon;
grant execute on function public.studio_wallet_quote(int) to authenticated;

create or replace function public.studio_wallet_spend(p_user uuid, p_amt int, p_note text) returns int language plpgsql security definer set search_path=public as $$
declare t int;
begin
  t := least(coalesce(p_amt,0), studio_wallet_bal(p_user));
  if t > 0 then insert into studio_wallet(user_id,amount,kind,note) values (p_user,-t,'redeem',coalesce(p_note,'')); end if;
  return t;
end $$;
revoke all on function public.studio_wallet_spend(uuid,int,text) from public, anon, authenticated;
grant execute on function public.studio_wallet_spend(uuid,int,text) to service_role;

create or replace function public.studio_ref_reward(p_user uuid, p_paid int) returns int language plpgsql security definer set search_path=public as $$
declare rf studio_referrals; pct int; r int := 0;
begin
  if coalesce((select v from studio_settings where k='ref_enabled'),'1') <> '1' then return 0; end if;
  select * into rf from studio_referrals where referred_id=p_user and first_paid_at is null for update;
  if not found then return 0; end if;
  begin pct := (select nullif(v,'')::int from studio_settings where k='ref_pct'); exception when others then pct := 20; end;
  r := floor(coalesce(p_paid,0) * least(greatest(coalesce(pct,20),0),100) / 100.0)::int;
  if r >= 1 then insert into studio_wallet(user_id,amount,kind,note) values (rf.referrer_id,r,'referral','दोस्त का पहला भुगतान'); end if;
  update studio_referrals set first_paid_at=now(), reward=r where referred_id=p_user;
  return r;
end $$;
revoke all on function public.studio_ref_reward(uuid,int) from public, anon, authenticated;
grant execute on function public.studio_ref_reward(uuid,int) to service_role;

create or replace function public.studio_ref_me() returns jsonb language plpgsql security definer set search_path=public as $$
declare c text; i int := 0; res jsonb;
begin
  if auth.uid() is null then return null; end if;
  select code into c from studio_ref_codes where user_id=auth.uid();
  while c is null and i < 8 loop
    i := i + 1;
    begin
      insert into studio_ref_codes(user_id,code) values (auth.uid(), upper(substr(md5(random()::text||clock_timestamp()::text),1,6))) returning code into c;
    exception when unique_violation then
      select code into c from studio_ref_codes where user_id=auth.uid();
    end;
  end loop;
  select jsonb_build_object(
    'enabled', coalesce((select v from studio_settings where k='ref_enabled'),'1')='1',
    'pct', coalesce((select nullif(v,'')::int from studio_settings where k='ref_pct'),20),
    'code', c,
    'balance', studio_wallet_bal(auth.uid()),
    'earned', coalesce((select sum(amount) from studio_wallet where user_id=auth.uid() and kind='referral'),0),
    'joined', (select count(*) from studio_referrals where referrer_id=auth.uid()),
    'paid', (select count(*) from studio_referrals where referrer_id=auth.uid() and first_paid_at is not null),
    'referred_by', exists(select 1 from studio_referrals where referred_id=auth.uid()),
    'items', coalesce((select jsonb_agg(jsonb_build_object('at',created_at,'paid',first_paid_at is not null,'reward',reward) order by created_at desc) from (select * from studio_referrals where referrer_id=auth.uid() order by created_at desc limit 20) z),'[]'::jsonb)
  ) into res;
  return res;
end $$;
revoke all on function public.studio_ref_me() from public, anon;
grant execute on function public.studio_ref_me() to authenticated;

create or replace function public.studio_ref_apply(p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare rid uuid; cd text := upper(btrim(coalesce(p_code,'')));
begin
  if auth.uid() is null then return jsonb_build_object('error','login'); end if;
  if coalesce((select v from studio_settings where k='ref_enabled'),'1') <> '1' then return jsonb_build_object('error','off'); end if;
  if cd !~ '^[A-Z0-9]{4,10}$' then return jsonb_build_object('error','bad_code'); end if;
  if exists(select 1 from studio_referrals where referred_id=auth.uid()) then return jsonb_build_object('error','already'); end if;
  if exists(select 1 from studio_subs s join studio_designs d on d.id=s.design_id where d.user_id=auth.uid()) then return jsonb_build_object('error','too_late'); end if;
  select user_id into rid from studio_ref_codes where code=cd;
  if rid is null then return jsonb_build_object('error','bad_code'); end if;
  if rid = auth.uid() then return jsonb_build_object('error','self'); end if;
  insert into studio_referrals(referred_id,referrer_id) values (auth.uid(), rid);
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.studio_ref_apply(text) from public, anon;
grant execute on function public.studio_ref_apply(text) to authenticated;

create or replace function public.studio_admin_ref_stats() returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return jsonb_build_object(
    'joined',(select count(*) from studio_referrals),
    'paid',(select count(*) from studio_referrals where first_paid_at is not null),
    'rewards',coalesce((select sum(amount) from studio_wallet where kind='referral'),0),
    'wallet_open',coalesce((select sum(amount) from studio_wallet),0));
end $$;
revoke all on function public.studio_admin_ref_stats() from public, anon;
grant execute on function public.studio_admin_ref_stats() to authenticated;

-- Manual UPI: discount from wallet at creation (stored), spend + reward at approval.
create or replace function public.studio_manual_pay_create(p_design uuid, p_plan text, p_utr text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare d record; u text := upper(regexp_replace(coalesce(p_utr,''),'\s','','g')); req text; q jsonb; amt int; nu timestamptz; r studio_manual_pays; wu int;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
  select user_id, product_type into d from studio_designs where id=p_design;
  if not found or d.user_id <> auth.uid() then raise exception 'forbidden' using errcode='42501'; end if;
  if not studio_sub_enabled() then raise exception 'free'; end if;
  if u !~ '^[A-Z0-9]{8,30}$' then raise exception 'bad_utr'; end if;
  if d.product_type='visiting' then
    req := studio_sub_required(p_design);
    if p_plan is null or studio_plan_rank(p_plan)=0 or studio_plan_rank(p_plan) < studio_plan_rank(req) then raise exception 'bad_plan'; end if;
    q := studio_sub_quote(p_design,p_plan); amt := (q->>'amount')::int; nu := (q->>'until')::timestamptz;
    if q->>'kind'='none' or amt < 1 then raise exception 'free'; end if;
  else
    p_plan := null; amt := studio_pub_price(d.product_type);
    if amt < 1 or exists(select 1 from studio_pub_paid where design_id=p_design) then raise exception 'free'; end if;
  end if;
  if exists(select 1 from studio_manual_pays where design_id=p_design and status='pending') then raise exception 'already_pending'; end if;
  if exists(select 1 from studio_manual_pays where upper(utr)=u and status<>'rejected') then raise exception 'utr_used'; end if;
  wu := studio_wallet_use(auth.uid(), amt);
  insert into studio_manual_pays(user_id,design_id,plan,amount,new_until,utr,wallet_used) values (auth.uid(),p_design,p_plan,amt-wu,nu,u,wu) returning * into r;
  return jsonb_build_object('id',r.id,'amount',r.amount,'status',r.status,'wallet_used',wu);
end $$;
revoke all on function public.studio_manual_pay_create(uuid,text,text) from public, anon;
grant execute on function public.studio_manual_pay_create(uuid,text,text) to authenticated;

create or replace function public.studio_admin_manual_decide(p_id uuid, p_ok boolean) returns void
language plpgsql security definer set search_path=public as $$
declare m studio_manual_pays; cur studio_subs; np text; nu timestamptz; had boolean;
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select * into m from studio_manual_pays where id=p_id for update;
  if not found or m.status <> 'pending' then raise exception 'not_pending'; end if;
  if not p_ok then update studio_manual_pays set status='rejected', decided_at=now() where id=p_id; return; end if;
  if m.plan is null then
    insert into studio_pub_paid(design_id,source) values (m.design_id,'paid') on conflict (design_id) do nothing;
  else
    select * into cur from studio_subs where design_id=m.design_id; had := found;
    np := case when had and studio_plan_rank(cur.plan) > studio_plan_rank(m.plan) then cur.plan else m.plan end;
    nu := case when had and cur.paid_until > m.new_until then cur.paid_until else m.new_until end;
    insert into studio_subs(design_id,plan,paid_until) values (m.design_id,np,nu)
      on conflict (design_id) do update set plan=excluded.plan, paid_until=excluded.paid_until, updated_at=now();
  end if;
  update studio_manual_pays set status='approved', decided_at=now() where id=p_id;
  if m.wallet_used > 0 then perform studio_wallet_spend(m.user_id, m.wallet_used, 'प्लान भुगतान में उपयोग'); end if;
  perform studio_ref_reward(m.user_id, m.amount);
end $$;
revoke all on function public.studio_admin_manual_decide(uuid,boolean) from public, anon;
grant execute on function public.studio_admin_manual_decide(uuid,boolean) to authenticated;
