create table if not exists approved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  name text not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  radius_meters int not null default 100,
  is_active boolean not null default true
);
alter table approved_locations enable row level security;
drop policy if exists "approved_locations_v1_read" on approved_locations;
create policy "approved_locations_v1_read" on approved_locations for select using (true);
drop policy if exists "approved_locations_v1_write" on approved_locations;
create policy "approved_locations_v1_write" on approved_locations for all using (true) with check (true);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  employee_no text not null unique,
  full_name text not null,
  department text,
  position text,
  employment_type text not null default 'full_time',
  shift_start time not null default '08:00',
  shift_end time not null default '17:00',
  grace_minutes int not null default 15,
  is_active boolean not null default true
);
alter table employees enable row level security;
drop policy if exists "employees_v1_read" on employees;
create policy "employees_v1_read" on employees for select using (true);
drop policy if exists "employees_v1_write" on employees;
create policy "employees_v1_write" on employees for all using (true) with check (true);

create table if not exists public_holidays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  holiday_date date not null unique,
  name text not null,
  state text default 'ALL'
);
alter table public_holidays enable row level security;
drop policy if exists "public_holidays_v1_read" on public_holidays;
create policy "public_holidays_v1_read" on public_holidays for select using (true);
drop policy if exists "public_holidays_v1_write" on public_holidays;
create policy "public_holidays_v1_write" on public_holidays for all using (true) with check (true);

create table if not exists attendance_punches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  employee_id uuid not null references employees(id),
  punch_date date not null,
  clock_in timestamptz,
  break_start timestamptz,
  break_end timestamptz,
  clock_out timestamptz,
  clock_in_lat numeric(10,7),
  clock_in_lng numeric(10,7),
  clock_out_lat numeric(10,7),
  clock_out_lng numeric(10,7),
  location_verified boolean not null default false,
  total_worked_minutes int,
  break_minutes int,
  normal_minutes int,
  ot_minutes int,
  rest_day_minutes int,
  ph_minutes int,
  rest_day_ot_minutes int,
  ph_ot_minutes int,
  is_late boolean not null default false,
  late_minutes int,
  is_early_departure boolean not null default false,
  early_departure_minutes int,
  has_missing_punch boolean not null default false,
  day_type text not null default 'normal',
  hr_adjusted boolean not null default false,
  hr_notes text,
  status text not null default 'pending',
  ai_anomaly_flag text,
  ai_anomaly_flag_source text,
  ai_anomaly_flag_confidence numeric,
  ai_anomaly_flag_review_status text default 'unreviewed'
);
alter table attendance_punches enable row level security;
drop policy if exists "attendance_punches_v1_read" on attendance_punches;
create policy "attendance_punches_v1_read" on attendance_punches for select using (true);
drop policy if exists "attendance_punches_v1_write" on attendance_punches;
create policy "attendance_punches_v1_write" on attendance_punches for all using (true) with check (true);

create table if not exists leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  employee_id uuid not null references employees(id),
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  total_days numeric(4,1) not null default 1,
  remarks text,
  status text not null default 'pending',
  approved_by text,
  approved_at timestamptz
);
alter table leaves enable row level security;
drop policy if exists "leaves_v1_read" on leaves;
create policy "leaves_v1_read" on leaves for select using (true);
drop policy if exists "leaves_v1_write" on leaves;
create policy "leaves_v1_write" on leaves for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  actor text,
  action text not null,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into approved_locations (id, name, latitude, longitude, radius_meters, is_active) values
  ('a1000000-0000-0000-0000-000000000001', 'Main Factory Floor', 3.1390, 101.6869, 100, true),
  ('a1000000-0000-0000-0000-000000000002', 'Warehouse Block B', 3.1405, 101.6880, 80, true)
on conflict do nothing;

insert into employees (id, employee_no, full_name, department, position, employment_type, shift_start, shift_end, grace_minutes) values
  ('e1000000-0000-0000-0000-000000000001', 'EMP001', 'Ahmad Faizal bin Razak', 'Production', 'Machine Operator', 'full_time', '08:00', '17:00', 15),
  ('e1000000-0000-0000-0000-000000000002', 'EMP002', 'Siti Nurhaliza binti Hassan', 'Quality Control', 'QC Inspector', 'full_time', '08:00', '17:00', 15),
  ('e1000000-0000-0000-0000-000000000003', 'EMP003', 'Ravi Kumar a/l Subramaniam', 'Warehouse', 'Store Keeper', 'full_time', '07:00', '16:00', 10),
  ('e1000000-0000-0000-0000-000000000004', 'EMP004', 'Nurul Ain binti Mohd Zain', 'Admin', 'HR Executive', 'full_time', '08:30', '17:30', 15),
  ('e1000000-0000-0000-0000-000000000005', 'EMP005', 'Lee Chong Wei', 'Production', 'Line Supervisor', 'full_time', '08:00', '17:00', 10)
on conflict do nothing;

insert into public_holidays (holiday_date, name, state) values
  ('2025-02-01', 'Federal Territory Day', 'WP'),
  ('2025-05-01', 'Labour Day', 'ALL'),
  ('2025-08-31', 'Merdeka Day', 'ALL')
on conflict do nothing;

insert into attendance_punches (employee_id, punch_date, clock_in, break_start, break_end, clock_out, location_verified, total_worked_minutes, break_minutes, normal_minutes, ot_minutes, rest_day_minutes, ph_minutes, is_late, late_minutes, is_early_departure, day_type, status) values
  ('e1000000-0000-0000-0000-000000000001', current_date - 1, (current_date - 1 + time '08:05'), (current_date - 1 + time '12:00'), (current_date - 1 + time '13:00'), (current_date - 1 + time '17:00'), true, 480, 60, 480, 0, 0, 0, false, 0, false, 'normal', 'approved'),
  ('e1000000-0000-0000-0000-000000000002', current_date - 1, (current_date - 1 + time '08:22'), (current_date - 1 + time '12:00'), (current_date - 1 + time '13:00'), (current_date - 1 + time '17:00'), true, 458, 60, 458, 0, 0, 0, true, 22, false, 'normal', 'pending'),
  ('e1000000-0000-0000-0000-000000000003', current_date - 1, (current_date - 1 + time '07:00'), (current_date - 1 + time '12:00'), (current_date - 1 + time '13:00'), (current_date - 1 + time '18:00'), true, 540, 60, 480, 60, 0, 0, false, 0, false, 'normal', 'approved'),
  ('e1000000-0000-0000-0000-000000000004', current_date, (current_date + time '08:35'), null, null, null, true, null, null, null, null, null, null, false, 0, false, 'normal', 'pending'),
  ('e1000000-0000-0000-0000-000000000005', current_date, (current_date + time '08:00'), null, null, null, true, null, null, null, null, null, null, false, 0, false, 'normal', 'pending')
on conflict do nothing;

insert into leaves (employee_id, leave_type, start_date, end_date, total_days, remarks, status, approved_by) values
  ('e1000000-0000-0000-0000-000000000001', 'Annual Leave', '2025-07-14', '2025-07-15', 2, 'Family trip', 'approved', 'Nurul Ain'),
  ('e1000000-0000-0000-0000-000000000002', 'Medical Leave', '2025-07-10', '2025-07-10', 1, 'MC from clinic attached', 'approved', 'Nurul Ain'),
  ('e1000000-0000-0000-0000-000000000003', 'Unpaid Leave', '2025-07-08', '2025-07-08', 1, 'Personal matter', 'pending', null)
on conflict do nothing;