alter table public.studio_enquiries add column if not exists city text, add column if not exists loc_url text;

drop function if exists public.studio_enquiry_add(text,text,text,text,text);
create or replace function public.studio_enquiry_add(p_slug text, p_name text, p_mobile text, p_message text, p_visitor text default null, p_city text default null, p_loc text default null)
returns text language plpgsql security definer set search_path to 'public' as $$
declare d record; n text := btrim(regexp_replace(coalesce(p_name,''),'[<>]','','g')); m text := btrim(regexp_replace(coalesce(p_message,''),'[<>]','','g')); mb text := regexp_replace(coalesce(p_mobile,''),'\D','','g');
  c text := left(btrim(regexp_replace(coalesce(p_city,''),'[<>]','','g')),80); l text := case when coalesce(p_loc,'') ~* '^https://(www\.google\.com/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/maps)' then left(p_loc,300) else null end;
begin
  mb := right(mb,10);
  if char_length(n) not between 1 and 60 or char_length(m) not between 1 and 500 or mb !~ '^[6-9][0-9]{9}$' then return 'bad'; end if;
  select id into d from studio_designs where product_type='visiting' and status='published' and slug=lower(coalesce(p_slug,''));
  if not found then return 'missing'; end if;
  if coalesce((studio_pub_live(lower(p_slug),'visiting',true)->>'live')::boolean,false) is not true then return 'closed'; end if;
  if (select count(*) from studio_enquiries where design_id=d.id and mobile=mb and created_at>now()-interval '1 hour')>=3
     or (select count(*) from studio_enquiries where design_id=d.id and created_at>now()-interval '1 day')>=100 then return 'limit'; end if;
  insert into studio_enquiries(design_id,name,mobile,message,visitor,city,loc_url) values(d.id,left(n,60),mb,left(m,500),left(p_visitor,64),nullif(c,''),l);
  return 'ok';
end $$;
grant execute on function public.studio_enquiry_add(text,text,text,text,text,text,text) to anon, authenticated;

create or replace function public.studio_my_enquiries(p_limit integer default 50)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('unread',(select count(*) from studio_enquiries e join studio_designs d on d.id=e.design_id where d.user_id=auth.uid() and not e.is_read),
   'rows',coalesce((select jsonb_agg(r order by (r->>'at') desc) from (select jsonb_build_object('id',e.id,'title',d.title,'name',e.name,'mobile',e.mobile,'message',e.message,'read',e.is_read,'at',e.created_at,'city',e.city,'loc',e.loc_url) r
     from studio_enquiries e join studio_designs d on d.id=e.design_id where d.user_id=auth.uid() order by e.created_at desc limit least(greatest(p_limit,1),200)) x),'[]'::jsonb))
$$;
