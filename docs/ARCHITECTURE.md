# Architecture

## Stack
- **Frontend**: Next.js 14 (App Router) — mobile-first responsive UI
- **Backend/DB**: Supabase (Postgres + RLS + Edge Functions)
- **Hosting**: Vercel
- **Export**: `exceljs` in a Next.js API route

## What to Build Now vs Later
**Now**: punch engine, GPS check, hours calculator, exceptions dashboard, leave form, Excel export 
**Next**: auth + RLS owner policies, role-based views, shift scheduler, email reminders 
**Later**: payslip PDF, biometric, external payroll API, AI anomaly detection

## Key Action — Employee Clock-In (step by step)
1. Employee opens `/punch` on mobile; selects their name (v1 no-login).
2. Browser captures GPS coordinates.
3. POST `/api/punch` sends `{employee_id, punch_type: 'clock_in', lat, lng}`.
4. Server compares coords to `approved_locations`; sets `location_verified`.
5. Row written / updated in `attendance_punches` for today.
6. On clock-out: server calculates `total_worked_minutes`, classifies day type (normal / rest-day / public-holiday), splits into `normal_minutes`, `ot_minutes`, `rest_day_minutes`, `ph_minutes` per EA 1955 thresholds.
7. HR dashboard re-queries and shows updated row instantly.
8. Any HR override appended to `audit_logs`.

## Layer Plan
1. **Data layer** — Postgres tables + constraints enforce truth; RLS enforces access.
2. **Logic layer** — Hours calculation and day-type classification in server-side TypeScript; runs regardless of any AI feature.
3. **Smart layer** (later) — Anomaly scoring on top; AI fields stored with `confidence` + `review_status`; core payroll unaffected if AI is off.

## Core Without AI
All payroll arithmetic is deterministic server code. AI flags are advisory only.