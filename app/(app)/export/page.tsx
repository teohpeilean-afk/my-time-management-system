import { todayInKL } from "@/lib/attendance/format";
import { getCurrentSession } from "@/lib/session";
import { AccessDenied } from "@/components/AccessDenied";

function firstOfMonth(): string {
  const today = todayInKL();
  return `${today.slice(0, 7)}-01`;
}

export default async function ExportPage() {
  const { employee } = await getCurrentSession();
  if (employee?.role !== "hr" && employee?.role !== "supervisor") {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Export attendance summary</h1>
        <p className="text-sm text-neutral-500">
          Download an Excel summary of hours, overtime, exceptions and leave for payroll.
        </p>
      </div>
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
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Download .xlsx
        </button>
      </form>
    </div>
  );
}
