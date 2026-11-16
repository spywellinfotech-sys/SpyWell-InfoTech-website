create or replace function public.studio_admin_dir_count() returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  if not coalesce(studio_is_admin(),false) then return null; end if;
  return jsonb_build_object(
    'listed',(select count(*) from studio_dir where listed),
    'active',(select count(*) from studio_dir where listed and (paid_until is null or paid_until>now()) and not coalesce(suspended,false)));
end $$;
revoke all on function public.studio_admin_dir_count() from public,anon;
grant execute on function public.studio_admin_dir_count() to authenticated;
