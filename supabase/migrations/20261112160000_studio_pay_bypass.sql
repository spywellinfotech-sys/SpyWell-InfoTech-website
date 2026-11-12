-- Super-admin payment switch: when pay_bypass = 1 nothing needs payment (publish + AI). Prices editable by admin.
insert into public.studio_settings(k,v) values ('pay_bypass','0') on conflict do nothing;

create or replace function public.studio_pay_bypass() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select v = '1' from studio_settings where k = 'pay_bypass'), false)
$$;
revoke all on function public.studio_pay_bypass() from public, anon, authenticated;

create or replace function public.studio_pay_config() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'bypass', studio_pay_bypass(),
    'pub_invitation', studio_pub_price('invitation'),
    'pub_visiting', studio_pub_price('visiting'),
    'ai_price', coalesce((select nullif(v,'')::int from studio_settings where k = 'ai_price_inr'), 0),
    'ai_credits', coalesce((select nullif(v,'')::int from studio_settings where k = 'ai_pack_credits'), 0))
$$;
revoke all on function public.studio_pay_config() from public, anon;
grant execute on function public.studio_pay_config() to authenticated;

create or replace function public.studio_admin_set_payments(p_bypass boolean, p_pub_inv int, p_pub_vis int, p_ai_price int, p_ai_credits int) returns jsonb
 language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_pub_inv < 0 or p_pub_inv > 100000 or p_pub_vis < 0 or p_pub_vis > 100000 or p_ai_price < 0 or p_ai_price > 100000 or p_ai_credits < 0 or p_ai_credits > 1000 then raise exception 'bad value'; end if;
  insert into studio_settings(k,v) values ('pay_bypass', case when p_bypass then '1' else '0' end), ('pub_price_invitation', p_pub_inv::text), ('pub_price_visiting', p_pub_vis::text), ('ai_price_inr', p_ai_price::text), ('ai_pack_credits', p_ai_credits::text)
  on conflict (k) do update set v = excluded.v;
  return studio_pay_config();
end $$;
revoke all on function public.studio_admin_set_payments(boolean, int, int, int, int) from public, anon;
grant execute on function public.studio_admin_set_payments(boolean, int, int, int, int) to authenticated;

create or replace function public.studio_pub_info(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d record; pr int;
begin
  select user_id, product_type into d from studio_designs where id = p_id;
  if not found or (d.user_id <> auth.uid() and not studio_is_admin()) then return null; end if;
  pr := studio_pub_price(d.product_type);
  return jsonb_build_object('price', pr, 'bypass', studio_pay_bypass(), 'paid', (pr <= 0 or studio_pay_bypass() or studio_is_admin() or exists(select 1 from studio_pub_paid where design_id = p_id)));
end $$;

create or replace function public.studio_design_guard() returns trigger
 language plpgsql security definer set search_path to 'public' as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'user_id is immutable'; end if;
  if new.product_type is distinct from old.product_type then raise exception 'product_type is immutable'; end if;
  if new.status='published' and new.slug is null then raise exception 'a published design needs a slug'; end if;
  if new.status='published' and old.status is distinct from 'published' then
    if studio_pub_price(new.product_type) > 0 and not studio_pay_bypass() and not studio_is_admin()
       and not exists(select 1 from studio_pub_paid where design_id = new.id) then
      raise exception 'payment_required' using errcode = 'P0001';
    end if;
    new.published_at=now();
  end if;
  return new;
end $$;
