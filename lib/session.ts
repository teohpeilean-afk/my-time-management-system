import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";

export interface CurrentSession {
  authEmail: string | null;
  employee: Employee | null;
}

export async function getCurrentSession(): Promise<CurrentSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authEmail: null, employee: null };
  }

  const { data } = await supabase.from("employees").select("*").eq("user_id", user.id).maybeSingle();

  return { authEmail: user.email ?? null, employee: (data as Employee) ?? null };
}
