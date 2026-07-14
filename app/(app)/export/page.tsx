import { createClient } from "@/lib/supabase/server";
import { todayInKL } from "@/lib/attendance/format";
import { getCurrentSession } from "@/lib/session";
import { AccessDenied } from "@/components/AccessDenied";
import { PayPeriodManager } from "@/components/PayPeriodManager";
import type { PayPeriod } from "@/lib/types";

function firstOfMonth(): string {
  const today = todayInKL();
  return `${today.slice(0, 7)}-01`;
}

export default async function ExportPage() {
  const { employee } = await getCurrentSession();
  if (employee?.role !== "hr" && employee?.role !== "supervisor") {
    return <AccessDenied />;
  }

  const supabase = await createClient();
  const { data: periods } = await supabase
    .from("pay_periods")
    .select("*")
    .order("start_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Export attendance summary</h1>
        <p className="text-sm text-neutral-500">
          Excel workbook with three sheets — Summary (per-employee totals incl. RM),
          Detail (every day), and Exceptions (missing punches, absences, unreviewed
          days) — for payroll.
        </p>
      </div>

      <PayPeriodManager periods={(periods as PayPeriod[]) ?? []} canWrite={employee.role === "hr"} />

      <div className="space-y-3">
        <h2 className="font-semibold">Custom date range</h2>
        <form
          action="/api/export"
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <label className="text-xs text-neutral-500">
            From
            <input
              type="date"
              name="start"
              defaultValue={firstOfMonth()}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            To
            <input
              type="date"
              name="end"
              defaultValue={todayInKL()}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white dark:bg-brand-600 dark:text-white"
          >
            Download .xlsx
          </button>
        </form>
      </div>
    </div>
  );
}
