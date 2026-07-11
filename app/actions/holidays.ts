"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addHoliday(input: { holidayDate: string; name: string }) {
  if (!input.holidayDate || !input.name) {
    return { ok: false, error: "Date and name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("public_holidays").insert({
    holiday_date: input.holidayDate,
    name: input.name,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/holidays");
  return { ok: true };
}

export async function deleteHoliday(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("public_holidays").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/holidays");
  return { ok: true };
}
