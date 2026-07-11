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

  const { data: before } = await supabase
    .from("attendance_days")
    .select(
      "normal_minutes, normal_ot_minutes, rest_day_minutes, rest_day_ot_minutes, ph_minutes, ph_ot_minutes, review_note",
    )
    .eq("id", dayId)
    .maybeSingle();

  const { data: updated, error } = await supabase
    .from("attendance_days")
    .update({
      review_status: "reviewed",
      reviewed_by: reviewerId || null,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
      ...(adjusted ?? {}),
    })
    .eq("id", dayId)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }
  // RLS silently matches zero rows instead of erroring — that's not a real
  // success, just an actor who isn't this employee's manager or hr.
  if (!updated || updated.length === 0) {
    return { ok: false, error: "You don't have permission to review this day." };
  }

  await supabase.from("audit_logs").insert({
    actor: reviewerId || null,
    action: "hr_override_attendance_day",
    target_table: "attendance_days",
    target_id: dayId,
    old_value: before ?? null,
    new_value: { ...(adjusted ?? {}), review_note: note || null },
  });

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
