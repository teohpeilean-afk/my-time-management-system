"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(input: { email: string; password: string }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  staffNo: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) return { ok: false, error: error.message };

  const userId = data.user?.id;
  if (userId) {
    let linked = false;

    if (input.staffNo) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id, user_id")
        .eq("staff_no", input.staffNo)
        .maybeSingle();

      if (existing && !existing.user_id) {
        const { error: linkError } = await supabase
          .from("employees")
          .update({ user_id: userId })
          .eq("id", existing.id);
        linked = !linkError;
      }
    }

    if (!linked) {
      const staffNo = input.staffNo
        ? `${input.staffNo}-${userId.slice(0, 4).toUpperCase()}`
        : `U-${userId.slice(0, 6).toUpperCase()}`;
      await supabase.from("employees").insert({
        full_name: input.fullName,
        staff_no: staffNo,
        user_id: userId,
      });
    }
  }

  return { ok: true, needsConfirmation: !data.session };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
