import { createClient } from "@/lib/supabase/server";
import { todayInKL } from "@/lib/attendance/format";
import type { AttendancePunch, Employee, PunchType } from "@/lib/types";

export interface EmployeeTodayStatus {
  employee: Employee;
  lastPunch: AttendancePunch | null;
  firstClockIn: AttendancePunch | null;
  nextActions: PunchType[];
}

export function nextActionsFor(lastType: PunchType | null): PunchType[] {
  switch (lastType) {
    case null:
      return ["clock_in"];
    case "clock_in":
    case "break_end":
      return ["break_start", "clock_out"];
    case "break_start":
      return ["break_end"];
    case "clock_out":
      return [];
  }
}

export interface TeamTodayStatusResult {
  ok: boolean;
  statuses: EmployeeTodayStatus[];
}

export async function getTeamTodayStatus(): Promise<TeamTodayStatusResult> {
  const supabase = await createClient();
  const today = todayInKL();
  const startOfDay = new Date(`${today}T00:00:00+08:00`).toISOString();
  const endOfDay = new Date(`${today}T23:59:59.999+08:00`).toISOString();

  const [
    { data: employees, error: employeesError },
    { data: punches, error: punchesError },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("active", true).order("full_name"),
    supabase
      .from("attendance_punches")
      .select("*")
      .gte("punch_time", startOfDay)
      .lte("punch_time", endOfDay)
      .order("punch_time", { ascending: true }),
  ]);

  if (employeesError || punchesError || !employees) {
    return { ok: false, statuses: [] };
  }

  const punchesByEmployee = new Map<string, AttendancePunch[]>();
  for (const punch of (punches as AttendancePunch[]) ?? []) {
    const list = punchesByEmployee.get(punch.employee_id) ?? [];
    list.push(punch);
    punchesByEmployee.set(punch.employee_id, list);
  }

  const statuses = (employees as Employee[]).map((employee) => {
    const list = punchesByEmployee.get(employee.id) ?? [];
    const lastPunch = list.length > 0 ? list[list.length - 1] : null;
    const firstClockIn = list.find((p) => p.punch_type === "clock_in") ?? null;
    return {
      employee,
      lastPunch,
      firstClockIn,
      nextActions: nextActionsFor(lastPunch?.punch_type ?? null),
    };
  });

  return { ok: true, statuses };
}
