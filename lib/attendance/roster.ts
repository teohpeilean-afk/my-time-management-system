import { createClient } from "@/lib/supabase/server";
import type { Employee, RosterAssignment, ShiftTemplate } from "@/lib/types";

export interface RosterWeekResult {
  ok: boolean;
  employees: Employee[];
  assignments: RosterAssignment[];
  templates: ShiftTemplate[];
}

export async function getRosterWeek(startDate: string, endDate: string): Promise<RosterWeekResult> {
  const supabase = await createClient();
  const [
    { data: employees, error: employeesError },
    { data: assignments, error: assignmentsError },
    { data: templates, error: templatesError },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("active", true).order("full_name"),
    supabase.from("roster_assignments").select("*").gte("work_date", startDate).lte("work_date", endDate),
    supabase.from("shift_templates").select("*").eq("active", true).order("start_time"),
  ]);

  if (employeesError || assignmentsError || templatesError || !employees) {
    return { ok: false, employees: [], assignments: [], templates: [] };
  }

  return {
    ok: true,
    employees: employees as Employee[],
    assignments: (assignments as RosterAssignment[]) ?? [],
    templates: (templates as ShiftTemplate[]) ?? [],
  };
}

// Formats a Date using its LOCAL calendar fields — toISOString() converts to
// UTC first, which rolls the date back a day whenever the server's local
// timezone is behind UTC (e.g. anything west of Kuala Lumpur).
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Monday..Sunday of the week containing anchorDate.
export function weekBoundsFor(anchorDate: string): { start: string; days: string[] } {
  const anchor = new Date(`${anchorDate}T00:00:00`);
  const dow = anchor.getDay(); // 0=Sun..6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(toDateStr(d));
  }
  return { start: days[0], days };
}

export function shiftWeek(anchorDate: string, weeks: number): string {
  const d = new Date(`${anchorDate}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return toDateStr(d);
}
