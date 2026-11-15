-- Enquiry conversation: the card owner can reply to an enquiry, the visitor (identified by the random visitor id kept on his phone) sees the thread and can answer.
create table if not exists public.studio_enquiry_msgs (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.studio_enquiries(id) on delete cascade,
  from_owner boolean not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists studio_enquiry_msgs_enq on public.studio_enquiry_msgs(enquiry_id, created_at);
alter table public.studio_enquiry_msgs enable row level security; -- no policies: only the security-definer functions below read or write

create or replace function public.studio_enquiry_reply(p_enquiry uuid, p_body text) returns text
language plpgsql security definer set search_path = public as $$
declare b text := left(btrim(regexp_replace(coalesce(p_body,''),'[<>]','','g')),500);
begin
  if auth.uid() is null or char_length(b) < 1 then return 'bad'; end if;
  if not exists (select 1 from studio_enquiries e join studio_designs d on d.id = e.design_id where e.id = p_enquiry and d.user_id = auth.uid()) then return 'missing'; end if;
  if (select count(*) from studio_enquiry_msgs where enquiry_id = p_enquiry and from_owner and created_at > now() - interval '1 day') >= 30 then return 'limit'; end if;
  insert into studio_enquiry_msgs(enquiry_id, from_owner, body) values (p_enquiry, true, b);
  update studio_enquiries set is_read = true where id = p_enquiry;
  return 'ok';
end $$;
revoke all on function public.studio_enquiry_reply(uuid,text) from public, anon;
grant execute on function public.studio_enquiry_reply(uuid,text) to authenticated;

create or replace function public.studio_enquiry_msgs_owner(p_enquiry uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_agg(jsonb_build_object('mine', m.from_owner, 'body', m.body, 'at', m.created_at) order by m.created_at)
    from studio_enquiry_msgs m join studio_enquiries e on e.id = m.enquiry_id join studio_designs d on d.id = e.design_id
    where m.enquiry_id = p_enquiry and d.user_id = auth.uid()), '[]'::jsonb)
$$;
revoke all on function public.studio_enquiry_msgs_owner(uuid) from public, anon;
grant execute on function public.studio_enquiry_msgs_owner(uuid) to authenticated;

create or replace function public.studio_enquiry_thread(p_slug text, p_visitor text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when char_length(coalesce(p_visitor,'')) < 8 then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object('id', e.id, 'message', e.message, 'at', e.created_at,
      'msgs', coalesce((select jsonb_agg(jsonb_build_object('owner', m.from_owner, 'body', m.body, 'at', m.created_at) order by m.created_at) from studio_enquiry_msgs m where m.enquiry_id = e.id), '[]'::jsonb)) order by e.created_at desc)
    from studio_enquiries e join studio_designs d on d.id = e.design_id
    where d.slug = lower(coalesce(p_slug,'')) and d.product_type = 'visiting' and e.visitor = p_visitor), '[]'::jsonb) end
$$;
grant execute on function public.studio_enquiry_thread(text,text) to anon, authenticated;

create or replace function public.studio_enquiry_visitor_reply(p_slug text, p_visitor text, p_enquiry uuid, p_body text) returns text
language plpgsql security definer set search_path = public as $$
declare b text := left(btrim(regexp_replace(coalesce(p_body,''),'[<>]','','g')),500);
begin
  if char_length(coalesce(p_visitor,'')) < 8 or char_length(b) < 1 then return 'bad'; end if;
  if not exists (select 1 from studio_enquiries e join studio_designs d on d.id = e.design_id
     where e.id = p_enquiry and e.visitor = p_visitor and d.slug = lower(coalesce(p_slug,'')) and d.product_type = 'visiting') then return 'missing'; end if;
  if (select count(*) from studio_enquiry_msgs where enquiry_id = p_enquiry and not from_owner and created_at > now() - interval '1 hour') >= 10 then return 'limit'; end if;
  insert into studio_enquiry_msgs(enquiry_id, from_owner, body) values (p_enquiry, false, b);
  update studio_enquiries set is_read = false where id = p_enquiry;
  return 'ok';
end $$;
grant execute on function public.studio_enquiry_visitor_reply(text,text,uuid,text) to anon, authenticated;
