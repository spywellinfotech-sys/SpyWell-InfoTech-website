-- Admin-editable AI limits and an audit log of admin actions.
insert into public.studio_settings(k, v) values
  ('ai_model', ''), ('ai_daily_limit', '10'), ('ai_max_pages', '4'), ('ai_max_file_mb', '10')
on conflict (k) do nothing;

create table if not exists public.studio_audit(
  id bigserial primary key,
  admin_id uuid,
  action text not null,
  target text not null default '',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.studio_audit enable row level security;  -- no policies: read only through studio_admin_audit()

create or replace function public.studio_audit_trg() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tgt text; det jsonb;
begin
  if uid is null or not studio_is_admin() then return coalesce(new, old); end if;
  if tg_table_name = 'studio_settings' then
    tgt := coalesce(new.k, old.k); det := jsonb_build_object('from', case when tg_op='INSERT' then null else old.v end, 'to', case when tg_op='DELETE' then null else new.v end);
  elsif tg_table_name = 'studio_templates' then
    tgt := coalesce(new.id, old.id); det := jsonb_build_object('active', case when tg_op='DELETE' then null else new.active end);
  else -- studio_designs: only when the admin acts on somebody else's design
    if coalesce(new.user_id, old.user_id) = uid then return coalesce(new, old); end if;
    tgt := coalesce(new.id, old.id)::text;
    det := jsonb_build_object('owner', coalesce(new.user_id, old.user_id), 'status', case when tg_op='DELETE' then null else new.status end);
  end if;
  insert into studio_audit(admin_id, action, target, detail) values (uid, tg_table_name || ':' || lower(tg_op), tgt, det);
  return coalesce(new, old);
end $$;
revoke execute on function public.studio_audit_trg() from public, anon, authenticated;

drop trigger if exists studio_settings_audit on public.studio_settings;
create trigger studio_settings_audit after insert or update or delete on public.studio_settings for each row execute function public.studio_audit_trg();
drop trigger if exists studio_templates_audit on public.studio_templates;
create trigger studio_templates_audit after insert or update or delete on public.studio_templates for each row execute function public.studio_audit_trg();
drop trigger if exists studio_designs_audit on public.studio_designs;
create trigger studio_designs_audit after update or delete on public.studio_designs for each row execute function public.studio_audit_trg();

create or replace function public.studio_admin_audit(p_limit int default 40)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x) from (select action, target, detail, created_at, admin_id from studio_audit order by id desc limit greatest(1, least(p_limit, 200))) x), '[]'::jsonb);
end $$;
revoke execute on function public.studio_admin_audit(int) from public, anon;
grant execute on function public.studio_admin_audit(int) to authenticated;

create or replace function public.studio_admin_set_ai_config(p_model text, p_limit int, p_pages int, p_mb int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_model is not null and p_model <> '' and p_model !~ '^[a-z0-9][a-z0-9.\-]{2,59}$' then raise exception 'bad model'; end if;
  if p_limit < 1 or p_limit > 1000 or p_pages < 1 or p_pages > 4 or p_mb < 1 or p_mb > 15 then raise exception 'bad limits'; end if;
  insert into studio_settings(k, v) values ('ai_model', coalesce(p_model,'')), ('ai_daily_limit', p_limit::text), ('ai_max_pages', p_pages::text), ('ai_max_file_mb', p_mb::text)
    on conflict (k) do update set v = excluded.v;
end $$;
revoke execute on function public.studio_admin_set_ai_config(text, int, int, int) from public, anon;
grant execute on function public.studio_admin_set_ai_config(text, int, int, int) to authenticated;
