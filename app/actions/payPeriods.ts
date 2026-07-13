"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPayPeriod(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return { ok: false, error: "Start and end dates are required." };
  }
  if (endDate < startDate) {
    return { ok: false, error: "End date must be on or after start date." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pay_periods")
    .insert({ start_date: startDate, end_date: endDate })
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Only HR can manage pay periods." };
  }
  revalidatePath("/export");
  return { ok: true };
}

export async function setPayPeriodStatus(id: string, status: "open" | "closed") {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pay_periods")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Only HR can manage pay periods." };
  }
  revalidatePath("/export");
  return { ok: true };
}

export async function deletePayPeriod(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pay_periods").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/export");
  return { ok: true };
}
