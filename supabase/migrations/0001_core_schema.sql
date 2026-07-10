-- Core schema for the Time Management System.
-- Demo-first: RLS is enabled but policies are permissive (anon + authenticated)
-- until the later "lock it down" sprint adds per-user auth.

create extension if not exists pgcrypto;

create type employee_role as enum ('worker', 'supervisor', 'hr');
create type punch_type as enum ('clock_in', 'clock_out', 'break_start', 'break_end');
create type leave_type as enum ('annual', 'medical', 'hospitalization', 'unpaid', 'absent', 'other');
create type leave_status as enum ('pending', 'approved', 'rejected');
create type review_status as enum ('pending', 'reviewed');

create table employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  staff_no text not null unique,
  role employee_role not null default 'worker',
  -- 0 = Sunday .. 6 = Saturday, matches Postgres EXTRACT(DOW ...)
  rest_day_of_week smallint not null default 0 check (rest_day_of_week between 0 and 6),
  shift_start time not null default '08:00',
  shift_end time not null default '17:00',
  scheduled_break_minutes integer not null default 60 check (scheduled_break_minutes >= 0),
  active boolean not null default true,
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table approved_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null default 200 check (radius_meters > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table attendance_punches (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  punch_type punch_type not null,
  punch_time timestamptz not null default now(),
  location_id uuid references approved_locations (id),
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  within_geofence boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

create index idx_attendance_punches_employee_time on attendance_punches (employee_id, punch_time);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  leave_type leave_type not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status leave_status not null default 'pending',
  reviewed_by uuid references employees (id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  constraint leave_dates_valid check (end_date >= start_date)
);

create index idx_leave_requests_employee on leave_requests (employee_id, start_date, end_date);

-- One computed row per employee per calendar day: the payroll-ready summary
-- that Sprint 2's exception review and Sprint 4's Excel export are built on.
create table attendance_days (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees (id) on delete cascade,
  work_date date not null,
  first_clock_in timestamptz,
  last_clock_out timestamptz,
  break_minutes_taken integer not null default 0,
  worked_minutes integer not null default 0,
  normal_minutes integer not null default 0,
  normal_ot_minutes integer not null default 0,
  rest_day_minutes integer not null default 0,
  rest_day_ot_minutes integer not null default 0,
  ph_minutes integer not null default 0,
  ph_ot_minutes integer not null default 0,
  late_minutes integer not null default 0,
  early_leave_minutes integer not null default 0,
  missing_punch boolean not null default false,
  is_rest_day boolean not null default false,
  is_public_holiday boolean not null default false,
  leave_type leave_type,
  review_status review_status not null default 'pending',
  reviewed_by uuid references employees (id),
  reviewed_at timestamptz,
  review_note text,
  computed_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create index idx_attendance_days_date on attendance_days (work_date);

alter table employees enable row level security;
alter table approved_locations enable row level security;
alter table public_holidays enable row level security;
alter table attendance_punches enable row level security;
alter table leave_requests enable row level security;
alter table attendance_days enable row level security;

-- Demo-first: no auth wall yet, so anon + authenticated share full access.
-- Tightened in the later "lock it down" sprint.
create policy "demo_all_employees" on employees for all to anon, authenticated using (true) with check (true);
create policy "demo_all_approved_locations" on approved_locations for all to anon, authenticated using (true) with check (true);
create policy "demo_all_public_holidays" on public_holidays for all to anon, authenticated using (true) with check (true);
create policy "demo_all_attendance_punches" on attendance_punches for all to anon, authenticated using (true) with check (true);
create policy "demo_all_leave_requests" on leave_requests for all to anon, authenticated using (true) with check (true);
create policy "demo_all_attendance_days" on attendance_days for all to anon, authenticated using (true) with check (true);
