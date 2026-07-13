-- Anti-cheat hardening: GPS accuracy tracking and a QR second factor.
--
-- QR secrets live in their own hr-only table (NOT as a column on
-- approved_locations, whose select policy is open to all employees — a
-- worker must never be able to read the secret via the API and forge the
-- payload without standing at the site). Punch verification goes through a
-- security-definer function so workers can verify a scanned code without
-- read access to the secret itself.

create table location_qr_secrets (
  location_id uuid primary key references approved_locations(id) on delete cascade,
  secret uuid not null default gen_random_uuid(),
  rotated_at timestamptz not null default now()
);

alter table location_qr_secrets enable row level security;

-- hr reads secrets (to print the QR poster) and rotates them; nobody else
-- can see them at all.
create policy "location_qr_secrets_hr" on location_qr_secrets for all to authenticated
  using (auth_role() = 'hr') with check (auth_role() = 'hr');

-- One secret per existing location.
insert into location_qr_secrets (location_id)
select id from approved_locations;

create or replace function fn_verify_location_qr(p_location_id uuid, p_secret uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from location_qr_secrets
    where location_id = p_location_id and secret = p_secret
  );
$$;

grant execute on function fn_verify_location_qr(uuid, uuid) to authenticated;

-- Punches record the raw GPS accuracy and the QR outcome:
--   qr_ok = true  -> scanned a valid current site code
--   qr_ok = false -> scanned something, but it didn't verify
--   qr_ok = null  -> no scan (camera unavailable / skipped) — flagged, not blocked
alter table attendance_punches add column accuracy_meters double precision;
alter table attendance_punches add column qr_ok boolean;
