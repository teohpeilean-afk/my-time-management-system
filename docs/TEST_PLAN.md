# Test Plan

## v1 Success Scenario (manual, in order)
1. Open `/` in a mobile browser — seed data visible, no login prompt.
2. Open `/punch` → select EMP001 → allow GPS → tap **Clock In**.
   - **Pass**: row in `attendance_punches` with `clock_in` set, `location_verified=true`.
3. Tap **Break Start** → **Break End** → **Clock Out**.
   - **Pass**: `total_worked_minutes ≈ 480`, `normal_minutes = 480`, `ot_minutes = 0`.
4. Open `/dashboard` → EMP001 row shows green "Approved" badge.
5. Open `/punch` for EMP002 at 08:22 → Clock In.
   - **Pass**: `is_late=true`, `late_minutes=22`, status = "pending".
6. HR opens `/dashboard` exceptions panel → sees EMP002 flagged.
7. HR clicks **Override** → sets clock_in to 08:00 → saves.
   - **Pass**: `hr_adjusted=true`, `audit_logs` row created with old/new value.
8. Open `/leave/new` → submit Annual Leave for EMP001 Jul 14–15.
   - **Pass**: leave row in DB, status = "pending".
9. HR approves leave → status = "approved", `approved_by` set.
10. HR clicks **Export July 2025** → `.xlsx` downloads.
    - **Pass**: EMP001 row shows 8 normal hrs, 0 OT, 2 AL days.

## Empty / Edge Cases
| Scenario | Expected |
|---|---|
| No punches today | Dashboard shows empty state with "No punches recorded yet" per employee |
| GPS denied by browser | Punch page shows "Location required — please enable GPS" and blocks submission |
| Clock-out before clock-in | API returns 400 "Invalid punch order" |
| Missing clock-out at midnight | `has_missing_punch=true`, row flagged in exceptions panel |
| Export with zero records | Excel downloads with header row only, no crash |
| Duplicate clock-in same day | API returns 409 "Already clocked in today" |

## Error States to Verify
- DB unreachable → dashboard shows "Unable to load attendance — try again" (not blank).
- GPS timeout >10 s → user sees spinner then error, not silent hang.
- Invalid employee_id in punch POST → 404 returned, nothing written to DB.