-- Nirog trigger function: same body as before; only addition is the early return for Studio sign-ups
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  if coalesce(new.raw_user_meta_data ->> 'app', '') = 'studio' then
    return new;
  end if;
  insert into public.profiles (id, role, full_name, phone, email)
  values (new.id, 'patient',
          left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80),
          nullif(regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g'), ''),
          new.email);
  insert into public.patients (id) values (new.id);
  return new;
end $function$;
