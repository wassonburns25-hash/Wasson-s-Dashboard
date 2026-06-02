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
-- program_checks — daily check-offs for the training program calendar
-- (item_key looks like "2026-05-25::LIFT")
-- ---------------------------------------------------------------------------
create table if not exists public.program_checks (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_key)
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
alter table public.program_checks enable row level security;

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

-- program_checks
create policy "program_checks_select" on public.program_checks
  for select using (auth.uid() = user_id);
create policy "program_checks_insert" on public.program_checks
  for insert with check (auth.uid() = user_id);
create policy "program_checks_delete" on public.program_checks
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- meals — nutrition log with AI-estimated macros
-- ===========================================================================
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  eaten_on date not null default current_date,
  description text not null,
  calories int not null default 0,
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fat_g int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists meals_user_date_idx on public.meals (user_id, eaten_on desc);

alter table public.meals enable row level security;
create policy "meals_select" on public.meals for select using (auth.uid() = user_id);
create policy "meals_insert" on public.meals for insert with check (auth.uid() = user_id);
create policy "meals_update" on public.meals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meals_delete" on public.meals for delete using (auth.uid() = user_id);

-- ===========================================================================
-- books — reading list
-- ===========================================================================
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  author text,
  status text not null default 'to_read'
    check (status in ('to_read', 'reading', 'read')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists books_user_idx on public.books (user_id);

alter table public.books enable row level security;
create policy "books_select" on public.books for select using (auth.uid() = user_id);
create policy "books_insert" on public.books for insert with check (auth.uid() = user_id);
create policy "books_update" on public.books for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "books_delete" on public.books for delete using (auth.uid() = user_id);

-- ===========================================================================
-- priorities — top priorities for the command center
-- ===========================================================================
create table if not exists public.priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists priorities_user_idx on public.priorities (user_id, position);
alter table public.priorities enable row level security;
create policy "priorities_all" on public.priorities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================================
-- contacts — networking / outreach tracker
-- ===========================================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  company text,
  role text,
  link text,
  status text not null default 'to_contact'
    check (status in ('to_contact', 'contacted', 'responded', 'meeting')),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists contacts_user_idx on public.contacts (user_id);
alter table public.contacts enable row level security;
create policy "contacts_all" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================================
-- outreach_profile — single-row-per-user background for AI outreach drafts
-- ===========================================================================
create table if not exists public.outreach_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  background text,
  updated_at timestamptz not null default now()
);
alter table public.outreach_profile enable row level security;
create policy "outreach_profile_all" on public.outreach_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===========================================================================
-- weights — daily bodyweight log (one row per user per day)
-- ===========================================================================
create table if not exists public.weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weigh_date date not null default current_date,
  weight_lb numeric(5, 1) not null,
  created_at timestamptz not null default now(),
  unique (user_id, weigh_date)
);
create index if not exists weights_user_date_idx on public.weights (user_id, weigh_date);
alter table public.weights enable row level security;
create policy "weights_all" on public.weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
