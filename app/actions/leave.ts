"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeaveType } from "@/lib/types";

export async function createLeaveRequest(input: {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  if (!input.employeeId) {
    return { ok: false, error: "No employee selected." };
  }
  if (input.endDate < input.startDate) {
    return { ok: false, error: "End date must be on or after start date." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").insert({
    employee_id: input.employeeId,
    leave_type: input.leaveType,
    start_date: input.startDate,
    end_date: input.endDate,
    reason: input.reason || null,
    status: "pending",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/leave");
  return { ok: true };
}

export async function reviewLeaveRequest(
  id: string,
  reviewerId: string,
  status: "approved" | "rejected",
  note: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leave_requests")
    .update({
      status,
      reviewed_by: reviewerId || null,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/leave");
  return { ok: true };
}
