# Wasson's Dashboard

A full-stack personal life dashboard — training, academics, work, goals, trips,
and finances in one place. Built with **Next.js 14 (App Router)**, **Tailwind
CSS**, **shadcn/ui**, **Recharts**, and **Supabase** for auth + database.

Mobile-first, dark mode by default, with a persistent sidebar on desktop and a
bottom nav on mobile.

## Features

- **Daily Overview** — date, daily check-in (lifted, nutrition, schoolwork),
  mood/energy 1–5 selectors, today's earnings, and a week-to-date earnings card.
- **Training** — log workouts (date, exercise, sets, reps, weight) with an
  injury/recovery notes field, a recent-sessions table, a weekly-volume line
  chart, and goal progress bars (bench 225 lb, 1.5 mi sub-9, bodyweight target).
- **Academics & Work** — assignment tracker (course, due date, priority,
  status) and a work log that auto-calculates earnings, plus a monthly earnings
  chart.
- **Goals** — full CRUD (title, category, deadline, progress 0–100%, status),
  displayed as cards grouped by category.
- **Trips** — add trips (destination, dates, purpose, notes) shown as a timeline
  sorted by date, split into upcoming and past.
- **Finance** — combined income from the work log and manual daily entries, with
  weekly/monthly/all-time totals and a weekly income bar chart.

## Tech stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Framework      | Next.js 14 (App Router, RSC)    |
| Styling        | Tailwind CSS + shadcn/ui        |
| Charts         | Recharts                        |
| Auth           | Supabase Auth (email magic link)|
| Database       | Supabase Postgres + RLS         |
| Deployment     | Vercel                          |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project & apply the schema

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql). This creates all tables
   (`daily_logs`, `workouts`, `assignments`, `work_logs`, `goals`, `trips`)
   with Row Level Security so each user only sees their own data.
3. Under **Authentication → Providers**, make sure **Email** is enabled.
   Magic links are on by default.

### 3. Configure environment variables

Copy the example file and fill in your project values
(**Project Settings → API**):

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Set the auth redirect URL

In Supabase under **Authentication → URL Configuration**, add your site URL
(e.g. `http://localhost:3000` and your Vercel URL) to **Redirect URLs** so the
magic link can return to `/auth/callback`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter your email, and click
the magic link to sign in.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add the three environment variables above in the Vercel project settings.
   Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g.
   `https://your-app.vercel.app`).
3. Add that same production URL to Supabase's **Redirect URLs**.
4. Deploy. All routes are protected by middleware — unauthenticated visitors are
   redirected to `/login`.

## Project structure

```
app/
  (dashboard)/          # protected routes (sidebar + bottom nav layout)
    page.tsx            # Daily Overview
    training/           # workouts, volume chart, goal bars
    academics/          # assignments + work log + monthly chart
    goals/              # grouped goal cards (CRUD)
    trips/              # timeline
    finance/            # combined income + weekly chart
    actions.ts          # daily_logs server actions
  auth/                 # magic-link callback + signout routes
  login/                # magic-link sign-in
components/
  ui/                   # shadcn/ui primitives
  charts/               # Recharts wrappers
lib/
  supabase/             # browser, server, and middleware clients
  types.ts              # domain types mirroring the schema
supabase/
  schema.sql            # full database schema + RLS policies
middleware.ts           # session refresh + route protection
```

## How it works

- **Auth** uses `@supabase/ssr`. `middleware.ts` refreshes the session on every
  request and redirects unauthenticated users to `/login`; the dashboard layout
  double-checks the user server-side.
- **Mutations** are handled with Next.js Server Actions that write through the
  Supabase server client (so RLS applies) and `revalidatePath` the affected
  pages.
- **Charts** are client components fed pre-aggregated data from the server.
