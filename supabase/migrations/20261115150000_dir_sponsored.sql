-- Sponsored slideshow at the top of the Directory (paid placement, switched on by admin)
alter table public.studio_dir add column if not exists sponsor_until timestamptz;
alter table public.studio_dir add column if not exists sponsor_city text not null default '' check (char_length(sponsor_city)<=60);
create table if not exists public.studio_sponsor_stats(design_id uuid not null references public.studio_designs(id) on delete cascade, kind text not null check (kind in ('view','card','site','call','wa','link')), n integer not null default 0, primary key(design_id,kind));
alter table public.studio_sponsor_stats enable row level security; -- RPC only

create or replace function public.studio_dir_sponsored(p_city text default '') returns jsonb
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null or not public.studio_dir_open() then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(r) from (
    select jsonb_build_object('slug',d.slug,'name',left(coalesce(f.f->>'name',''),60),'business',left(coalesce(f.f->>'business',''),80),'designation',left(coalesce(f.f->>'designation',''),60),
      'industry_name',coalesce(i.name_hi,''),'city',coalesce(nullif(btrim(f.f->>'city'),''),x.city),'about',left(coalesce(f.f->>'about',f.f->>'tagline',''),160),
      'img',(select u from (select coalesce(d.content_json#>>'{images,logo,url}',d.content_json#>>'{images,photo,url}') u) z where u like 'https://rxhanrtoaplwphmwpgqg.supabase.co/storage/%'),
      'verified',x.verified,'site',(coalesce(d.content_json#>>'{style,site}','')='true'),
      'mobile',left(regexp_replace(coalesce(f.f->>'mobile',''),'\D','','g'),15),'wa',left(regexp_replace(coalesce(nullif(f.f->>'whatsapp',''),f.f->>'mobile',''),'\D','','g'),15),
      'website',case when f.f->>'website' ~* '^https?://' then left(f.f->>'website',200) end,
      'facebook',case when f.f->>'facebook' ~* '^https?://' then left(f.f->>'facebook',200) end,
      'instagram',case when f.f->>'instagram' ~* '^https?://' then left(f.f->>'instagram',200) end,
      'youtube',case when f.f->>'youtube' ~* '^https?://' then left(f.f->>'youtube',200) end,
      'map',case when f.f->>'maplink' ~* '^https?://' then left(f.f->>'maplink',300) end) r
    from studio_designs d join studio_dir x on x.design_id=d.id and x.listed and not x.suspended and (x.paid_until is null or x.paid_until>now()) and x.sponsor_until>now()
    cross join lateral (select coalesce(d.content_json->'fields','{}'::jsonb) f) f
    left join studio_industries i on i.id=f.f->>'industry'
    where d.product_type='visiting' and d.status='published' and d.slug is not null and not exists(select 1 from studio_blocks b where b.design_id=d.id and b.card_off)
      and (x.sponsor_city='' or coalesce(p_city,'')='' or lower(x.sponsor_city)=lower(btrim(p_city)))
    order by random() limit 8) q),'[]'::jsonb);
end $$;
revoke all on function public.studio_dir_sponsored(text) from public, anon;
grant execute on function public.studio_dir_sponsored(text) to authenticated;

create or replace function public.studio_sponsor_hit(p_slug text, p_kind text) returns void
language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
  if auth.uid() is null or p_kind not in ('view','card','site','call','wa','link') then return; end if;
  select d.id into id from studio_designs d join studio_dir x on x.design_id=d.id where d.slug=lower(coalesce(p_slug,'')) and d.product_type='visiting' and x.sponsor_until>now();
  if id is null then return; end if;
  insert into studio_sponsor_stats(design_id,kind,n) values(id,p_kind,1) on conflict (design_id,kind) do update set n=studio_sponsor_stats.n+1;
end $$;
revoke all on function public.studio_sponsor_hit(text,text) from public, anon;
grant execute on function public.studio_sponsor_hit(text,text) to authenticated;

create or replace function public.studio_dir_sponsor_set(p_design uuid, p_days integer default null, p_city text default null) returns text
language plpgsql security definer set search_path=public as $$
begin
  if not studio_is_admin() then return 'denied'; end if;
  if not exists(select 1 from studio_dir where design_id=p_design) then return 'missing'; end if;
  update studio_dir set
    sponsor_until = case when p_days is null then sponsor_until when p_days<=0 then null else greatest(coalesce(sponsor_until,now()),now())+make_interval(days=>least(p_days,366)) end,
    sponsor_city = coalesce(left(btrim(regexp_replace(p_city,'[<>]','','g')),60), sponsor_city), updated_at=now()
  where design_id=p_design;
  return 'ok';
end $$;
revoke all on function public.studio_dir_sponsor_set(uuid,integer,text) from public, anon;
grant execute on function public.studio_dir_sponsor_set(uuid,integer,text) to authenticated;

create or replace function public.studio_dir_sponsor_stats() returns jsonb language plpgsql stable security definer set search_path=public as $$
begin
  if not studio_is_admin() then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('design_id',x.design_id,'until',x.sponsor_until,'city',x.sponsor_city,
    'stats',coalesce((select jsonb_object_agg(kind,n) from studio_sponsor_stats s where s.design_id=x.design_id),'{}'::jsonb))) from studio_dir x where x.sponsor_until is not null),'[]'::jsonb);
end $$;
revoke all on function public.studio_dir_sponsor_stats() from public, anon;
grant execute on function public.studio_dir_sponsor_stats() to authenticated;
