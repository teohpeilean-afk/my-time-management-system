"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addShiftTemplate(input: {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}) {
  if (!input.name || !input.startTime || !input.endTime) {
    return { ok: false, error: "Name, start and end time are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shift_templates").insert({
    name: input.name,
    start_time: input.startTime,
    end_time: input.endTime,
    break_minutes: input.breakMinutes,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/roster");
  return { ok: true };
}

export async function deleteShiftTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shift_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/roster");
  return { ok: true };
}

export async function assignRosterShift(
  employeeId: string,
  workDate: string,
  shiftTemplateId: string | null,
) {
  const supabase = await createClient();

  if (!shiftTemplateId) {
    const { error } = await supabase
      .from("roster_assignments")
      .delete()
      .eq("employee_id", employeeId)
      .eq("work_date", workDate);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/roster");
    return { ok: true };
  }

  const { data, error } = await supabase
    .from("roster_assignments")
    .upsert(
      { employee_id: employeeId, work_date: workDate, shift_template_id: shiftTemplateId },
      { onConflict: "employee_id,work_date" },
    )
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "You don't have permission to roster this employee." };
  }
  revalidatePath("/roster");
  return { ok: true };
}
