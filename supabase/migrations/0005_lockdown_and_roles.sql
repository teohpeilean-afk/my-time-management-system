-- Lock-down sprint: real per-user data isolation, replacing the demo-open
-- policies from 0001_core_schema.sql. Adds a "reports to" edge so
-- supervisors can be scoped to their own team, a robust auth.users trigger
-- to replace the old client-side employees insert on signup, and marks the
-- attendance recompute functions security definer so a plain employee's own
-- clock-out still recomputes their hours once writes to attendance_days are
-- restricted to managers.

alter table employees add column supervisor_id uuid references employees(id);

-- ── Identity helpers (security definer so they can read `employees` without
-- re-triggering its own RLS policies, which would recurse) ─────────────────

create or replace function auth_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from employees where user_id = auth.uid() limit 1;
$$;

create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from employees where user_id = auth.uid() limit 1;
$$;

-- True if the current user is hr, or is the target employee's supervisor.
create or replace function auth_manages(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth_role() = 'hr'
    or exists (
      select 1 from employees
      where id = target_employee_id
        and supervisor_id = auth_employee_id()
    );
$$;

grant execute on function auth_employee_id() to authenticated;
grant execute on function auth_role() to authenticated;
grant execute on function auth_manages(uuid) to authenticated;

-- ── Signup: create/link the employees row from a trigger on auth.users
-- instead of a client-side insert. The old flow (client inserts right after
-- auth.signUp()) silently depended on open RLS; if email confirmation is on,
-- there's no session yet at that point, so the insert would now be rejected
-- outright. A security-definer trigger sidesteps that entirely. ───────────

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_staff_no text;
  v_existing_id uuid;
  v_generated_staff_no text;
begin
  v_full_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1));
  v_staff_no := nullif(new.raw_user_meta_data->>'staff_no', '');

  if v_staff_no is not null then
    select id into v_existing_id
      from employees
     where staff_no = v_staff_no
       and user_id is null
     limit 1;

    if v_existing_id is not null then
      update employees set user_id = new.id where id = v_existing_id;
      return new;
    end if;
  end if;

  v_generated_staff_no := case
    when v_staff_no is not null then v_staff_no || '-' || upper(substr(new.id::text, 1, 4))
    else 'U-' || upper(substr(new.id::text, 1, 6))
  end;

  insert into employees (full_name, staff_no, user_id)
  values (v_full_name, v_generated_staff_no, new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_auth_user();

-- ── Recompute functions must bypass RLS: they write attendance_days on
-- behalf of whoever punched, and attendance_days writes are about to become
-- manager-only. ─────────────────────────────────────────────────────────

alter function fn_recompute_attendance_day(uuid, date) security definer set search_path = public;
alter function fn_recompute_range(uuid, date, date) security definer set search_path = public;
alter function fn_recompute_all(date, date) security definer set search_path = public;

-- ── Replace every demo-open policy with real ones ───────────────────────

drop policy if exists "demo_all_employees" on employees;
drop policy if exists "demo_all_approved_locations" on approved_locations;
drop policy if exists "demo_all_public_holidays" on public_holidays;
drop policy if exists "demo_all_attendance_punches" on attendance_punches;
drop policy if exists "demo_all_leave_requests" on leave_requests;
drop policy if exists "demo_all_attendance_days" on attendance_days;
drop policy if exists "demo_all_audit_logs" on audit_logs;

-- employees: see self, your reports, or everyone if hr. Only hr edits roles
-- / reporting lines / active status (via the /team page). No client insert
-- policy — handle_new_auth_user() (security definer) is the only writer.
create policy "employees_select" on employees for select to authenticated
  using (
    id = auth_employee_id()
    or auth_role() = 'hr'
    or (auth_role() = 'supervisor' and supervisor_id = auth_employee_id())
  );
create policy "employees_update_hr" on employees for update to authenticated
  using (auth_role() = 'hr') with check (auth_role() = 'hr');

-- approved_locations / public_holidays: everyone needs to read these to
-- make sense of their own attendance; only hr edits them.
create policy "approved_locations_select" on approved_locations for select to authenticated using (true);
create policy "approved_locations_write_hr" on approved_locations for all to authenticated
  using (auth_role() = 'hr') with check (auth_role() = 'hr');

create policy "public_holidays_select" on public_holidays for select to authenticated using (true);
create policy "public_holidays_write_hr" on public_holidays for all to authenticated
  using (auth_role() = 'hr') with check (auth_role() = 'hr');

-- attendance_punches: append-only. Insert only your own; no update/delete
-- policy for anyone (matches the existing "punches are immutable" design).
create policy "attendance_punches_select" on attendance_punches for select to authenticated
  using (employee_id = auth_employee_id() or auth_manages(employee_id));
create policy "attendance_punches_insert" on attendance_punches for insert to authenticated
  with check (employee_id = auth_employee_id());

-- leave_requests: submit your own; only your manager (or hr) approves/rejects.
create policy "leave_requests_select" on leave_requests for select to authenticated
  using (employee_id = auth_employee_id() or auth_manages(employee_id));
create policy "leave_requests_insert" on leave_requests for insert to authenticated
  with check (employee_id = auth_employee_id());
create policy "leave_requests_update_manager" on leave_requests for update to authenticated
  using (auth_manages(employee_id)) with check (auth_manages(employee_id));

-- attendance_days: read your own or your team's; only a manager can HR-
-- override (update). No client insert policy — only the now-security-
-- definer recompute functions write these rows.
create policy "attendance_days_select" on attendance_days for select to authenticated
  using (employee_id = auth_employee_id() or auth_manages(employee_id));
create policy "attendance_days_update_manager" on attendance_days for update to authenticated
  using (auth_manages(employee_id)) with check (auth_manages(employee_id));

-- audit_logs: hr-only read; insert restricted to whoever can actually
-- trigger an override or export (supervisor/hr). No update/delete policy at
-- all anywhere — append-only by default deny, per docs/SECURITY.md.
create policy "audit_logs_select_hr" on audit_logs for select to authenticated
  using (auth_role() = 'hr');
create policy "audit_logs_insert_managers" on audit_logs for insert to authenticated
  with check (auth_role() in ('hr', 'supervisor'));
