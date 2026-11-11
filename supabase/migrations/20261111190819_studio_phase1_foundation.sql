-- SpyWell Digital Studio Phase 1 (add-only; no existing object touched)
create table if not exists public.studio_profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name)<=100),
  phone text check (phone is null or char_length(phone)<=20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.studio_roles(
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key(user_id, role)
);
create table if not exists public.studio_templates(
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  product_type text not null check (product_type in ('invitation','visiting')),
  name text not null check (char_length(name)<=80),
  description text,
  preview_url text,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.studio_designs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null references public.studio_templates(id),
  product_type text not null check (product_type in ('invitation','visiting')),
  title text not null default 'Untitled' check (char_length(title)<=120),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  content_json jsonb not null default '{}'::jsonb check (pg_column_size(content_json) < 200000),
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_designs_user_idx on public.studio_designs(user_id, updated_at desc);
create index if not exists studio_designs_status_idx on public.studio_designs(status);
create table if not exists public.studio_assets(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  design_id uuid references public.studio_designs(id) on delete set null,
  path text not null,
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes int not null check (size_bytes>0 and size_bytes<=10485760),
  created_at timestamptz not null default now()
);
create index if not exists studio_assets_user_idx on public.studio_assets(user_id);

create or replace function public.studio_touch() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists studio_profiles_touch on public.studio_profiles;
create trigger studio_profiles_touch before update on public.studio_profiles for each row execute function public.studio_touch();
drop trigger if exists studio_designs_touch on public.studio_designs;
create trigger studio_designs_touch before update on public.studio_designs for each row execute function public.studio_touch();

create or replace function public.studio_is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.studio_roles where user_id=auth.uid() and role='admin')
$$;

create or replace function public.studio_design_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'user_id is immutable'; end if;
  if new.product_type is distinct from old.product_type then raise exception 'product_type is immutable'; end if;
  return new;
end $$;
drop trigger if exists studio_designs_guard on public.studio_designs;
create trigger studio_designs_guard before update on public.studio_designs for each row execute function public.studio_design_guard();

alter table public.studio_profiles enable row level security;
alter table public.studio_roles enable row level security;
alter table public.studio_templates enable row level security;
alter table public.studio_designs enable row level security;
alter table public.studio_assets enable row level security;

create policy sp_select on public.studio_profiles for select to authenticated using (id=auth.uid() or public.studio_is_admin());
create policy sp_insert on public.studio_profiles for insert to authenticated with check (id=auth.uid());
create policy sp_update on public.studio_profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create policy sr_select on public.studio_roles for select to authenticated using (user_id=auth.uid() or public.studio_is_admin());
-- no insert/update/delete policies: roles are granted only server-side (service role / SQL)

create policy st_select on public.studio_templates for select to anon, authenticated using (active or public.studio_is_admin());
create policy st_admin_ins on public.studio_templates for insert to authenticated with check (public.studio_is_admin());
create policy st_admin_upd on public.studio_templates for update to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());
create policy st_admin_del on public.studio_templates for delete to authenticated using (public.studio_is_admin());

create policy sd_select_own on public.studio_designs for select to authenticated using (user_id=auth.uid() or public.studio_is_admin());
create policy sd_select_pub on public.studio_designs for select to anon, authenticated using (status='published');
create policy sd_insert on public.studio_designs for insert to authenticated with check (user_id=auth.uid() and status='draft' and slug is null);
create policy sd_update on public.studio_designs for update to authenticated using (user_id=auth.uid() or public.studio_is_admin()) with check (user_id=auth.uid() or public.studio_is_admin());
create policy sd_delete on public.studio_designs for delete to authenticated using (user_id=auth.uid() or public.studio_is_admin());

create policy sa_select on public.studio_assets for select to authenticated using (user_id=auth.uid() or public.studio_is_admin());
create policy sa_insert on public.studio_assets for insert to authenticated with check (user_id=auth.uid());
create policy sa_delete on public.studio_assets for delete to authenticated using (user_id=auth.uid() or public.studio_is_admin());

insert into public.studio_templates(id,product_type,name,description,preview_url,config,sort) values
 ('inv-1','invitation','Kajal Classic','Fixed-layout royal wedding page','/tpl-preview/t1.jpg','{"legacy_tpl":1}',1),
 ('inv-2','invitation','Green Gold','Fluid theme','/tpl-preview/t2.jpg','{"legacy_tpl":2}',2),
 ('inv-3','invitation','Navy Gold','Fluid theme','/tpl-preview/t3.jpg','{"legacy_tpl":3}',3),
 ('inv-4','invitation','Rose Pink','Fluid theme','/tpl-preview/t4.jpg','{"legacy_tpl":4}',4),
 ('inv-5','invitation','Saffron','Fluid theme','/tpl-preview/t5.jpg','{"legacy_tpl":5}',5)
on conflict (id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('studio-assets','studio-assets',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy studio_assets_insert on storage.objects for insert to authenticated
  with check (bucket_id='studio-assets' and (storage.foldername(name))[1]=auth.uid()::text);
create policy studio_assets_update on storage.objects for update to authenticated
  using (bucket_id='studio-assets' and (storage.foldername(name))[1]=auth.uid()::text);
create policy studio_assets_delete on storage.objects for delete to authenticated
  using (bucket_id='studio-assets' and ((storage.foldername(name))[1]=auth.uid()::text or public.studio_is_admin()));
