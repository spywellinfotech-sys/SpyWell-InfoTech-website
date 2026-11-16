create or replace function public.studio_admin_services() returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  if not coalesce(studio_is_admin(),false) then raise exception 'forbidden' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(x order by x->>'u' desc) from (
    select jsonb_build_object('id',d.id,'uid',d.user_id,'n',p.full_name,'e',u.email,'ph',p.phone,'t',d.product_type,'ti',d.title,
      'st',d.status,'sl',d.slug,'u',d.updated_at,'pl',s.plan,'pu',s.paid_until,
      'ls',coalesce(r.listed,false),'dc',r.city,'du',r.paid_until,'sp',coalesce(r.suspended,false)) x
    from studio_designs d
    left join studio_profiles p on p.id=d.user_id
    left join auth.users u on u.id=d.user_id
    left join studio_subs s on s.design_id=d.id
    left join studio_dir r on r.design_id=d.id) q),'[]'::jsonb);
end $$;
revoke all on function public.studio_admin_services() from public,anon;
grant execute on function public.studio_admin_services() to authenticated;
