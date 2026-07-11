import { createClient } from "@/lib/supabase/server";
import { getCurrentSession } from "@/lib/session";
import { TeamManager } from "@/components/TeamManager";
import { AccessDenied } from "@/components/AccessDenied";
import type { Employee } from "@/lib/types";

export default async function TeamPage() {
  const { employee } = await getCurrentSession();

  if (employee?.role !== "hr") {
    return <AccessDenied />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("employees").select("*").order("full_name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Team</h1>
        <p className="text-sm text-neutral-500">
          Assign roles and reporting lines. Supervisors see attendance, leave and
          exceptions for whoever reports to them.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Unable to load team — try again.
        </p>
      ) : (
        <TeamManager employees={(data as Employee[]) ?? []} />
      )}
    </div>
  );
}
