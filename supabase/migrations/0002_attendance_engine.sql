-- The core engine: turns raw punches + leave + public holidays into a
-- payroll-ready daily summary (attendance_days), split per Malaysia
-- Employment Act categories (normal / normal OT / rest day / rest day OT /
-- public holiday / public holiday OT), plus late/early/missing exceptions.

create or replace function fn_recompute_attendance_day(p_employee_id uuid, p_work_date date)
returns void
language plpgsql
as $$
declare
  v_employee employees%rowtype;
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

  v_shift_minutes := greatest(0, (extract(epoch from (v_employee.shift_end - v_employee.shift_start)) / 60)::integer - v_employee.scheduled_break_minutes);

  if v_leave is null and not v_is_rest and not v_is_ph and v_first_in is not null then
    v_shift_start_ts := (p_work_date + v_employee.shift_start) at time zone 'Asia/Kuala_Lumpur';
    v_late := greatest(0, (extract(epoch from (v_first_in - v_shift_start_ts)) / 60)::integer);
  end if;
  if v_leave is null and not v_is_rest and not v_is_ph and v_last_out is not null then
    v_shift_end_ts := (p_work_date + v_employee.shift_end) at time zone 'Asia/Kuala_Lumpur';
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

create or replace function fn_recompute_range(p_employee_id uuid, p_start date, p_end date)
returns void
language plpgsql
as $$
declare
  d date;
begin
  d := p_start;
  while d <= p_end loop
    perform fn_recompute_attendance_day(p_employee_id, d);
    d := d + 1;
  end loop;
end;
$$;

create or replace function fn_recompute_all(p_start date, p_end date)
returns void
language plpgsql
as $$
declare
  emp record;
begin
  for emp in select id from employees where active loop
    perform fn_recompute_range(emp.id, p_start, p_end);
  end loop;
end;
$$;

create or replace function trg_attendance_punches_recompute()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform fn_recompute_attendance_day(old.employee_id, (old.punch_time at time zone 'Asia/Kuala_Lumpur')::date);
    return old;
  else
    perform fn_recompute_attendance_day(new.employee_id, (new.punch_time at time zone 'Asia/Kuala_Lumpur')::date);
    if tg_op = 'UPDATE' and (old.punch_time at time zone 'Asia/Kuala_Lumpur')::date <> (new.punch_time at time zone 'Asia/Kuala_Lumpur')::date then
      perform fn_recompute_attendance_day(old.employee_id, (old.punch_time at time zone 'Asia/Kuala_Lumpur')::date);
    end if;
    return new;
  end if;
end;
$$;

create trigger attendance_punches_recompute
after insert or update or delete on attendance_punches
for each row execute function trg_attendance_punches_recompute();

create or replace function trg_leave_requests_recompute()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.status = 'approved' then
    perform fn_recompute_range(new.employee_id, new.start_date, new.end_date);
  elsif tg_op = 'UPDATE' and (old.status is distinct from new.status or old.start_date <> new.start_date or old.end_date <> new.end_date) then
    perform fn_recompute_range(new.employee_id, least(old.start_date, new.start_date), greatest(old.end_date, new.end_date));
  end if;
  return new;
end;
$$;

create trigger leave_requests_recompute
after insert or update on leave_requests
for each row execute function trg_leave_requests_recompute();

grant execute on function fn_recompute_range(uuid, date, date) to anon, authenticated;
grant execute on function fn_recompute_all(date, date) to anon, authenticated;
