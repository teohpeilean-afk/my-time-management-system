# Data Model

## `approved_locations`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable until lock-down |
| name | text | e.g. "Main Factory Floor" |
| latitude | numeric(10,7) | |
| longitude | numeric(10,7) | |
| radius_meters | int | default 100 |
| is_active | boolean | |

## `employees`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| employee_no | text UNIQUE | |
| full_name | text | |
| department | text | |
| position | text | |
| employment_type | text | full_time / part_time / contract |
| shift_start / shift_end | time | default 08:00–17:00 |
| grace_minutes | int | late threshold |
| is_active | boolean | |

## `public_holidays`
| Field | Type |
|---|---|
| holiday_date | date UNIQUE |
| name | text |
| state | text | ALL or state code |

## `attendance_punches`
| Field | Type | Notes |
|---|---|---|
| employee_id | uuid FK→employees | |
| punch_date | date | |
| clock_in / break_start / break_end / clock_out | timestamptz | nullable until punched |
| clock_in_lat/lng, clock_out_lat/lng | numeric | GPS captured |
| location_verified | boolean | |
| total_worked_minutes, break_minutes | int | computed on clock-out |
| normal_minutes, ot_minutes | int | EA 1955 split |
| rest_day_minutes, ph_minutes | int | |
| rest_day_ot_minutes, ph_ot_minutes | int | |
| is_late, late_minutes | bool/int | |
| is_early_departure, early_departure_minutes | bool/int | |
| has_missing_punch | boolean | |
| day_type | text | normal / rest_day / public_holiday |
| hr_adjusted | boolean | |
| hr_notes | text | |
| status | text | pending / approved / flagged |
| **ai_anomaly_flag** | text | AI field |
| ai_anomaly_flag_source | text | model id |
| ai_anomaly_flag_confidence | numeric | 0–1 |
| ai_anomaly_flag_review_status | text | default 'unreviewed' |

## `leaves`
| Field | Type | Notes |
|---|---|---|
| employee_id | uuid FK | |
| leave_type | text | Annual/Medical/Hospitalisation/Unpaid/Absent/Other |
| start_date, end_date | date | |
| total_days | numeric(4,1) | |
| remarks | text | |
| status | text | pending / approved / rejected |
| approved_by | text | |
| approved_at | timestamptz | |

## `audit_logs`
| Field | Type |
|---|---|
| actor | text |
| action | text |
| target_table | text |
| target_id | uuid |
| old_value / new_value | jsonb |
| ip_address | text |

## RLS
- v1: all tables open (select + all) for anonymous demo.
- Lock-down sprint: employee rows scoped to `auth.uid() = user_id`; HR role bypasses via `role = 'hr'` claim.