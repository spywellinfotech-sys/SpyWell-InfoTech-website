-- Vi-card phase 1: public directory (opt-in), admin flags, saved library fav/collections
create table if not exists public.studio_dir(
  design_id uuid primary key references public.studio_designs(id) on delete cascade,
  is_public boolean not null default false,
  verified boolean not null default false,
  featured boolean not null default false,
  suspended boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.studio_dir enable row level security;  -- no policies, no grants: RPC only
revoke all on public.studio_dir from anon, authenticated;
create index if not exists studio_dir_pub_idx on public.studio_dir(is_public) where is_public and not suspended;

create or replace function public.studio_dir_get(p_design uuid) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare d record; r record;
begin
  select user_id into d from studio_designs where id=p_design;
  if not found or (d.user_id<>auth.uid() and not studio_is_admin()) then return null; end if;
  select * into r from studio_dir where design_id=p_design;
  return jsonb_build_object('is_public',coalesce(r.is_public,false),'verified',coalesce(r.verified,false),
    'featured',coalesce(r.featured,false),'suspended',coalesce(r.suspended,false));
end $$;

create or replace function public.studio_dir_set_public(p_design uuid, p_public boolean) returns text
language plpgsql security definer set search_path=public as $$
declare d record;
begin
  select user_id,product_type into d from studio_designs where id=p_design;
  if not found or d.user_id<>auth.uid() then return 'denied'; end if;
  if d.product_type<>'visiting' then return 'type'; end if;
  insert into studio_dir(design_id,is_public) values(p_design,p_public)
    on conflict (design_id) do update set is_public=excluded.is_public, updated_at=now();
  return 'ok';
end $$;

create or replace function public.studio_admin_dir_set(p_design uuid, p_verified boolean default null, p_featured boolean default null, p_suspended boolean default null) returns text
language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then return 'denied'; end if;
  if not exists(select 1 from studio_designs where id=p_design) then return 'missing'; end if;
  insert into studio_dir(design_id) values(p_design) on conflict do nothing;
  update studio_dir set verified=coalesce(p_verified,verified), featured=coalesce(p_featured,featured),
    suspended=coalesce(p_suspended,suspended), updated_at=now() where design_id=p_design;
  insert into studio_audit(admin_id,action,target,detail) values(auth.uid(),'dir_set',p_design::text,
    jsonb_build_object('verified',p_verified,'featured',p_featured,'suspended',p_suspended));
  return 'ok';
end $$;

-- search: name, business, industry (hi/en names), about, tagline, address (city/state), keywords
create or replace function public.studio_discover(p_q text default '', p_ind text default '', p_off int default 0, p_lim int default 12, p_sort text default 'relevance') returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare q text := lower(btrim(coalesce(p_q,''))); toks text[]; lim int := least(greatest(coalesce(p_lim,12),1),30); off int := greatest(coalesce(p_off,0),0); res jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('error','login'); end if;
  q := left(regexp_replace(q,'[%_\\]',' ','g'),80);
  toks := array(select t from unnest(regexp_split_to_array(q,'\s+')) t where t<>'' limit 6);
  with base as (
    select d.slug,d.published_at,d.created_at,f.f,x.verified,x.featured,
      lower(concat_ws(' ',f.f->>'name',f.f->>'business',f.f->>'designation',f.f->>'about',f.f->>'tagline',f.f->>'address',f.f->>'industry_other',i.name_hi,i.name_en,i.id)) hay,
      lower(concat_ws(' ',f.f->>'name',f.f->>'business')) head, i.name_hi
    from studio_designs d
    join studio_dir x on x.design_id=d.id and x.is_public and not x.suspended
    cross join lateral (select coalesce(d.content_json->'fields','{}'::jsonb) f) f
    left join studio_industries i on i.id=f.f->>'industry'
    where d.product_type='visiting' and d.status='published' and d.slug is not null
      and (coalesce(p_ind,'')='' or f.f->>'industry'=p_ind)
      and not exists(select 1 from studio_blocks b where b.design_id=d.id and b.card_off)
      and coalesce((studio_pub_live(d.slug,'visiting',false)->>'live')::boolean,false)
  ), flt as (
    select b.*, (case when featured then 100 else 0 end)+(select count(*) from unnest(toks) t where b.head like '%'||t||'%')*10 score
    from base b where not exists(select 1 from unnest(toks) t where b.hay not like '%'||t||'%')
  ), pg as (
    select * from flt order by case when p_sort='new' then 0 else score end desc, coalesce(published_at,created_at) desc offset off limit lim
  )
  select jsonb_build_object('total',(select count(*) from flt),'rows',coalesce(jsonb_agg(jsonb_build_object(
    'slug',slug,'name',left(coalesce(f->>'name',''),60),'business',left(coalesce(f->>'business',''),80),'designation',left(coalesce(f->>'designation',''),60),
    'industry',f->>'industry','industry_name',coalesce(name_hi,f->>'industry_other',''),'about',left(coalesce(f->>'about',f->>'tagline',''),140),
    'address',left(coalesce(f->>'address',''),90),'verified',verified,'featured',featured) order by case when p_sort='new' then 0 else score end desc, coalesce(published_at,created_at) desc),'[]'::jsonb))
  into res from pg;
  return res;
end $$;
revoke execute on function public.studio_discover(text,text,int,int,text) from public,anon;
grant execute on function public.studio_discover(text,text,int,int,text) to authenticated;
revoke execute on function public.studio_dir_get(uuid),public.studio_dir_set_public(uuid,boolean),public.studio_admin_dir_set(uuid,boolean,boolean,boolean) from public,anon;
grant execute on function public.studio_dir_get(uuid),public.studio_dir_set_public(uuid,boolean),public.studio_admin_dir_set(uuid,boolean,boolean,boolean) to authenticated;

-- Saved library: favourites + collections (private to owner)
alter table public.studio_saved_cards add column if not exists fav boolean not null default false;
alter table public.studio_saved_cards add column if not exists coll text not null default '' check (char_length(coll)<=30);
alter table public.studio_contacts add column if not exists fav boolean not null default false;
alter table public.studio_contacts add column if not exists coll text not null default '' check (char_length(coll)<=30);
create or replace function public.studio_lib_set(p_src text, p_id uuid, p_fav boolean default null, p_coll text default null) returns text
language plpgsql security definer set search_path=public as $$
declare c text := left(btrim(regexp_replace(coalesce(p_coll,''),'[<>]','','g')),30);
begin
  if auth.uid() is null then return 'login'; end if;
  if p_src='card' then
    update studio_saved_cards set fav=coalesce(p_fav,fav), coll=case when p_coll is null then coll else c end where id=p_id and user_id=auth.uid();
  elsif p_src='man' then
    update studio_contacts set fav=coalesce(p_fav,fav), coll=case when p_coll is null then coll else c end where id=p_id and user_id=auth.uid();
  else return 'bad'; end if;
  return case when found then 'ok' else 'missing' end;
end $$;
revoke execute on function public.studio_lib_set(text,uuid,boolean,text) from public,anon;
grant execute on function public.studio_lib_set(text,uuid,boolean,text) to authenticated;
