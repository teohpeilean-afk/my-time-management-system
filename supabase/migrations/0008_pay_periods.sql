-- Pay periods: named payroll cut-offs HR exports against (e.g. 26th-25th).
-- Closing a period is a bookkeeping marker for "payroll done" — it does not
-- freeze the underlying attendance data (recomputes still apply; re-export
-- to pick them up).

create table pay_periods (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  constraint pay_period_dates_valid check (end_date >= start_date)
);

create index idx_pay_periods_start on pay_periods (start_date desc);

alter table pay_periods enable row level security;

create policy "pay_periods_select" on pay_periods for select to authenticated using (true);
create policy "pay_periods_write_hr" on pay_periods for all to authenticated
  using (auth_role() = 'hr') with check (auth_role() = 'hr');
