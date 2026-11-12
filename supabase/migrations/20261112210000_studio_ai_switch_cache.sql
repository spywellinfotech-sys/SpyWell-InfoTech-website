-- AI on/off switch (admin) and per-user result cache so the same upload is not paid for twice.
insert into public.studio_settings(k, v) values ('ai_enabled', '1') on conflict (k) do nothing;

create table if not exists public.studio_ai_cache(
  user_id uuid not null references auth.users(id) on delete cascade,
  hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, hash)
);
alter table public.studio_ai_cache enable row level security;
-- no policies: only the edge function (service role) reads and writes it

create or replace function public.studio_ai_flag()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select v from studio_settings where k = 'ai_enabled'), '1') <> '0';
end $$;
create or replace function public.studio_admin_set_ai(p_enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into studio_settings(k, v) values ('ai_enabled', case when p_enabled then '1' else '0' end)
    on conflict (k) do update set v = excluded.v;
end $$;
revoke execute on function public.studio_ai_flag() from public, anon;
revoke execute on function public.studio_admin_set_ai(boolean) from public, anon;
grant execute on function public.studio_ai_flag() to authenticated;
grant execute on function public.studio_admin_set_ai(boolean) to authenticated;
