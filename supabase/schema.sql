-- ===========================================================================
-- Wasson's Dashboard — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- All tables are scoped to the authenticated user via Row Level Security.
-- ===========================================================================

-- Helpful extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- daily_logs — one row per user per day (check-in, mood/energy, earnings)
-- ---------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  lifted boolean not null default false,
  nutrition_on_track boolean not null default false,
  schoolwork_done boolean not null default false,
  mood int check (mood between 1 and 5),
  energy int check (energy between 1 and 5),
  earnings numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ---------------------------------------------------------------------------
-- workouts — individual logged sets/exercises
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_date date not null default current_date,
  exercise text not null,
  sets int not null default 0,
  reps int not null default 0,
  weight numeric(7, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- assignments — academic assignment tracker
-- ---------------------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course text not null,
  title text not null,
  due_date date not null,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- work_logs — hours worked; earnings is generated (hours * pay_rate)
-- ---------------------------------------------------------------------------
create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_date date not null default current_date,
  hours numeric(5, 2) not null default 0,
  pay_rate numeric(7, 2) not null default 0,
  earnings numeric(10, 2)
    generated always as (round(hours * pay_rate, 2)) stored,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- goals — cross-category goal tracking
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'Personal'
    check (category in ('Athletic', 'Academic', 'Financial', 'Personal')),
  deadline date,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'active'
    check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trips — travel planning
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  start_date date not null,
  end_date date,
  purpose text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for common lookups
-- ---------------------------------------------------------------------------
create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, log_date desc);
create index if not exists workouts_user_date_idx
  on public.workouts (user_id, workout_date desc);
create index if not exists assignments_user_due_idx
  on public.assignments (user_id, due_date);
create index if not exists work_logs_user_date_idx
  on public.work_logs (user_id, work_date desc);
create index if not exists goals_user_idx
  on public.goals (user_id);
create index if not exists trips_user_start_idx
  on public.trips (user_id, start_date);

-- ===========================================================================
-- Row Level Security — each user can only see and modify their own rows.
-- ===========================================================================
alter table public.daily_logs  enable row level security;
alter table public.workouts    enable row level security;
alter table public.assignments enable row level security;
alter table public.work_logs   enable row level security;
alter table public.goals       enable row level security;
alter table public.trips       enable row level security;

-- daily_logs
create policy "daily_logs_select" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "daily_logs_insert" on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy "daily_logs_update" on public.daily_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs_delete" on public.daily_logs
  for delete using (auth.uid() = user_id);

-- workouts
create policy "workouts_select" on public.workouts
  for select using (auth.uid() = user_id);
create policy "workouts_insert" on public.workouts
  for insert with check (auth.uid() = user_id);
create policy "workouts_update" on public.workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_delete" on public.workouts
  for delete using (auth.uid() = user_id);

-- assignments
create policy "assignments_select" on public.assignments
  for select using (auth.uid() = user_id);
create policy "assignments_insert" on public.assignments
  for insert with check (auth.uid() = user_id);
create policy "assignments_update" on public.assignments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assignments_delete" on public.assignments
  for delete using (auth.uid() = user_id);

-- work_logs
create policy "work_logs_select" on public.work_logs
  for select using (auth.uid() = user_id);
create policy "work_logs_insert" on public.work_logs
  for insert with check (auth.uid() = user_id);
create policy "work_logs_update" on public.work_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "work_logs_delete" on public.work_logs
  for delete using (auth.uid() = user_id);

-- goals
create policy "goals_select" on public.goals
  for select using (auth.uid() = user_id);
create policy "goals_insert" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete" on public.goals
  for delete using (auth.uid() = user_id);

-- trips
create policy "trips_select" on public.trips
  for select using (auth.uid() = user_id);
create policy "trips_insert" on public.trips
  for insert with check (auth.uid() = user_id);
create policy "trips_update" on public.trips
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips_delete" on public.trips
  for delete using (auth.uid() = user_id);
