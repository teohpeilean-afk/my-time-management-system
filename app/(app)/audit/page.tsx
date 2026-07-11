import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime } from "@/lib/attendance/format";
import { getCurrentSession } from "@/lib/session";
import { AccessDenied } from "@/components/AccessDenied";

interface AuditLogRow {
  id: string;
  actor: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export default async function AuditPage() {
  const { employee } = await getCurrentSession();
  if (employee?.role !== "hr") {
    return <AccessDenied />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const logs = (data as AuditLogRow[]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Audit log</h1>
        <p className="text-sm text-neutral-500">
          Every HR override on the exception review and every payroll export, most recent first.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.code === "42P01"
            ? "Audit log table not found yet — apply supabase/migrations/0004_audit_log.sql."
            : "Unable to load the audit log — try again."}
        </p>
      ) : logs.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
          No audit events yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                  <td className="whitespace-nowrap px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    {formatDate(log.created_at.slice(0, 10))} {formatTime(log.created_at)}
                  </td>
                  <td className="px-4 py-2">{log.action}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    {log.actor ?? "—"}
                  </td>
                  <td className="max-w-md px-4 py-2 text-xs text-neutral-500">
                    {log.new_value && (
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(log.new_value)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
