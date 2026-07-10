import { createClient } from "@/lib/supabase/server";
import type { Employee, LeaveRequest } from "@/lib/types";

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: Pick<Employee, "id" | "full_name" | "staff_no">;
};

export async function getLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, employee:employees(id, full_name, staff_no)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as LeaveRequestWithEmployee[];
}
