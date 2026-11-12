-- Manual UPI payments (until a payment gateway is connected): user pays to the owner's UPI, submits the UTR, admin approves.
insert into public.studio_settings(k,v) values ('manual_pay','1'),('upi_id','9837900303@ybl'),('upi_name','SpyWell InfoTech') on conflict (k) do nothing;

create table if not exists public.studio_manual_pays(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  design_id uuid not null references public.studio_designs(id) on delete cascade,
  plan text check (plan in ('card','site','domain')),
  amount int not null,
  new_until timestamptz,
  utr text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists studio_manual_pays_utr on public.studio_manual_pays(upper(utr)) where status <> 'rejected';
create unique index if not exists studio_manual_pays_one_pending on public.studio_manual_pays(design_id) where status = 'pending';
alter table public.studio_manual_pays enable row level security;
create policy smp_select on public.studio_manual_pays for select to authenticated using (user_id = auth.uid() or public.studio_is_admin());
grant select on public.studio_manual_pays to authenticated;

create or replace function public.studio_manual_pay_create(p_design uuid, p_plan text, p_utr text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare d record; u text := upper(regexp_replace(coalesce(p_utr,''),'\s','','g')); req text; q jsonb; amt int; nu timestamptz; r studio_manual_pays;
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
  insert into studio_manual_pays(user_id,design_id,plan,amount,new_until,utr) values (auth.uid(),p_design,p_plan,amt,nu,u) returning * into r;
  return jsonb_build_object('id',r.id,'amount',r.amount,'status',r.status);
end $$;
revoke all on function public.studio_manual_pay_create(uuid,text,text) from public, anon;
grant execute on function public.studio_manual_pay_create(uuid,text,text) to authenticated;

create or replace function public.studio_admin_manual_pays() returns table(id uuid, email text, title text, product_type text, plan text, amount int, utr text, status text, created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return query select m.id, (select u.email::text from auth.users u where u.id=m.user_id), d.title, d.product_type, m.plan, m.amount, m.utr, m.status, m.created_at
    from studio_manual_pays m join studio_designs d on d.id=m.design_id order by (m.status='pending') desc, m.created_at desc limit 100;
end $$;
revoke all on function public.studio_admin_manual_pays() from public, anon;
grant execute on function public.studio_admin_manual_pays() to authenticated;

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
end $$;
revoke all on function public.studio_admin_manual_decide(uuid,boolean) from public, anon;
grant execute on function public.studio_admin_manual_decide(uuid,boolean) to authenticated;
