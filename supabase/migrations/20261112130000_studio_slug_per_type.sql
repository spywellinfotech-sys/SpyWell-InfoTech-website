alter table public.studio_designs drop constraint studio_designs_slug_key;
create unique index studio_designs_type_slug_key on public.studio_designs(product_type, slug) where slug is not null;
create or replace function public.studio_slug_free(p_slug text, p_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(p_slug) between 3 and 60
     and not exists(select 1 from public.studio_designs d where d.slug=p_slug and d.id is distinct from p_id
       and d.product_type=(select product_type from public.studio_designs where id=p_id))
$$;
