import { createClient } from "@/lib/supabase/server";
import { todayInKL } from "@/lib/attendance/format";
import type { AttendanceDay, Employee } from "@/lib/types";

export type AttendanceDayWithEmployee = AttendanceDay & {
  employee: Pick<Employee, "id" | "full_name" | "staff_no">;
};

// A day only needs review once it's over, and only if something in it is
// actually noteworthy: a flagged exception, any OT bucket, or a plain
// no-punch absence on an ordinary working day.
const EXCEPTION_FILTER = [
  "missing_punch.eq.true",
  "late_minutes.gt.0",
  "early_leave_minutes.gt.0",
  "normal_ot_minutes.gt.0",
  "rest_day_minutes.gt.0",
  "rest_day_ot_minutes.gt.0",
  "ph_minutes.gt.0",
  "ph_ot_minutes.gt.0",
  "and(worked_minutes.eq.0,leave_type.is.null,is_rest_day.eq.false,is_public_holiday.eq.false)",
].join(",");

export async function getPendingReviewDays(days = 30): Promise<AttendanceDayWithEmployee[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("attendance_days")
    .select("*, employee:employees!attendance_days_employee_id_fkey(id, full_name, staff_no)")
    .eq("review_status", "pending")
    .gte("work_date", since)
    .lt("work_date", todayInKL())
    .or(EXCEPTION_FILTER)
    .order("work_date", { ascending: false });

  if (error || !data) return [];
  return data as unknown as AttendanceDayWithEmployee[];
}
