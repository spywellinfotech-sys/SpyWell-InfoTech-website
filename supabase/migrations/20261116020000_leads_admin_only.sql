-- Buy Leads is admin-only for now: open for everyone later with  update studio_settings set v='1' where k='lead_open'
insert into public.studio_settings(k,v) values ('lead_open','0') on conflict (k) do nothing;
create or replace function public.studio_lead_ok() returns boolean language sql stable security definer set search_path=public as $$ select public.studio_is_admin() or public.studio_setting_int('lead_open',0)=1 $$;
revoke all on function public.studio_lead_ok() from public, anon, authenticated;
create or replace function public.studio_lead_ok_me() returns boolean language sql stable security definer set search_path=public as $$ select auth.uid() is not null and public.studio_lead_ok() $$;
revoke all on function public.studio_lead_ok_me() from public, anon;
grant execute on function public.studio_lead_ok_me() to authenticated;
-- guards were added to studio_lead_post / studio_lead_unlock / studio_lead_list: they return 'off' (or no rows) unless studio_lead_ok()
