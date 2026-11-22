drop policy if exists fu_admin_all on public.studio_followups;
create policy fu_own_all on public.studio_followups for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.studio_bc_allowed() returns text language sql stable security definer set search_path to 'public' as $$
  select case when auth.uid() is null then 'no' when studio_is_admin() then 'admin' else 'listed' end $$;
