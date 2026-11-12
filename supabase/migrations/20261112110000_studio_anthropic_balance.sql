-- Admin-only estimate of the Anthropic prepaid balance (Anthropic has no balance API).
create or replace function public.studio_admin_ai_cost()
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare s jsonb; base numeric; since timestamptz; pin numeric; pout numeric; ti bigint; tout bigint; n bigint; ok bigint; tin_all bigint; tout_all bigint; spent numeric;
begin
  if not public.studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) into s from public.studio_settings where k like 'anthropic_%';
  base := nullif(s->>'anthropic_base_usd','')::numeric;
  since := nullif(s->>'anthropic_base_at','')::timestamptz;
  pin := coalesce(nullif(s->>'anthropic_in_usd','')::numeric,3);
  pout := coalesce(nullif(s->>'anthropic_out_usd','')::numeric,15);
  select coalesce(sum(input_tokens),0), coalesce(sum(output_tokens),0), count(*), count(*) filter (where status='ok')
    into tin_all, tout_all, n, ok from public.studio_ai_usage;
  select coalesce(sum(input_tokens),0), coalesce(sum(output_tokens),0) into ti, tout
    from public.studio_ai_usage where since is not null and created_at >= since;
  spent := (ti*pin + tout*pout)/1000000.0;
  return jsonb_build_object('base_usd',base,'base_at',since,'low_usd',coalesce(nullif(s->>'anthropic_low_usd','')::numeric,3),
    'price_in',pin,'price_out',pout,'spent_since_usd',round(spent,4),
    'remaining_usd',case when base is null then null else round(base-spent,2) end,
    'total_calls',n,'ok_calls',ok,'total_spent_usd',round((tin_all*pin+tout_all*pout)/1000000.0,4));
end $$;
create or replace function public.studio_admin_set_anthropic(p_balance numeric, p_low numeric, p_in numeric, p_out numeric)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_balance is null or p_balance<0 or p_balance>100000 or p_low<0 or p_in<=0 or p_out<=0 or p_in>1000 or p_out>1000 then raise exception 'bad value'; end if;
  insert into public.studio_settings(k,v) values ('anthropic_base_usd',p_balance::text),('anthropic_base_at',now()::text),('anthropic_low_usd',p_low::text),('anthropic_in_usd',p_in::text),('anthropic_out_usd',p_out::text)
  on conflict (k) do update set v=excluded.v;
end $$;
revoke all on function public.studio_admin_ai_cost() from public, anon;
revoke all on function public.studio_admin_set_anthropic(numeric,numeric,numeric,numeric) from public, anon;
grant execute on function public.studio_admin_ai_cost() to authenticated;
grant execute on function public.studio_admin_set_anthropic(numeric,numeric,numeric,numeric) to authenticated;
