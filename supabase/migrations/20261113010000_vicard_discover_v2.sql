create table if not exists public.studio_discover_log(id bigserial primary key,user_id uuid not null,at timestamptz not null default now());
alter table public.studio_discover_log enable row level security;
revoke all on public.studio_discover_log from anon,authenticated;
create index if not exists studio_discover_log_idx on public.studio_discover_log(user_id,at);
create or replace function public.studio_discover(p_q text default '', p_ind text default '', p_off int default 0, p_lim int default 12, p_sort text default 'relevance') returns jsonb
language plpgsql volatile security definer set search_path=public as $$
declare q text := lower(btrim(coalesce(p_q,''))); toks text[]; lim int := least(greatest(coalesce(p_lim,12),1),30); off int := greatest(coalesce(p_off,0),0); res jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('error','login'); end if;
  delete from studio_discover_log where at < now() - interval '2 minutes';
  if (select count(*) from studio_discover_log where user_id=auth.uid() and at > now() - interval '1 minute') >= 40 then return jsonb_build_object('error','rate'); end if;
  insert into studio_discover_log(user_id) values(auth.uid());
  q := left(regexp_replace(q,'[%_\\]',' ','g'),80);
  toks := array(select t from unnest(regexp_split_to_array(q,'\s+')) t where t<>'' limit 6);
  with base as (
    select d.slug,d.published_at,d.created_at,f.f,x.verified,x.featured,
      lower(concat_ws(' ',f.f->>'name',f.f->>'business',f.f->>'designation',f.f->>'about',f.f->>'tagline',f.f->>'address',f.f->>'city',f.f->>'state',f.f->>'pin',f.f->>'industry_other',i.name_hi,i.name_en,i.id)) hay,
      lower(concat_ws(' ',f.f->>'name',f.f->>'business')) head, i.name_hi,
      (select u from (select coalesce(d.content_json#>>'{images,logo,url}',d.content_json#>>'{images,photo,url}') u) z where u like 'https://rxhanrtoaplwphmwpgqg.supabase.co/storage/%') img
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
    'address',left(coalesce(f->>'address',''),90),'city',left(coalesce(f->>'city',''),40),'state',left(coalesce(f->>'state',''),40),'img',img,'verified',verified,'featured',featured) order by case when p_sort='new' then 0 else score end desc, coalesce(published_at,created_at) desc),'[]'::jsonb))
  into res from pg;
  return res;
end $$;
grant execute on function public.studio_discover(text,text,int,int,text) to authenticated;
