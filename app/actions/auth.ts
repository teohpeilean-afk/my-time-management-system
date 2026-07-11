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
    options: {
      data: {
        full_name: input.fullName,
        staff_no: input.staffNo || null,
      },
    },
  });
  if (error) return { ok: false, error: error.message };

  // The employees row is created/linked server-side by the on_auth_user_created
  // trigger (see supabase/migrations/0005_lockdown_and_roles.sql) — it runs
  // regardless of whether a session exists yet, which a client-side insert here
  // could not guarantee once email confirmation is required.
  return { ok: true, needsConfirmation: !data.session };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
