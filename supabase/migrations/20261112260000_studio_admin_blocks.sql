-- Super admin: switch off a user's visiting card and/or mini website independently (data stays, link shows a notice).
create table if not exists public.studio_blocks(
  design_id uuid primary key references public.studio_designs(id) on delete cascade,
  card_off boolean not null default false,
  site_off boolean not null default false,
  note text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.studio_blocks enable row level security;

create or replace function public.studio_admin_set_block(p_design uuid, p_card boolean, p_site boolean, p_note text default '') returns void
language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  insert into studio_blocks(design_id,card_off,site_off,note) values (p_design,coalesce(p_card,false),coalesce(p_site,false),left(coalesce(p_note,''),200))
  on conflict (design_id) do update set card_off=excluded.card_off, site_off=excluded.site_off, note=excluded.note, updated_at=now();
  insert into studio_audit(admin_id,action,target,detail) values (auth.uid(),'block',p_design::text,jsonb_build_object('card_off',coalesce(p_card,false),'site_off',coalesce(p_site,false)));
end $$;
revoke all on function public.studio_admin_set_block(uuid,boolean,boolean,text) from public, anon;
grant execute on function public.studio_admin_set_block(uuid,boolean,boolean,text) to authenticated;

create or replace function public.studio_admin_blocks() returns table(design_id uuid, card_off boolean, site_off boolean, note text)
language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return query select b.design_id,b.card_off,b.site_off,b.note from studio_blocks b where b.card_off or b.site_off;
end $$;
revoke all on function public.studio_admin_blocks() from public, anon;
grant execute on function public.studio_admin_blocks() to authenticated;

create or replace function public.studio_pub_live(p_slug text, p_type text, p_site boolean) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare d record; st text; b record;
begin
  select id into d from studio_designs where slug=p_slug and product_type=p_type and status='published';
  if not found then return jsonb_build_object('live',false,'state','missing'); end if;
  select * into b from studio_blocks where design_id=d.id;
  if found and ((p_site and b.site_off) or (not p_site and b.card_off)) then return jsonb_build_object('live',false,'state','blocked','note',b.note); end if;
  st := studio_sub_state(d.id);
  return jsonb_build_object('live', st in ('free','active','grace'), 'state', st);
end $$;
grant execute on function public.studio_pub_live(text,text,boolean) to anon, authenticated;

-- Owner can see whether SpyWell switched a service off.
create or replace function public.studio_my_block(p_design uuid) returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce((select jsonb_build_object('card_off',b.card_off,'site_off',b.site_off,'note',b.note) from studio_blocks b join studio_designs d on d.id=b.design_id where b.design_id=p_design and (d.user_id=auth.uid() or studio_is_admin())),'{}'::jsonb) $$;
revoke all on function public.studio_my_block(uuid) from public, anon;
grant execute on function public.studio_my_block(uuid) to authenticated;

-- Mini website goes live only with the website plan; the card itself needs just the card plan.
create or replace function public.studio_sub_required(p_id uuid) returns text language sql stable security definer set search_path=public as $$
  select case when product_type='visiting' then 'card' end from studio_designs where id=p_id $$;

create or replace function public.studio_pub_live(p_slug text, p_type text, p_site boolean) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare d record; st text; b record; sp text;
begin
  select id into d from studio_designs where slug=p_slug and product_type=p_type and status='published';
  if not found then return jsonb_build_object('live',false,'state','missing'); end if;
  select * into b from studio_blocks where design_id=d.id;
  if found and ((p_site and b.site_off) or (not p_site and b.card_off)) then return jsonb_build_object('live',false,'state','blocked','note',b.note); end if;
  st := studio_sub_state(d.id);
  if st not in ('free','active','grace') then return jsonb_build_object('live',false,'state',st); end if;
  if p_site and studio_sub_enabled() then
    select plan into sp from studio_subs where design_id=d.id;
    if studio_plan_rank(sp) < 2 then return jsonb_build_object('live',false,'state','site_upgrade'); end if;
  end if;
  return jsonb_build_object('live',true,'state',st);
end $$;
grant execute on function public.studio_pub_live(text,text,boolean) to anon, authenticated;
