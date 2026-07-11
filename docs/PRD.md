# Product Requirements — My Time Management System

## Problem
Factory HR manually calculates punch-card records for payroll: tedious, error-prone, and non-compliant with Malaysia Labour Law OT rules. There is no audit trail and no visibility into late arrivals, missing punches, or leave balances.

## Target Users
- **Employees** — clock in/out from their own mobile at the factory.
- **HR / Admin** — review exceptions, approve/reject leaves, export payroll summary.
- **Supervisors** — monitor their team's daily attendance in real time.

## Core Objects
| Object | Purpose |
|---|---|
| `employees` | Staff profile + shift config |
| `approved_locations` | GPS geofence boundaries |
| `attendance_punches` | Clock-in, break, clock-out per day |
| `leaves` | AL / MC / Hospitalisation / Unpaid / Absent |
| `public_holidays` | Holiday calendar for day-type classification |
| `audit_logs` | Every HR override recorded |

## MVP Must-Haves (v1)
- [ ] Employee punches clock-in, break-start, break-end, clock-out from mobile
- [ ] GPS verified against at least one approved location
- [ ] System auto-computes normal hours, OT, rest-day, public-holiday hours (Malaysia EA 1955 rules)
- [ ] Leave entry form with all Malaysia leave types
- [ ] HR exceptions dashboard: late, early departure, missing punch, with override capability
- [ ] Monthly Excel export per employee (payroll-ready columns)
- [ ] App works without login in v1 (demo-first); auth added in Lock-it-down sprint

## Non-Goals (v1)
- Payslip generation
- Biometric / QR check-in
- Multi-tenant SaaS
- Payroll software API integration

## Success Criterion
Ahmad clocks in at 08:05 from the factory floor → system marks him on-time, records GPS pass → at 17:00 he clocks out → system calculates 8 h normal, 0 OT → HR opens the monthly export → Excel shows Ahmad's correct hours and leave days, matching Malaysia EA 1955 — all without touching a punch card.