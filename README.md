# my-time-management-system

A demo-first Time Management System for tracking employee attendance, overtime and leave —
see [docs/PRD.md](docs/PRD.md) for the full brief.

## What it does

- **Clock in/out + breaks**, checked against an approved factory location (geofence).
- **Shared live dashboard** — everyone sees everyone's status for the day.
- **Attendance engine** (Postgres function, `supabase/migrations/0002_attendance_engine.sql`)
  splits worked hours into normal / normal OT / rest-day / rest-day OT / public-holiday /
  public-holiday OT per Malaysia Employment Act categories, and flags late arrivals, early
  departures and missing punches.
- **Exception review** — HR/supervisors review flagged days and can adjust the computed hours.
- **Leave management** — annual / medical / hospitalization / unpaid / absent / other, with
  approve/reject.
- **Excel export** — payroll-ready attendance summary for a date range.

No login wall yet — an "Acting as" employee switcher stands in for auth so the app is
demoable without an account. Real auth + per-user lockdown is a later sprint.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions) |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 (CSS-first, no config file) |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Deploy | Vercel |

## Quick start

```bash
npm install
vercel link
vercel env pull .env.local
npm run dev
```

Open http://localhost:3000.

## Database

Schema + seed data live in `supabase/migrations/`. Apply them via the Supabase CLI
(`supabase link && supabase db push`) or by pasting each file, in order, into the
Supabase dashboard's SQL editor:

1. `0001_core_schema.sql` — tables, enums, RLS policies
2. `0002_attendance_engine.sql` — the hours/OT computation engine + triggers
3. `0003_seed_data.sql` — a demo team, approved location, holidays and a week of punches

## Working with AI

See [CLAUDE.md](CLAUDE.md) for conventions.
