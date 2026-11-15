-- Buy Leads: buyers post a requirement, sellers open (unlock) the contact. Free credits while lead_free = '1'.
insert into public.studio_settings(k,v) values ('lead_free','1'),('lead_cost','1'),('lead_max_buyers','5'),('lead_auto_approve','1'),('lead_daily_limit','3'),('lead_days','15') on conflict (k) do nothing;

create table if not exists public.studio_leads(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  details text not null default '' check (char_length(details) <= 500),
  qty text not null default '' check (char_length(qty) <= 60),
  city text not null default '' check (char_length(city) <= 60),
  cat text not null default '' check (char_length(cat) <= 40),
  name text not null default '' check (char_length(name) <= 60),
  mobile text not null check (mobile ~ '^[0-9]{10}$'),
  status text not null default 'pending' check (status in ('pending','live','closed','rejected')),
  cost integer not null default 1 check (cost between 0 and 50),
  max_buyers integer not null default 5 check (max_buyers between 1 and 20),
  opened_count integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists studio_leads_live on public.studio_leads(status, expires_at desc);
create index if not exists studio_leads_user on public.studio_leads(user_id, created_at desc);
create table if not exists public.studio_lead_unlocks(
  lead_id uuid not null references public.studio_leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  paid integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (lead_id, user_id)
);
create table if not exists public.studio_credits(user_id uuid primary key references auth.users(id) on delete cascade, balance integer not null default 0 check (balance >= 0));
alter table public.studio_leads enable row level security;
alter table public.studio_lead_unlocks enable row level security;
alter table public.studio_credits enable row level security; -- no policies: only the security-definer functions below

create or replace function public.studio_setting_int(p_k text, p_d integer) returns integer language sql stable security definer set search_path=public as $$
  select coalesce((select nullif(regexp_replace(v,'[^0-9]','','g'),'')::integer from studio_settings where k=p_k), p_d) $$;
revoke all on function public.studio_setting_int(text,integer) from public, anon, authenticated;

create or replace function public.studio_lead_post(p_title text, p_details text, p_qty text, p_city text, p_cat text, p_name text, p_mobile text, p_days integer default null) returns text
language plpgsql security definer set search_path=public as $$
declare t text := left(btrim(regexp_replace(coalesce(p_title,''),'[<>]','','g')),120);
 m text := right(regexp_replace(coalesce(p_mobile,''),'[^0-9]','','g'),10); d integer := least(greatest(coalesce(p_days, studio_setting_int('lead_days',15)),1),60);
begin
  if auth.uid() is null then return 'auth'; end if;
  if char_length(t) < 3 or char_length(m) <> 10 then return 'bad'; end if;
  if (select count(*) from studio_leads where user_id=auth.uid() and created_at > now()-interval '1 day') >= studio_setting_int('lead_daily_limit',3) then return 'limit'; end if;
  insert into studio_leads(user_id,title,details,qty,city,cat,name,mobile,status,cost,max_buyers,expires_at)
  values(auth.uid(), t, left(btrim(regexp_replace(coalesce(p_details,''),'[<>]','','g')),500), left(btrim(regexp_replace(coalesce(p_qty,''),'[<>]','','g')),60), left(btrim(regexp_replace(coalesce(p_city,''),'[<>]','','g')),60),
    left(btrim(regexp_replace(coalesce(p_cat,''),'[<>]','','g')),40), left(btrim(regexp_replace(coalesce(p_name,''),'[<>]','','g')),60), m,
    case when studio_setting_int('lead_auto_approve',1)=1 then 'live' else 'pending' end, studio_setting_int('lead_cost',1), studio_setting_int('lead_max_buyers',5), now()+make_interval(days=>d));
  return 'ok';
end $$;
revoke all on function public.studio_lead_post(text,text,text,text,text,text,text,integer) from public, anon;
grant execute on function public.studio_lead_post(text,text,text,text,text,text,text,integer) to authenticated;

create or replace function public.studio_lead_list(p_city text default '', p_cat text default '', p_limit integer default 40) returns jsonb
language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(r order by (r->>'at') desc),'[]'::jsonb) from (
    select jsonb_build_object('id',l.id,'title',l.title,'details',l.details,'qty',l.qty,'city',l.city,'cat',l.cat,'at',l.created_at,'until',l.expires_at,
      'cost',case when studio_setting_int('lead_free',1)=1 then 0 else l.cost end,'left',greatest(l.max_buyers-l.opened_count,0),
      'own',(l.user_id=auth.uid()),'opened',exists(select 1 from studio_lead_unlocks u where u.lead_id=l.id and u.user_id=auth.uid())) r
    from studio_leads l
    where auth.uid() is not null and l.status='live' and l.expires_at>now() and (l.opened_count<l.max_buyers or l.user_id=auth.uid() or exists(select 1 from studio_lead_unlocks u where u.lead_id=l.id and u.user_id=auth.uid()))
      and (coalesce(p_city,'')='' or l.city ilike '%'||p_city||'%') and (coalesce(p_cat,'')='' or l.cat ilike '%'||p_cat||'%' or l.title ilike '%'||p_cat||'%')
    order by l.created_at desc limit least(greatest(p_limit,1),100)) x
$$;
revoke all on function public.studio_lead_list(text,text,integer) from public, anon;
grant execute on function public.studio_lead_list(text,text,integer) to authenticated;

create or replace function public.studio_lead_unlock(p_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare l record; cost integer; bal integer; free boolean := studio_setting_int('lead_free',1)=1;
begin
  if auth.uid() is null then return jsonb_build_object('r','auth'); end if;
  select * into l from studio_leads where id=p_id for update;
  if not found then return jsonb_build_object('r','missing'); end if;
  if l.user_id=auth.uid() then return jsonb_build_object('r','own'); end if;
  if exists(select 1 from studio_lead_unlocks where lead_id=p_id and user_id=auth.uid()) then
    return jsonb_build_object('r','ok','name',l.name,'mobile',l.mobile); end if;
  if l.status<>'live' or l.expires_at<=now() then return jsonb_build_object('r','closed'); end if;
  if l.opened_count>=l.max_buyers then return jsonb_build_object('r','full'); end if;
  cost := case when free then 0 else l.cost end;
  if cost>0 then
    insert into studio_credits(user_id,balance) values(auth.uid(),0) on conflict do nothing;
    select balance into bal from studio_credits where user_id=auth.uid() for update;
    if bal<cost then return jsonb_build_object('r','credits','need',cost,'have',bal); end if;
    update studio_credits set balance=balance-cost where user_id=auth.uid();
  end if;
  update studio_leads set opened_count=opened_count+1 where id=p_id;
  insert into studio_lead_unlocks(lead_id,user_id,paid) values(p_id,auth.uid(),cost);
  return jsonb_build_object('r','ok','name',l.name,'mobile',l.mobile);
end $$;
revoke all on function public.studio_lead_unlock(uuid) from public, anon;
grant execute on function public.studio_lead_unlock(uuid) to authenticated;

create or replace function public.studio_lead_mine() returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'title',l.title,'city',l.city,'qty',l.qty,'status',l.status,'at',l.created_at,'until',l.expires_at,'opened',l.opened_count,'max',l.max_buyers) order by l.created_at desc),'[]'::jsonb)
  from studio_leads l where l.user_id=auth.uid() $$;
revoke all on function public.studio_lead_mine() from public, anon;
grant execute on function public.studio_lead_mine() to authenticated;

create or replace function public.studio_lead_opened() returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'title',l.title,'details',l.details,'qty',l.qty,'city',l.city,'name',l.name,'mobile',l.mobile,'at',u.created_at) order by u.created_at desc),'[]'::jsonb)
  from studio_lead_unlocks u join studio_leads l on l.id=u.lead_id where u.user_id=auth.uid() $$;
revoke all on function public.studio_lead_opened() from public, anon;
grant execute on function public.studio_lead_opened() to authenticated;

create or replace function public.studio_lead_close(p_id uuid) returns text language plpgsql security definer set search_path=public as $$
begin
  update studio_leads set status='closed' where id=p_id and user_id=auth.uid() and status in ('live','pending');
  return case when found then 'ok' else 'missing' end;
end $$;
revoke all on function public.studio_lead_close(uuid) from public, anon;
grant execute on function public.studio_lead_close(uuid) to authenticated;

create or replace function public.studio_lead_credits() returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('balance',coalesce((select balance from studio_credits where user_id=auth.uid()),0),'free',studio_setting_int('lead_free',1)=1) $$;
revoke all on function public.studio_lead_credits() from public, anon;
grant execute on function public.studio_lead_credits() to authenticated;

-- admin
create or replace function public.studio_lead_admin_list() returns jsonb language plpgsql stable security definer set search_path=public as $$
begin
  if not studio_is_admin() then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'details',details,'city',city,'name',name,'mobile',mobile,'status',status,'opened',opened_count,'at',created_at) order by created_at desc) from (select * from studio_leads order by created_at desc limit 200) z),'[]'::jsonb);
end $$;
revoke all on function public.studio_lead_admin_list() from public, anon;
grant execute on function public.studio_lead_admin_list() to authenticated;
create or replace function public.studio_lead_admin_set(p_id uuid, p_status text) returns text language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() or p_status not in ('pending','live','closed','rejected') then return 'no'; end if;
  update studio_leads set status=p_status where id=p_id; return 'ok';
end $$;
revoke all on function public.studio_lead_admin_set(uuid,text) from public, anon;
grant execute on function public.studio_lead_admin_set(uuid,text) to authenticated;
create or replace function public.studio_lead_credit_add(p_user uuid, p_n integer) returns text language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() or p_n is null or p_n<-1000 or p_n>100000 then return 'no'; end if;
  insert into studio_credits(user_id,balance) values(p_user,greatest(p_n,0)) on conflict (user_id) do update set balance=greatest(studio_credits.balance+p_n,0); return 'ok';
end $$;
revoke all on function public.studio_lead_credit_add(uuid,integer) from public, anon;
grant execute on function public.studio_lead_credit_add(uuid,integer) to authenticated;
