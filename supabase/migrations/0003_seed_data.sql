-- Demo seed data: one approved factory location, a small mixed-role team,
-- a sample public holiday calendar, and ~a week of punches with deliberate
-- variety (on-time, late, a missing punch, rest-day OT, approved leave) so
-- the dashboard and exception review are populated the moment the app loads.

insert into approved_locations (name, latitude, longitude, radius_meters)
values ('Shah Alam Factory', 3.073097, 101.518501, 250)
on conflict (name) do nothing;

insert into employees (full_name, staff_no, role, rest_day_of_week, shift_start, shift_end, scheduled_break_minutes)
values
  ('Ahmad Zulkifli', 'W-001', 'worker', 0, '08:00', '17:00', 60),
  ('Siti Nurhaliza', 'W-002', 'worker', 0, '08:00', '17:00', 60),
  ('Kumar Selvam', 'W-003', 'worker', 0, '08:00', '17:00', 60),
  ('Wong Mei Ling', 'W-004', 'worker', 0, '08:00', '17:00', 60),
  ('Farah Azlina', 'S-001', 'supervisor', 0, '08:00', '17:00', 60),
  ('Devika Rani', 'H-001', 'hr', 0, '08:00', '17:00', 60)
on conflict (staff_no) do nothing;

-- Illustrative sample dates only — HR should replace with the gazetted
-- national + state public holiday list for the current year.
insert into public_holidays (holiday_date, name)
values
  (date_trunc('year', current_date)::date + interval '0 days', 'New Year''s Day'),
  ((date_trunc('year', current_date) + interval '4 months')::date, 'Labour Day'),
  ((date_trunc('year', current_date) + interval '8 months')::date, 'Merdeka Day'),
  ((date_trunc('year', current_date) + interval '8 months 15 days')::date, 'Malaysia Day'),
  ((date_trunc('year', current_date) + interval '11 months 24 days')::date, 'Christmas Day')
on conflict (holiday_date) do nothing;

do $$
declare
  v_ahmad uuid;
  v_siti uuid;
  v_kumar uuid;
  v_wong uuid;
  v_farah uuid;
  v_devika uuid;
  v_loc uuid;
  d date;
  v_last_sunday date;
  v_leave_start date;
  v_leave_end date;
begin
  select id into v_loc from approved_locations where name = 'Shah Alam Factory';
  select id into v_ahmad from employees where staff_no = 'W-001';
  select id into v_siti from employees where staff_no = 'W-002';
  select id into v_kumar from employees where staff_no = 'W-003';
  select id into v_wong from employees where staff_no = 'W-004';
  select id into v_farah from employees where staff_no = 'S-001';
  select id into v_devika from employees where staff_no = 'H-001';

  -- most recent *completed* Sunday, so the rest-day OT demo isn't mid-shift
  v_last_sunday := current_date - ((extract(dow from current_date)::int + 7) % 7);
  if v_last_sunday = current_date then
    v_last_sunday := v_last_sunday - 7;
  end if;

  v_leave_start := current_date - 9;
  v_leave_end := current_date - 8;

  -- Ahmad: clean punches, on time, every workday
  for d in select generate_series(current_date - 6, current_date - 1, interval '1 day')::date loop
    if d <> v_last_sunday then
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_ahmad, 'clock_in', (d + time '07:57') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_ahmad, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_ahmad, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_ahmad, 'clock_out', (d + time '17:05') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    end if;
  end loop;

  -- Siti: a missing clock-out and a late arrival, to populate exception review
  for d in select generate_series(current_date - 6, current_date - 1, interval '1 day')::date loop
    if d = v_last_sunday then
      continue;
    elsif d = current_date - 3 then
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_siti, 'clock_in', (d + time '08:01') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    elsif d = current_date - 2 then
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_siti, 'clock_in', (d + time '09:12') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_siti, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_siti, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_siti, 'clock_out', (d + time '17:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    else
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_siti, 'clock_in', (d + time '08:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_siti, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_siti, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_siti, 'clock_out', (d + time '17:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    end if;
  end loop;

  -- Kumar: normal week + worked the rest day (Sunday), producing rest-day OT
  for d in select generate_series(current_date - 6, current_date - 1, interval '1 day')::date loop
    if d <> v_last_sunday then
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_kumar, 'clock_in', (d + time '08:03') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_kumar, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_kumar, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_kumar, 'clock_out', (d + time '17:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    end if;
  end loop;
  insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
    (v_kumar, 'clock_in', (v_last_sunday + time '08:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
    (v_kumar, 'clock_out', (v_last_sunday + time '19:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true);

  -- Wong: normal week, plus an approved 2-day annual leave earlier in the month
  for d in select generate_series(current_date - 6, current_date - 1, interval '1 day')::date loop
    if d <> v_last_sunday then
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_wong, 'clock_in', (d + time '07:55') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_wong, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_wong, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_wong, 'clock_out', (d + time '17:02') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    end if;
  end loop;

  insert into leave_requests (employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at)
  values (v_wong, 'annual', v_leave_start, v_leave_end, 'Family event', 'approved', v_farah, now());

  insert into leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
  values (v_siti, 'medical', current_date + 1, current_date + 1, 'Clinic follow-up', 'pending');

  -- Farah (supervisor) and Devika (HR): clean punches
  for d in select generate_series(current_date - 6, current_date - 1, interval '1 day')::date loop
    if d <> v_last_sunday then
      insert into attendance_punches (employee_id, punch_type, punch_time, location_id, within_geofence) values
        (v_farah, 'clock_in', (d + time '07:50') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_farah, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_farah, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_farah, 'clock_out', (d + time '17:10') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_devika, 'clock_in', (d + time '08:05') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_devika, 'break_start', (d + time '12:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_devika, 'break_end', (d + time '13:30') at time zone 'Asia/Kuala_Lumpur', v_loc, true),
        (v_devika, 'clock_out', (d + time '17:00') at time zone 'Asia/Kuala_Lumpur', v_loc, true);
    end if;
  end loop;

  -- belt-and-braces: the punch/leave triggers already computed these, but make
  -- sure the full window is covered even if a step above was skipped.
  perform fn_recompute_range(v_ahmad, current_date - 9, current_date);
  perform fn_recompute_range(v_siti, current_date - 9, current_date);
  perform fn_recompute_range(v_kumar, current_date - 9, current_date);
  perform fn_recompute_range(v_wong, current_date - 9, current_date);
  perform fn_recompute_range(v_farah, current_date - 9, current_date);
  perform fn_recompute_range(v_devika, current_date - 9, current_date);
end $$;
