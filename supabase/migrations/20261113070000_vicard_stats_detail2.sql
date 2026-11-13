create or replace function public.studio_my_stats_detail(p_design uuid) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare o uuid;
begin
  select user_id into o from studio_designs where id=p_design;
  if o is null or o<>auth.uid() then return null; end if;
  return jsonb_build_object(
    'days',coalesce((select jsonb_agg(jsonb_build_object('d',to_char(g.d,'DD Mon'),'n',coalesce(c.n,0)) order by g.d)
        from generate_series(((now() at time zone 'Asia/Kolkata')::date-13),(now() at time zone 'Asia/Kolkata')::date,interval '1 day') g(d)
        left join (select (viewed_at at time zone 'Asia/Kolkata')::date d,count(*) n from studio_views where design_id=p_design group by 1) c on c.d=g.d::date),'[]'::jsonb),
    'devices',coalesce((select jsonb_object_agg(coalesce(device,'other'),n) from (select device,count(*) n from studio_views where design_id=p_design group by device) x),'{}'::jsonb),
    'sources',coalesce((select jsonb_agg(jsonb_build_object('src',src,'n',n) order by n desc) from (select coalesce(nullif(src,''),'direct') src,count(*) n from studio_views where design_id=p_design group by 1 order by 2 desc limit 5) y),'[]'::jsonb),
    'visitors',coalesce((select jsonb_agg(jsonb_build_object('name',l.name,'mobile',l.mobile,'views',l.views,
        'clicks',(select count(*) from studio_clicks k where k.design_id=p_design and k.visitor=l.visitor and l.visitor is not null),
        'last',l.last_seen) order by l.last_seen desc nulls last)
        from (select * from studio_card_leads where design_id=p_design order by last_seen desc nulls last limit 50) l),'[]'::jsonb),
    'recent',coalesce((select jsonb_agg(jsonb_build_object('t',t,'kind',kind,'what',what) order by t desc)
        from (select * from (
          select viewed_at t,'view' kind,coalesce(surface,'card') what from studio_views where design_id=p_design
          union all select clicked_at,'click',kind from studio_clicks where design_id=p_design) u order by t desc limit 15) r),'[]'::jsonb));
end $$;
grant execute on function public.studio_my_stats_detail(uuid) to authenticated;
