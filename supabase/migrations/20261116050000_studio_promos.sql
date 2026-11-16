create table if not exists public.studio_promos(
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('landing','image','video','video_url')),
  title text not null,
  url text,
  file_path text,
  note text,
  created_at timestamptz not null default now());
alter table public.studio_promos enable row level security;
drop policy if exists studio_promos_admin on public.studio_promos;
create policy studio_promos_admin on public.studio_promos for all to authenticated using (studio_is_admin()) with check (studio_is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('studio-promo','studio-promo',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do nothing;
drop policy if exists studio_promo_ins on storage.objects;
drop policy if exists studio_promo_upd on storage.objects;
drop policy if exists studio_promo_del on storage.objects;
create policy studio_promo_ins on storage.objects for insert to authenticated with check (bucket_id='studio-promo' and studio_is_admin());
create policy studio_promo_upd on storage.objects for update to authenticated using (bucket_id='studio-promo' and studio_is_admin());
create policy studio_promo_del on storage.objects for delete to authenticated using (bucket_id='studio-promo' and studio_is_admin());
