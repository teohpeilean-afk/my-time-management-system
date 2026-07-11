"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EmployeeRole } from "@/lib/types";

export async function updateEmployeeRole(employeeId: string, role: EmployeeRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ role }).eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function updateEmployeeSupervisor(employeeId: string, supervisorId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ supervisor_id: supervisorId })
    .eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function toggleEmployeeActive(employeeId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ active }).eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}
