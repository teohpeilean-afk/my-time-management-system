# Tasks & Sprints

## Sprint 1 — Database, Seed & Core Punch Engine
**Goal**: The punch action works end-to-end against the database; demo data visible without login.

- [ ] Apply migration SQL to Supabase project
- [ ] Verify seed data renders on `/` without login
- [ ] Build `POST /api/punch` — accepts `{employee_id, punch_type, lat, lng}`
- [ ] GPS geofence check: calculate distance to each `approved_location`, set `location_verified`
- [ ] On clock-out: run `compute_hours` — write all computed minute fields
- [ ] Day-type classifier: query `public_holidays`, check weekday → set `day_type`
- [ ] Malaysia EA 1955 split: normal cap 8 h/day → excess → OT; rest-day / PH rates
- [ ] Mobile `/punch` page: employee picker, punch buttons, GPS status indicator
- [ ] Handle GPS denied / timeout error state with clear user message

**Definition of Done**: Ahmad (EMP001) opens `/punch` on mobile → taps Clock In → row appears in `attendance_punches` with `location_verified=true` → taps Clock Out → `normal_minutes=480`, `ot_minutes=0` confirmed in DB. All four punch types work. Error shown if GPS unavailable.

---

## Sprint 2 — Attendance Dashboard & Leave Recording ✅ v1 functional milestone
**Goal**: HR sees live team status; employees log leave; exceptions are actionable.

- [ ] `/dashboard` — table: all employees × today; columns: name, clock-in, clock-out, hours, status badge
- [ ] Five states: loading skeleton, empty (no punches), partial (clocked-in only), error (DB fail), ready
- [ ] Exceptions panel: filter `is_late OR has_missing_punch OR is_early_departure`; HR override form
- [ ] HR override writes old + new value to `audit_logs`
- [ ] `/leave/new` form: employee, leave_type (dropdown with all Malaysia types), date range, remarks
- [ ] Leave list `/leave` with edit + delete + status badge
- [ ] Leave approval action (HR clicks Approve/Reject) → updates status + `approved_by`
- [ ] Date filter on dashboard

**Definition of Done**: HR opens `/dashboard` → sees today's 5 demo employees with correct statuses → clicks Override on a missing punch → enters corrected time → audit log row created → opens `/leave` → approves EMP003's pending leave → status changes to approved.

---

## Sprint 3 — Monthly Summary & Excel Export
**Goal**: HR can export a payroll-ready Excel file.

- [ ] Monthly summary query: group by employee, sum all minute fields + leave days
- [ ] `GET /api/export?month=YYYY-MM` → returns `.xlsx` via `exceljs`
- [ ] Excel columns: Emp No, Name, Normal Hrs, OT Hrs, Rest-Day Hrs, PH Hrs, Rest-Day OT, PH OT, AL days, MC days, Hospitalisation, Unpaid, Absent
- [ ] Export button on dashboard with month picker
- [ ] Public holiday admin page: list, add, delete holidays
- [ ] Audit log on every export event

**Definition of Done**: HR selects July 2025, clicks Export → browser downloads `attendance_july_2025.xlsx` → file contains one row per employee with correct totals matching DB aggregates.

---

## Sprint 4 — Lock It Down (Auth + Per-User RLS)
**Goal**: Real employees log in; data is private; roles enforced.

- [ ] Enable Supabase Auth (email + password)
- [ ] `employees.user_id` linked to `auth.uid()` on signup
- [ ] Replace v1 open RLS policies with owner-scoped policies per role
- [ ] Role stored in `app_metadata`; HR/supervisor claims bypass employee-only filter
- [ ] `/punch` requires login; pre-fills employee from session
- [ ] `/dashboard` gated to HR/supervisor role
- [ ] Signup flow: HR creates employee account, assigns role

**Definition of Done**: Logged-in EMP001 can only read their own punch rows. HR account sees all rows. Anonymous visitor sees login page, not data.

---

## Sprint 5 — Hardening & Notifications
**Goal**: Production-ready: shift config, missing-punch alerts, full test pass.

- [ ] Shift definition per employee (already in schema); auto-flag late/early from shift_start/grace_minutes
- [ ] Supabase Edge Function cron: nightly scan for missing clock-out → create draft correction → notify HR
- [ ] Email notification to HR on draft correction (Resend or Supabase SMTP)
- [ ] Audit log viewer page for HR
- [ ] Full manual test pass per TEST_PLAN.md — all failures fixed before sign-off
- [ ] Remove any console.log with PII; confirm no secrets in client bundle

**Definition of Done**: All TEST_PLAN.md scenarios pass. Nightly cron fires in staging and creates draft record. No PII in browser logs.

---

## Gantt (sprint → target week)
| Sprint | Week |
|---|---|
| 1 — Punch Engine | 1 |
| 2 — Dashboard & Leave (v1 functional) | 2 |
| 3 — Export | 3 |
| 4 — Lock it down | 4 |
| 5 — Hardening | 5 |