-- Mini Website URL is stored in its own field (fields.miniweb) so an existing own website is never replaced.
create or replace function public.studio_site_url_fill() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare u text;
begin
  if new.product_type='visiting' and new.slug is not null and new.slug<>'' and exists(select 1 from studio_subs s where s.design_id=new.id and s.plan in ('site','domain')) then
    u := 'https://spywell.in/web/'||new.slug;
    new.content_json := jsonb_set(coalesce(new.content_json,'{}'::jsonb),'{fields}',coalesce(new.content_json->'fields','{}'::jsonb)||jsonb_build_object('miniweb',u),true);
    if new.content_json->'fields'->>'website' = u then
      new.content_json := jsonb_set(new.content_json,'{fields}',(new.content_json->'fields')-'website',true);
    end if;
  end if;
  return new;
end $$;
update public.studio_designs d set updated_at=d.updated_at where d.product_type='visiting' and d.slug is not null and exists(select 1 from studio_subs s where s.design_id=d.id and s.plan in ('site','domain'));
