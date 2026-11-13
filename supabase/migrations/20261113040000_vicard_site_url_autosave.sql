-- When a card has a Mini Website plan (site/domain), its website URL is auto-saved on the visiting card.
create or replace function public.studio_site_url_fill() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.product_type='visiting' and new.slug is not null and new.slug<>''
     and coalesce(nullif(btrim(new.content_json->'fields'->>'website'),''),'')=''
     and exists(select 1 from studio_subs s where s.design_id=new.id and s.plan in ('site','domain')) then
    new.content_json := jsonb_set(coalesce(new.content_json,'{}'::jsonb),'{fields}',coalesce(new.content_json->'fields','{}'::jsonb)||jsonb_build_object('website','https://spywell.in/web/'||new.slug),true);
  end if;
  return new;
end $$;
drop trigger if exists studio_designs_site_url on public.studio_designs;
create trigger studio_designs_site_url before insert or update on public.studio_designs for each row execute function public.studio_site_url_fill();

create or replace function public.studio_subs_site_url() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.plan in ('site','domain') then update studio_designs set updated_at=updated_at where id=new.design_id; end if;
  return new;
end $$;
drop trigger if exists studio_subs_site_url on public.studio_subs;
create trigger studio_subs_site_url after insert or update on public.studio_subs for each row execute function public.studio_subs_site_url();

-- backfill existing upgraded cards
update public.studio_designs d set updated_at=d.updated_at where d.product_type='visiting' and d.slug is not null and exists(select 1 from studio_subs s where s.design_id=d.id and s.plan in ('site','domain'));
