-- Pay engine inputs: monthly salary and OT eligibility per employee.
-- monthly_salary drives ORP (salary/26) and the hourly rate; ot_eligible
-- gates the 1.5x/2x/3x overtime components (statutory OT is mandatory only
-- up to RM4,000/month — above that it's contractual, so HR sets the flag).
--
-- Only hr can write these (covered by the existing employees_update_hr
-- policy). Note: the existing employees_select policy means a supervisor can
-- read their direct reports' rows, salary included — acceptable for now,
-- revisit with column-level privileges if salary must be HR-only.

alter table employees add column monthly_salary numeric(10,2) not null default 0 check (monthly_salary >= 0);
alter table employees add column ot_eligible boolean not null default true;
