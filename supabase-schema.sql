-- ZamanVeBen — Supabase şeması
-- Supabase panelinde: SQL Editor → New query → bunu yapıştır → Run

create table if not exists public.app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Her kullanıcı YALNIZCA kendi satırını görür ve yazar.
drop policy if exists "own row read"   on public.app_state;
drop policy if exists "own row insert" on public.app_state;
drop policy if exists "own row update" on public.app_state;

create policy "own row read"   on public.app_state for select using (auth.uid() = user_id);
create policy "own row insert" on public.app_state for insert with check (auth.uid() = user_id);
create policy "own row update" on public.app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at her yazmada tazelenir
create or replace function public.touch_app_state() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists app_state_touch on public.app_state;
create trigger app_state_touch before insert or update on public.app_state
  for each row execute function public.touch_app_state();
