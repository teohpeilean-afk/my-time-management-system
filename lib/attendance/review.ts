import { createClient } from "@/lib/supabase/server";
import type { AttendanceDay, Employee } from "@/lib/types";

export type AttendanceDayWithEmployee = AttendanceDay & {
  employee: Pick<Employee, "id" | "full_name" | "staff_no">;
};

export async function getPendingReviewDays(days = 30): Promise<AttendanceDayWithEmployee[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("attendance_days")
    .select("*, employee:employees(id, full_name, staff_no)")
    .eq("review_status", "pending")
    .gte("work_date", since)
    .order("work_date", { ascending: false });

  if (error || !data) return [];
  return data as unknown as AttendanceDayWithEmployee[];
}
