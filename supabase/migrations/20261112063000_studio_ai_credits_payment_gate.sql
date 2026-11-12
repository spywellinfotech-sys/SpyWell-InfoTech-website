-- AI payment gate: settings, per-customer credits, Razorpay orders, atomic take/add, admin grant/credits.
-- Applied to the live database in several small statements; this file is the combined equivalent.
create table if not exists public.studio_settings(k text primary key, v text not null);
insert into public.studio_settings(k,v) values ('ai_price_inr','29'),('ai_pack_credits','3') on conflict do nothing;
alter table public.studio_settings enable row level security;
create policy ss_select on public.studio_settings for select to authenticated using (true);
create policy ss_admin_upd on public.studio_settings for update to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());
grant select, update on public.studio_settings to authenticated;

create table if not exists public.studio_ai_credits(user_id uuid primary key references auth.users(id) on delete cascade, balance int not null default 0 check (balance >= 0), updated_at timestamptz not null default now());
alter table public.studio_ai_credits enable row level security;
create policy sac_select on public.studio_ai_credits for select to authenticated using (user_id = auth.uid() or public.studio_is_admin());
grant select on public.studio_ai_credits to authenticated;

create table if not exists public.studio_ai_orders(rzp_order_id text primary key, user_id uuid not null references auth.users(id) on delete cascade, amount_paise int not null, credits int not null, status text not null default 'created' check (status in ('created','paid')), rzp_payment_id text, created_at timestamptz not null default now(), paid_at timestamptz);
alter table public.studio_ai_orders enable row level security;
create policy sao_select on public.studio_ai_orders for select to authenticated using (user_id = auth.uid() or public.studio_is_admin());
grant select on public.studio_ai_orders to authenticated;

create or replace function public.studio_credit_take(p_user uuid) returns boolean language plpgsql security definer set search_path to 'public' as $$ declare n int; begin update studio_ai_credits set balance = balance - 1, updated_at = now() where user_id = p_user and balance >= 1; get diagnostics n = row_count; return n = 1; end $$;
create or replace function public.studio_credit_add(p_user uuid, p_n int) returns int language plpgsql security definer set search_path to 'public' as $$ declare b int; begin if p_n is null or p_n < 1 or p_n > 1000 then raise exception 'bad amount'; end if; insert into studio_ai_credits(user_id, balance) values (p_user, p_n) on conflict (user_id) do update set balance = studio_ai_credits.balance + p_n, updated_at = now() returning balance into b; return b; end $$;
revoke all on function public.studio_credit_take(uuid) from public, anon, authenticated;
revoke all on function public.studio_credit_add(uuid, int) from public, anon, authenticated;
grant execute on function public.studio_credit_take(uuid) to service_role;
grant execute on function public.studio_credit_add(uuid, int) to service_role;

create or replace function public.studio_admin_grant(p_user uuid, p_n int) returns int language plpgsql security definer set search_path to 'public' as $$ begin if not public.studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if; return public.studio_credit_add(p_user, p_n); end $$;
revoke all on function public.studio_admin_grant(uuid, int) from public, anon;
grant execute on function public.studio_admin_grant(uuid, int) to authenticated;
create or replace function public.studio_admin_credits() returns table(user_id uuid, balance int) language plpgsql stable security definer set search_path to 'public' as $$ begin if not public.studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if; return query select c.user_id, c.balance from studio_ai_credits c; end $$;
revoke all on function public.studio_admin_credits() from public, anon;
grant execute on function public.studio_admin_credits() to authenticated;
