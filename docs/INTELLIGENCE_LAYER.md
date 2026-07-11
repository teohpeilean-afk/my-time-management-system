# Intelligence Layer

## Messy Inputs
- Employees forget to clock out → `clock_out` is null at midnight.
- GPS drift → coords outside geofence but employee is genuinely on-site.
- Punches submitted in wrong order (break_end before break_start).

## Auto-Structure on Punch Save
```json
{
  "employee_id": "e100...",
  "punch_date": "2025-07-11",
  "day_type": "normal",
  "location_verified": true,
  "computed": {
    "total_worked_minutes": 510,
    "normal_minutes": 480,
    "ot_minutes": 30,
    "is_late": false,
    "has_missing_punch": false
  },
  "ai_anomaly_flag": null,
  "ai_anomaly_flag_confidence": null,
  "ai_anomaly_flag_review_status": "unreviewed"
}
```

## Events to Track
- `punch.submitted` — every clock-in/out
- `location.verified_fail` — GPS outside all approved locations
- `exception.detected` — late / missing punch / early departure
- `hr.override` — HR edits a punch
- `leave.submitted` / `leave.approved`

## Scoring Rules (rule-based v1, ML later)
| Signal | Flag |
|---|---|
| GPS > 200 m from any location | `location_suspicious` |
| Clock-in from different location each day | `location_inconsistent` |
| <2 h between clock-in and clock-out | `suspiciously_short_shift` |
| Missing punch >2× in a week | `chronic_missing_punch` |

## What Gets Ranked
- Employees sorted by exception count in HR dashboard.
- Days flagged for HR review surfaced at top of exceptions list.

## v1 vs Later
- **v1**: rule-based flags, stored in `ai_anomaly_flag` with `confidence=1.0, source='rules_engine'`.
- **Later**: ML model replaces rules; confidence score becomes probabilistic; HR review queue fed by ranked anomaly score.