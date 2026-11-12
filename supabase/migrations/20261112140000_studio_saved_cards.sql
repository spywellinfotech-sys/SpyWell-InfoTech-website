-- Users can save other users' published cards (like a card wallet).
create table if not exists public.studio_saved_cards(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_type text not null check (product_type in ('invitation','visiting')),
  slug text not null,
  title text not null default '',
  subtitle text not null default '',
  created_at timestamptz not null default now(),
  unique(user_id, product_type, slug)
);
create index if not exists studio_saved_cards_user_idx on public.studio_saved_cards(user_id, created_at desc);
alter table public.studio_saved_cards enable row level security;
create policy saved_select_own on public.studio_saved_cards for select to authenticated using (user_id = auth.uid());
create policy saved_delete_own on public.studio_saved_cards for delete to authenticated using (user_id = auth.uid());
grant select, delete on public.studio_saved_cards to authenticated;

create or replace function public.studio_save_card(p_type text, p_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare d record; n int; t text; s text;
begin
  if auth.uid() is null then return 'login'; end if;
  select user_id, title, content_json into d from studio_designs
    where product_type = p_type and slug = lower(p_slug) and status = 'published';
  if not found then return 'missing'; end if;
  if d.user_id = auth.uid() then return 'own'; end if;
  select count(*) into n from studio_saved_cards where user_id = auth.uid();
  if n >= 500 then return 'limit'; end if;
  t := left(coalesce(nullif(d.content_json->'fields'->>'business',''), nullif(d.content_json->'fields'->>'name',''), nullif(d.title,''), p_slug), 80);
  s := left(coalesce(nullif(d.content_json->'fields'->>'name',''), '') || case when coalesce(d.content_json->'fields'->>'designation','') <> '' then ' · ' || (d.content_json->'fields'->>'designation') else '' end, 120);
  insert into studio_saved_cards(user_id, product_type, slug, title, subtitle)
    values (auth.uid(), p_type, lower(p_slug), t, s) on conflict do nothing;
  return 'ok';
end $$;
revoke execute on function public.studio_save_card(text, text) from public, anon;
grant execute on function public.studio_save_card(text, text) to authenticated;
