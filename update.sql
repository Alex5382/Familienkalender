-- ═══════════════════════════════════════════════════════════════
-- Unser Kalender · Update (kumulativ, beliebig oft ausführbar)
-- Supabase → SQL Editor → New query → einfügen → Run
-- ═══════════════════════════════════════════════════════════════

-- Frühere Updates (falls noch nicht geschehen)
alter table public.tasks  add column if not exists completed_at timestamptz;
alter table public.events add column if not exists created_by uuid;
alter table public.tasks  add column if not exists created_by uuid;

-- Einzel-Ausnahmen bei Serienterminen („Nur diesen Termin“)
alter table public.events
  add column if not exists exdates date[] not null default '{}';

-- Eigene Listen (z. B. Einkaufsliste)
create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tasks
  add column if not exists list_id uuid references public.lists(id) on delete cascade;
alter table public.lists enable row level security;
drop policy if exists "familie_alles" on public.lists;
create policy "familie_alles" on public.lists
  for all to authenticated using (true) with check (true);
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lists') then
    execute 'alter publication supabase_realtime add table public.lists';
  end if;
end $$;

-- ── NEU: Erinnerungen & Push ──
alter table public.events
  add column if not exists reminder_minutes int;

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid,
  endpoint     text not null unique,
  subscription jsonb not null,
  device       text,
  created_at   timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "familie_alles" on public.push_subscriptions;
create policy "familie_alles" on public.push_subscriptions
  for all to authenticated using (true) with check (true);

create table if not exists public.reminders_sent (
  event_id         uuid not null,
  occ_date         date not null,
  reminder_minutes int,
  sent_at          timestamptz not null default now(),
  primary key (event_id, occ_date)
);
alter table public.reminders_sent enable row level security;
drop policy if exists "familie_alles" on public.reminders_sent;
create policy "familie_alles" on public.reminders_sent
  for all to authenticated using (true) with check (true);

-- ── NEU: Adressen, Fahrzeiten, Zuhause ──
alter table public.events add column if not exists location_lat double precision;
alter table public.events add column if not exists location_lon double precision;
alter table public.events add column if not exists travel_minutes int;

create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "familie_alles" on public.settings;
create policy "familie_alles" on public.settings
  for all to authenticated using (true) with check (true);

-- ── NEU: Geburtstagskalender ──
create table if not exists public.birthdays (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  day        int  not null,
  month      int  not null,
  byear      int,
  created_at timestamptz not null default now()
);
alter table public.birthdays enable row level security;
drop policy if exists "familie_alles" on public.birthdays;
create policy "familie_alles" on public.birthdays
  for all to authenticated using (true) with check (true);
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'birthdays') then
    execute 'alter publication supabase_realtime add table public.birthdays';
  end if;
end $$;

-- ── NEU: Kategorie für Abfuhr-/Müllkalender ──
alter table public.events add column if not exists category text;

-- ── NEU: eigene Reihenfolge in Aufgaben-/Einkaufslisten ──
alter table public.tasks add column if not exists sort int;

-- ── NEU: Geburtstags-Vorwarnung — Merker "Geschenk erledigt" pro Jahr ──
alter table public.birthdays add column if not exists done_year int;
