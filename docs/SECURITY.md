# Security

## Secret Handling
- Supabase service-role key stays server-side only (Next.js API routes / Edge Functions).
- Public anon key used in browser — intentional, scoped by RLS.
- No secrets in client bundles; no secrets in git.

## Permission Model (end state, reached at Lock-down sprint)
| Role | Scope |
|---|---|
| `employee` | Read/write own `attendance_punches`, `leaves` rows only (`auth.uid() = user_id`) |
| `supervisor` | Read all rows for their `department`; cannot delete |
| `hr` | Full read/write on all attendance + leaves; can approve/reject |
| `admin` | Full access including `approved_locations`, `public_holidays`, `employees` |

## v1 Demo State
- RLS policies are open (`using (true)`) — safe only for internal demo with no real PII.
- Lock-down sprint replaces with owner-scoped policies before real employee data goes in.
- **Do not deploy v1 open policies to production with real data.**

## Approved-Tools Rule
- Agent may only call named tools listed in AGENTIC_LAYER.md.
- No raw `exec`, `run_sql`, or `send_any` calls from agent context.
- Every tool invocation writes to `audit_logs`.

## Audit Principle
- Every HR override, leave approval, and export action is recorded in `audit_logs` before the mutation completes.
- Audit rows are append-only; no tool can update or delete them.