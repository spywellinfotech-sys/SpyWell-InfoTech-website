-- Custom-domain upgrade for mini websites: the customer submits a domain, the admin connects it.
insert into public.studio_settings(k, v) values ('domain_price_inr', '') on conflict (k) do nothing;

create table if not exists public.studio_domain_requests(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  design_id uuid not null references public.studio_designs(id) on delete cascade,
  domain text not null check (length(domain) <= 253 and domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$'),
  status text not null default 'pending' check (status in ('pending','active','rejected')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (design_id)
);
create unique index if not exists studio_domain_requests_domain_active on public.studio_domain_requests(domain) where status <> 'rejected';
alter table public.studio_domain_requests enable row level security;
drop policy if exists sdr_select on public.studio_domain_requests;
create policy sdr_select on public.studio_domain_requests for select to authenticated using (user_id = auth.uid());

create or replace function public.studio_request_domain(p_design uuid, p_domain text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d text := lower(trim(coalesce(p_domain,''))); own uuid; r public.studio_domain_requests;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
  d := regexp_replace(d, '^https?://', ''); d := regexp_replace(d, '/.*$', ''); d := regexp_replace(d, '^www\.', '');
  select user_id into own from studio_designs where id = p_design and product_type = 'visiting';
  if own is null or own <> auth.uid() then raise exception 'forbidden' using errcode='42501'; end if;
  if d !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' or length(d) > 253 then raise exception 'bad_domain'; end if;
  if d = 'spywell.in' or d like '%.spywell.in' then raise exception 'bad_domain'; end if;
  if exists (select 1 from studio_domain_requests where domain = d and status <> 'rejected' and design_id <> p_design) then raise exception 'domain_taken'; end if;
  insert into studio_domain_requests(user_id, design_id, domain) values (auth.uid(), p_design, d)
    on conflict (design_id) do update set domain = excluded.domain, status = 'pending', note = '', updated_at = now()
    returning * into r;
  return jsonb_build_object('id', r.id, 'domain', r.domain, 'status', r.status);
end $$;
revoke execute on function public.studio_request_domain(uuid, text) from public, anon;
grant execute on function public.studio_request_domain(uuid, text) to authenticated;

create or replace function public.studio_admin_domains()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select q.id, q.domain, q.status, q.note, q.created_at, g.slug, g.title, u.email
    from studio_domain_requests q join studio_designs g on g.id = q.design_id left join auth.users u on u.id = q.user_id
    order by q.created_at desc limit 200) x), '[]'::jsonb);
end $$;
revoke execute on function public.studio_admin_domains() from public, anon;
grant execute on function public.studio_admin_domains() to authenticated;

create or replace function public.studio_admin_set_domain(p_id uuid, p_status text, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode='42501'; end if;
  if p_status not in ('pending','active','rejected') then raise exception 'bad status'; end if;
  update studio_domain_requests set status = p_status, note = left(coalesce(p_note,''), 300), updated_at = now() where id = p_id;
  insert into studio_audit(admin_id, action, target, detail) values (auth.uid(), 'domain:' || p_status, p_id::text, jsonb_build_object('note', left(coalesce(p_note,''), 300)));
end $$;
revoke execute on function public.studio_admin_set_domain(uuid, text, text) from public, anon;
grant execute on function public.studio_admin_set_domain(uuid, text, text) to authenticated;
