-- Paid publishing: designing is free; publishing a design needs a one-time payment per design when the admin sets a price (> 0).
insert into public.studio_settings(k,v) values ('pub_price_invitation','0'),('pub_price_visiting','0') on conflict do nothing;

create table if not exists public.studio_pub_orders(
  rzp_order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  design_id uuid not null references public.studio_designs(id) on delete cascade,
  amount_paise int not null,
  status text not null default 'created' check (status in ('created','paid')),
  rzp_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.studio_pub_orders enable row level security;
create policy spo_select on public.studio_pub_orders for select to authenticated using (user_id = auth.uid() or public.studio_is_admin());
grant select on public.studio_pub_orders to authenticated;

create table if not exists public.studio_pub_paid(
  design_id uuid primary key references public.studio_designs(id) on delete cascade,
  source text not null check (source in ('paid','grandfathered','admin')),
  created_at timestamptz not null default now()
);
alter table public.studio_pub_paid enable row level security;
-- no policies: read through studio_pub_info(), written only by the server

-- Designs already published (or published before) stay free to republish.
insert into public.studio_pub_paid(design_id, source)
select id, 'grandfathered' from public.studio_designs where status = 'published' or published_at is not null
on conflict do nothing;

create or replace function public.studio_pub_price(p_type text) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select nullif(v,'')::int from studio_settings where k = 'pub_price_' || p_type), 0)
$$;
revoke all on function public.studio_pub_price(text) from public, anon, authenticated;

create or replace function public.studio_pub_info(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d record; pr int;
begin
  select user_id, product_type into d from studio_designs where id = p_id;
  if not found or (d.user_id <> auth.uid() and not studio_is_admin()) then return null; end if;
  pr := studio_pub_price(d.product_type);
  return jsonb_build_object('price', pr, 'paid', (pr <= 0 or studio_is_admin() or exists(select 1 from studio_pub_paid where design_id = p_id)));
end $$;
revoke all on function public.studio_pub_info(uuid) from public, anon;
grant execute on function public.studio_pub_info(uuid) to authenticated;

create or replace function public.studio_design_guard() returns trigger
 language plpgsql security definer set search_path to 'public' as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'user_id is immutable'; end if;
  if new.product_type is distinct from old.product_type then raise exception 'product_type is immutable'; end if;
  if new.status='published' and new.slug is null then raise exception 'a published design needs a slug'; end if;
  if new.status='published' and old.status is distinct from 'published' then
    if studio_pub_price(new.product_type) > 0 and not studio_is_admin()
       and not exists(select 1 from studio_pub_paid where design_id = new.id) then
      raise exception 'payment_required' using errcode = 'P0001';
    end if;
    new.published_at=now();
  end if;
  return new;
end $$;
