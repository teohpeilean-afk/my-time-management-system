-- Real 2026 public holidays observed at the site (Selangor), replacing the
-- illustrative sample dates from 0003_seed_data.sql. Rest day is Sunday, so
-- per the substitution rule a holiday falling on a Sunday is observed on the
-- next working day (and if that day is itself a holiday, the day after):
--   Hari Raya Puasa 2nd day  22 Mar (Sun) -> 23 Mar (Mon)
--   Wesak Day                31 May (Sun) -> 1 Jun is Agong's birthday -> 2 Jun (Tue)
--   Deepavali                 8 Nov (Sun) -> 9 Nov (Mon)
-- ** dates (Raya Puasa/Haji, Deepavali) are subject to change; update if the
-- gazette shifts them.

delete from public_holidays where holiday_date between '2026-01-01' and '2026-12-31';

insert into public_holidays (holiday_date, name) values
  ('2026-01-01', 'New Year''s Day'),
  ('2026-02-17', 'Chinese New Year'),
  ('2026-02-18', 'Chinese New Year (2nd day)'),
  ('2026-03-21', 'Hari Raya Puasa'),
  ('2026-03-23', 'Hari Raya Puasa (2nd day, observed)'),
  ('2026-05-01', 'Labour Day'),
  ('2026-05-27', 'Hari Raya Haji'),
  ('2026-06-01', 'Birthday of SPB Yang di-Pertuan Agong'),
  ('2026-06-02', 'Wesak Day (observed)'),
  ('2026-08-31', 'National Day'),
  ('2026-09-16', 'Malaysia Day'),
  ('2026-11-09', 'Deepavali (observed)'),
  ('2026-12-11', 'Birthday of the Sultan of Selangor'),
  ('2026-12-25', 'Christmas Day')
on conflict (holiday_date) do update set name = excluded.name;
