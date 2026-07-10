"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AdjustedMinutes {
  normal_minutes: number;
  normal_ot_minutes: number;
  rest_day_minutes: number;
  rest_day_ot_minutes: number;
  ph_minutes: number;
  ph_ot_minutes: number;
}

export async function markReviewed(
  dayId: string,
  reviewerId: string,
  note: string,
  adjusted?: AdjustedMinutes,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance_days")
    .update({
      review_status: "reviewed",
      reviewed_by: reviewerId || null,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
      ...(adjusted ?? {}),
    })
    .eq("id", dayId);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/review");
  return { ok: true };
}

export async function recomputeDay(employeeId: string, workDate: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_recompute_range", {
    p_employee_id: employeeId,
    p_start: workDate,
    p_end: workDate,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/review");
  return { ok: true };
}
