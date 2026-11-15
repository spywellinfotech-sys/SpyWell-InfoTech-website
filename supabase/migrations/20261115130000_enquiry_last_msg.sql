create or replace function public.studio_my_enquiries(p_limit integer default 50)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object('unread',(select count(*) from studio_enquiries e join studio_designs d on d.id=e.design_id where d.user_id=auth.uid() and not e.is_read),
   'rows',coalesce((select jsonb_agg(r order by (r->>'at') desc) from (select jsonb_build_object('id',e.id,'title',d.title,'name',e.name,'mobile',e.mobile,'message',e.message,'read',e.is_read,'at',e.created_at,'city',e.city,'loc',e.loc_url,
       'last',(select m.body from studio_enquiry_msgs m where m.enquiry_id=e.id order by m.created_at desc limit 1),
       'last_owner',(select m.from_owner from studio_enquiry_msgs m where m.enquiry_id=e.id order by m.created_at desc limit 1)) r
     from studio_enquiries e join studio_designs d on d.id=e.design_id where d.user_id=auth.uid() order by e.created_at desc limit least(greatest(p_limit,1),200)) x),'[]'::jsonb))
$$;
