-- Industry master list, richer saved cards, personal contacts, admin industry stats.
create table if not exists public.studio_industries(
  id text primary key, name_en text not null, name_hi text not null, sort int not null default 0
);
alter table public.studio_industries enable row level security;
drop policy if exists ind_read on public.studio_industries;
create policy ind_read on public.studio_industries for select to anon, authenticated using (true);
grant select on public.studio_industries to anon, authenticated;
insert into public.studio_industries(id,name_en,name_hi,sort) values
('retail','Retail / General Store','रिटेल / जनरल स्टोर',1),('grocery','Grocery / Kirana','किराना / राशन',2),('food','Restaurant / Food / Catering','रेस्टोरेंट / खाना / कैटरिंग',3),
('sweets','Sweets / Bakery','मिठाई / बेकरी',4),('clothing','Clothing / Garments','कपड़े / गारमेंट्स',5),('footwear','Footwear','जूते-चप्पल',6),
('jewellery','Jewellery','ज्वेलरी / सुनार',7),('electronics','Electronics / Mobile','इलेक्ट्रॉनिक्स / मोबाइल',8),('electrical','Electrician / Electrical','इलेक्ट्रीशियन / बिजली',9),
('plumber','Plumber / Sanitary','प्लंबर / सैनिटरी',10),('carpenter','Carpenter / Furniture','कारपेंटर / फर्नीचर',11),('construction','Construction / Contractor','निर्माण / ठेकेदार',12),
('hardware','Hardware / Paint','हार्डवेयर / पेंट',13),('realestate','Real Estate / Property','प्रॉपर्टी / रियल एस्टेट',14),('auto','Auto / Garage / Mechanic','ऑटो / गैराज / मैकेनिक',15),
('carrental','Taxi / Car Rental / Travel','टैक्सी / कार रेंटल / ट्रैवल',16),('transport','Transport / Logistics','ट्रांसपोर्ट / लॉजिस्टिक्स',17),('medical','Doctor / Clinic / Hospital','डॉक्टर / क्लिनिक / अस्पताल',18),
('pharmacy','Medical Store / Pharmacy','मेडिकल स्टोर / दवाई',19),('lab','Diagnostic Lab','पैथोलॉजी / लैब',20),('education','School / Coaching / Tutor','स्कूल / कोचिंग / ट्यूटर',21),
('legal','Lawyer / Legal','वकील / कानूनी',22),('ca','CA / Accounting / Tax','सीए / अकाउंटिंग / टैक्स',23),('finance','Finance / Loan / Insurance','फाइनेंस / लोन / बीमा',24),
('it','IT / Software / Web','आईटी / सॉफ्टवेयर / वेब',25),('cctv','CCTV / Security','सीसीटीवी / सिक्योरिटी',26),('marketing','Marketing / Printing / Flex','मार्केटिंग / प्रिंटिंग / फ्लेक्स',27),
('photo','Photography / Video','फोटोग्राफी / वीडियो',28),('event','Event / Tent / Decoration','इवेंट / टेंट / डेकोरेशन',29),('salon','Salon / Beauty / Parlour','सैलून / ब्यूटी पार्लर',30),
('fitness','Gym / Fitness / Yoga','जिम / फिटनेस / योग',31),('agri','Agriculture / Seeds / Fertilizer','खेती / बीज / खाद',32),('dairy','Dairy / Milk','डेयरी / दूध',33),
('manufacture','Manufacturing / Factory','मैन्युफैक्चरिंग / फैक्ट्री',34),('recycling','Recycling / Scrap','रीसाइक्लिंग / कबाड़',35),('hotel','Hotel / Guest House','होटल / गेस्ट हाउस',36),
('ngo','NGO / Social / Religious','एनजीओ / सामाजिक / धार्मिक',37),('govt','Government / Politics','सरकारी / राजनीति',38),('freelance','Freelancer / Consultant','फ्रीलांसर / सलाहकार',39),
('other','Other','अन्य',99)
on conflict (id) do nothing;

alter table public.studio_saved_cards add column if not exists industry text not null default '';
alter table public.studio_saved_cards add column if not exists mobile text not null default '';
alter table public.studio_saved_cards add column if not exists whatsapp text not null default '';

create or replace function public.studio_save_card(p_type text, p_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare d record; n int; t text; s text; f jsonb;
begin
  if auth.uid() is null then return 'login'; end if;
  select user_id, title, content_json into d from studio_designs
    where product_type = p_type and slug = lower(p_slug) and status = 'published';
  if not found then return 'missing'; end if;
  if d.user_id = auth.uid() then return 'own'; end if;
  select count(*) into n from studio_saved_cards where user_id = auth.uid();
  if n >= 500 then return 'limit'; end if;
  f := coalesce(d.content_json->'fields','{}'::jsonb);
  t := left(coalesce(nullif(f->>'business',''), nullif(f->>'name',''), nullif(d.title,''), p_slug), 80);
  s := left(coalesce(nullif(f->>'name',''), '') || case when coalesce(f->>'designation','') <> '' then ' · ' || (f->>'designation') else '' end, 120);
  insert into studio_saved_cards(user_id, product_type, slug, title, subtitle, industry, mobile, whatsapp)
    values (auth.uid(), p_type, lower(p_slug), t, s,
      case when p_type='visiting' then left(coalesce(f->>'industry',''),30) else '' end,
      case when p_type='visiting' and coalesce(f->>'mobile','') ~ '^[6-9][0-9]{9}$' then f->>'mobile' else '' end,
      case when p_type='visiting' and coalesce(f->>'whatsapp','') ~ '^[6-9][0-9]{9}$' then f->>'whatsapp' else '' end)
    on conflict do nothing;
  return 'ok';
end $$;
revoke execute on function public.studio_save_card(text, text) from public, anon;
grant execute on function public.studio_save_card(text, text) to authenticated;

create table if not exists public.studio_contacts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  business text not null default '' check (char_length(business) <= 80),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  industry text not null default '' check (char_length(industry) <= 30),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  unique(user_id, mobile)
);
create index if not exists studio_contacts_user_idx on public.studio_contacts(user_id, created_at desc);
alter table public.studio_contacts enable row level security;
create policy contacts_own_select on public.studio_contacts for select to authenticated using (user_id = auth.uid());
create policy contacts_own_insert on public.studio_contacts for insert to authenticated with check (user_id = auth.uid());
create policy contacts_own_update on public.studio_contacts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy contacts_own_delete on public.studio_contacts for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.studio_contacts to authenticated;

-- Admin: industry-wise count of published visiting cards.
create or replace function public.studio_industry_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not studio_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by (x->>'n')::int desc) from (
    select jsonb_build_object('industry', coalesce(nullif(content_json->'fields'->>'industry',''),'(not set)'),
      'n', count(*), 'published', count(*) filter (where status='published')) x
    from studio_designs where product_type='visiting' group by 1 ) q), '[]'::jsonb);
end $$;
revoke execute on function public.studio_industry_stats() from public, anon;
grant execute on function public.studio_industry_stats() to authenticated;
