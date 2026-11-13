alter table public.studio_profiles add column if not exists card_json jsonb not null default '{}'::jsonb;
