-- Shift schedule & roster management: reusable shift templates plus a
-- per-employee, per-date roster that overrides the employee's default
-- shift_start/shift_end/scheduled_break_minutes when computing attendance.

create table shift_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 60 check (break_minutes >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table roster_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  work_date date not null,
  shift_template_id uuid references shift_templates(id),
  custom_start time,
  custom_end time,
  custom_break_minutes integer check (custom_break_minutes >= 0),
  note text,
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create index idx_roster_assignments_date on roster_assignments (work_date);

alter table shift_templates enable row level security;
alter table roster_assignments enable row level security;

create policy "shift_templates_select" on shift_templates for select to authenticated using (true);
create policy "shift_templates_write_hr" on shift_templates for all to authenticated
  using (auth_role() = 'hr') with check (auth_role() = 'hr');

create policy "roster_assignments_select" on roster_assignments for select to authenticated
  using (employee_id = auth_employee_id() or auth_manages(employee_id));
create policy "roster_assignments_write_manager" on roster_assignments for all to authenticated
  using (auth_manages(employee_id)) with check (auth_manages(employee_id));

-- ── fn_recompute_attendance_day, re-created with a roster lookup ─────────
-- Same body as 0002_attendance_engine.sql except: right after loading the
-- employee, check roster_assignments for this employee+date. If found, its
-- (template or custom) start/end/break override the employee's static
-- default for every calculation below. CREATE OR REPLACE fully replaces the
-- function, so security definer must be re-stated here or it silently
-- reverts to invoker rights (breaking the Phase-1 lockdown fix).

create or replace function fn_recompute_attendance_day(p_employee_id uuid, p_work_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee employees%rowtype;
  v_roster roster_assignments%rowtype;
  v_shift_template shift_templates%rowtype;
  v_shift_start time;
  v_shift_end time;
  v_scheduled_break_minutes integer;
  v_first_in timestamptz;
  v_last_out timestamptz;
  v_clock_ins integer := 0;
  v_clock_outs integer := 0;
  v_break_minutes integer := 0;
  v_break_open timestamptz;
  v_worked_minutes integer := 0;
  v_missing boolean := false;
  v_is_rest boolean := false;
  v_is_ph boolean := false;
  v_leave leave_type;
  v_shift_minutes integer;
  v_shift_start_ts timestamptz;
  v_shift_end_ts timestamptz;
  v_late integer := 0;
  v_early integer := 0;
  v_normal integer := 0;
  v_normal_ot integer := 0;
  v_rest integer := 0;
  v_rest_ot integer := 0;
  v_ph integer := 0;
  v_ph_ot integer := 0;
  r record;
begin
  select * into v_employee from employees where id = p_employee_id;
  if not found then
    return;
  end if;

  select * into v_roster from roster_assignments
   where employee_id = p_employee_id and work_date = p_work_date;

  if v_roster.shift_template_id is not null then
    select * into v_shift_template from shift_templates where id = v_roster.shift_template_id;
  end if;

  v_shift_start := coalesce(v_roster.custom_start, v_shift_template.start_time, v_employee.shift_start);
  v_shift_end := coalesce(v_roster.custom_end, v_shift_template.end_time, v_employee.shift_end);
  v_scheduled_break_minutes := coalesce(v_roster.custom_break_minutes, v_shift_template.break_minutes, v_employee.scheduled_break_minutes);

  select min(punch_time) filter (where punch_type = 'clock_in'),
         max(punch_time) filter (where punch_type = 'clock_out'),
         count(*) filter (where punch_type = 'clock_in'),
         count(*) filter (where punch_type = 'clock_out')
    into v_first_in, v_last_out, v_clock_ins, v_clock_outs
    from attendance_punches
   where employee_id = p_employee_id
     and (punch_time at time zone 'Asia/Kuala_Lumpur')::date = p_work_date;

  for r in
    select punch_type, punch_time
      from attendance_punches
     where employee_id = p_employee_id
       and (punch_time at time zone 'Asia/Kuala_Lumpur')::date = p_work_date
       and punch_type in ('break_start', 'break_end')
     order by punch_time asc
  loop
    if r.punch_type = 'break_start' then
      v_break_open := r.punch_time;
    elsif r.punch_type = 'break_end' and v_break_open is not null then
      v_break_minutes := v_break_minutes + greatest(0, (extract(epoch from (r.punch_time - v_break_open)) / 60)::integer);
      v_break_open := null;
    end if;
  end loop;

  v_missing := (v_clock_ins <> v_clock_outs);

  if v_first_in is not null and v_last_out is not null and v_last_out > v_first_in then
    v_worked_minutes := greatest(0, (extract(epoch from (v_last_out - v_first_in)) / 60)::integer - v_break_minutes);
  end if;

  v_is_rest := (extract(dow from p_work_date)::smallint = v_employee.rest_day_of_week);
  v_is_ph := exists (select 1 from public_holidays where holiday_date = p_work_date);

  select lr.leave_type into v_leave
    from leave_requests lr
   where lr.employee_id = p_employee_id
     and lr.status = 'approved'
     and p_work_date between lr.start_date and lr.end_date
   limit 1;

  v_shift_minutes := greatest(0, (extract(epoch from (v_shift_end - v_shift_start)) / 60)::integer - v_scheduled_break_minutes);

  if v_leave is null and not v_is_rest and not v_is_ph and v_first_in is not null then
    v_shift_start_ts := (p_work_date + v_shift_start) at time zone 'Asia/Kuala_Lumpur';
    v_late := greatest(0, (extract(epoch from (v_first_in - v_shift_start_ts)) / 60)::integer);
  end if;
  if v_leave is null and not v_is_rest and not v_is_ph and v_last_out is not null then
    v_shift_end_ts := (p_work_date + v_shift_end) at time zone 'Asia/Kuala_Lumpur';
    v_early := greatest(0, (extract(epoch from (v_shift_end_ts - v_last_out)) / 60)::integer);
  end if;

  if v_leave is not null then
    v_missing := false;
    v_late := 0;
    v_early := 0;
  elsif v_is_ph then
    v_ph := least(v_worked_minutes, v_shift_minutes);
    v_ph_ot := greatest(0, v_worked_minutes - v_shift_minutes);
  elsif v_is_rest then
    v_rest := least(v_worked_minutes, v_shift_minutes);
    v_rest_ot := greatest(0, v_worked_minutes - v_shift_minutes);
  else
    v_normal := least(v_worked_minutes, v_shift_minutes);
    v_normal_ot := greatest(0, v_worked_minutes - v_shift_minutes);
  end if;

  insert into attendance_days (
    employee_id, work_date, first_clock_in, last_clock_out, break_minutes_taken,
    worked_minutes, normal_minutes, normal_ot_minutes, rest_day_minutes, rest_day_ot_minutes,
    ph_minutes, ph_ot_minutes, late_minutes, early_leave_minutes, missing_punch,
    is_rest_day, is_public_holiday, leave_type, computed_at
  ) values (
    p_employee_id, p_work_date, v_first_in, v_last_out, v_break_minutes,
    v_worked_minutes, v_normal, v_normal_ot, v_rest, v_rest_ot,
    v_ph, v_ph_ot, v_late, v_early, v_missing,
    v_is_rest, v_is_ph, v_leave, now()
  )
  on conflict (employee_id, work_date) do update set
    first_clock_in = excluded.first_clock_in,
    last_clock_out = excluded.last_clock_out,
    break_minutes_taken = excluded.break_minutes_taken,
    worked_minutes = excluded.worked_minutes,
    normal_minutes = excluded.normal_minutes,
    normal_ot_minutes = excluded.normal_ot_minutes,
    rest_day_minutes = excluded.rest_day_minutes,
    rest_day_ot_minutes = excluded.rest_day_ot_minutes,
    ph_minutes = excluded.ph_minutes,
    ph_ot_minutes = excluded.ph_ot_minutes,
    late_minutes = excluded.late_minutes,
    early_leave_minutes = excluded.early_leave_minutes,
    missing_punch = excluded.missing_punch,
    is_rest_day = excluded.is_rest_day,
    is_public_holiday = excluded.is_public_holiday,
    leave_type = excluded.leave_type,
    computed_at = excluded.computed_at;
    -- review_status / reviewed_by / reviewed_at / review_note are intentionally
    -- left untouched so HR's prior review survives a recompute.
end;
$$;

-- Recompute immediately when a roster assignment changes, so retroactively
-- rostering an already-punched date takes effect right away (matches the
-- existing behavior for punches/leave changes).
create or replace function trg_roster_assignments_recompute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform fn_recompute_attendance_day(old.employee_id, old.work_date);
    return old;
  else
    perform fn_recompute_attendance_day(new.employee_id, new.work_date);
    if tg_op = 'UPDATE' and (old.employee_id <> new.employee_id or old.work_date <> new.work_date) then
      perform fn_recompute_attendance_day(old.employee_id, old.work_date);
    end if;
    return new;
  end if;
end;
$$;

create trigger roster_assignments_recompute
after insert or update or delete on roster_assignments
for each row execute function trg_roster_assignments_recompute();
