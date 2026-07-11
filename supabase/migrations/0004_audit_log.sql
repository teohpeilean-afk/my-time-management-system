-- Audit trail for HR overrides (exception review adjustments) and payroll
-- exports, per DATA_MODEL.md / TASKS.md Sprint 2 & 3.

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_target on audit_logs (target_table, target_id);

alter table audit_logs enable row level security;

-- Demo-first: no auth wall yet, so anon + authenticated share full access.
-- Tightened in the later "lock it down" sprint.
create policy "demo_all_audit_logs" on audit_logs for all to anon, authenticated using (true) with check (true);
