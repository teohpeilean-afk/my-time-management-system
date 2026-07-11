# Agentic Layer

## Risk Classification

### Low Risk — Auto-execute (summarise / tag)
- Auto-classify `day_type` (normal / rest_day / public_holiday) on punch save.
- Auto-set `is_late`, `late_minutes`, `is_early_departure`, `has_missing_punch`.
- Auto-tag `ai_anomaly_flag` via rules engine.

### Medium Risk — Propose, HR confirms
- **Draft missing-punch correction**: if clock_out is null at 23:59, system drafts `clock_out = shift_end`, flags `hr_adjusted=true`, waits for HR approval.
- **Suggest leave type**: if employee is absent without punch, system proposes 'Absent' leave entry; HR approves before save.

### High Risk — Always requires approval
- Sending payroll export to external party.
- Bulk adjusting multiple employees' punch records.

### Critical — Human only
- Deleting any attendance record.
- Modifying a record after payroll export is confirmed.
- Changing approved_location boundaries.

## Named Tools
| Tool | Action | Risk |
|---|---|---|
| `compute_hours` | Calculate minutes split on punch save | Low |
| `flag_anomaly` | Tag rule-based anomaly | Low |
| `draft_missing_punch` | Propose clock-out value | Medium |
| `export_excel` | Generate Excel file | High |
| `delete_punch_record` | Remove a row | Critical |

## Audit Log Fields
`actor`, `action`, `target_table`, `target_id`, `old_value (jsonb)`, `new_value (jsonb)`, `ip_address`, `created_at`

## v1 vs Later
- **v1**: `compute_hours` and `flag_anomaly` auto-run; all others are manual HR actions logged.
- **Later**: `draft_missing_punch` surfaces in HR queue; Edge Function cron triggers nightly.