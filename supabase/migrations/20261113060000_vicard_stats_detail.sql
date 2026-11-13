create or replace function public.studio_my_stats_detail(p_design uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare o uuid;
begin
  select user_id into o from studio_designs where id=p_design;
  if o is null or o<>auth.uid() then return null; end if;
  return jsonb_build_object(
    'days',coalesce((select jsonb_agg(jsonb_build_object('d',to_char(g.d,'DD Mon'),'n',coalesce(c.n,0)) order by g.d)
        from generate_series(((now() at time zone 'Asia/Kolkata')::date-6),(now() at time zone 'Asia/Kolkata')::date,interval '1 day') g(d)
        left join (select (viewed_at at time zone 'Asia/Kolkata')::date d,count(*) n from studio_views where design_id=p_design group by 1) c on c.d=g.d::date),'[]'::jsonb),
    'devices',coalesce((select jsonb_object_agg(coalesce(device,'other'),n) from (select device,count(*) n from studio_views where design_id=p_design group by device) x),'{}'::jsonb),
    'sources',coalesce((select jsonb_agg(jsonb_build_object('src',src,'n',n) order by n desc) from (select coalesce(nullif(src,''),'direct') src,count(*) n from studio_views where design_id=p_design group by 1 order by 2 desc limit 5) y),'[]'::jsonb));
end $$;
grant execute on function public.studio_my_stats_detail(uuid) to authenticated;
