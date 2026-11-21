create table if not exists public.studio_greetings(id text primary key,user_id uuid references auth.users(id) on delete set null,data jsonb not null,created_at timestamptz not null default now());
alter table public.studio_greetings enable row level security;
revoke all on public.studio_greetings from anon, authenticated;
create or replace function public.studio_greet_save(p jsonb) returns text language plpgsql security definer set search_path=public as $$
declare k text; n int:=0;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p is null or length(p::text)>3000 then raise exception 'too large'; end if;
  loop
    k:=substr(translate(encode(extensions.gen_random_bytes(6),'base64'),'+/=','xyz'),1,7);
    begin insert into studio_greetings(id,user_id,data) values(k,auth.uid(),p); return k;
    exception when unique_violation then n:=n+1; if n>8 then raise; end if; end;
  end loop;
end $$;
create or replace function public.studio_greet_get(p_id text) returns jsonb language sql stable security definer set search_path=public as $$ select data from studio_greetings where id=p_id $$;
revoke all on function public.studio_greet_save(jsonb) from public, anon;
grant execute on function public.studio_greet_save(jsonb) to authenticated;
grant execute on function public.studio_greet_get(text) to anon, authenticated;
