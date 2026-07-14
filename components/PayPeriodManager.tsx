"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPayPeriod, setPayPeriodStatus, deletePayPeriod } from "@/app/actions/payPeriods";
import { formatDate } from "@/lib/attendance/format";
import type { PayPeriod } from "@/lib/types";

export function PayPeriodManager({
  periods,
  canWrite,
}: {
  periods: PayPeriod[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addPayPeriod(startDate, endDate);
      if (!result.ok) {
        setError(result.error ?? "Could not add pay period.");
        return;
      }
      setStartDate("");
      setEndDate("");
      router.refresh();
    });
  }

  function handleStatus(id: string, status: "open" | "closed") {
    setError(null);
    startTransition(async () => {
      const result = await setPayPeriodStatus(id, status);
      if (!result.ok) setError(result.error ?? "Could not update period.");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      await deletePayPeriod(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Pay periods</h2>
      {canWrite && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <label className="text-xs text-neutral-500">
            From
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            To
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-brand-600 dark:text-white"
          >
            Add period
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {periods.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
          No pay periods yet{canWrite ? " — add your payroll cut-offs above" : ""}. You can
          still export any date range below.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "open"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`/api/export?start=${p.start_date}&end=${p.end_date}`}
                        className="text-sm text-brand-700 underline dark:text-brand-300"
                      >
                        Export .xlsx
                      </a>
                      {canWrite && p.status === "open" && (
                        <button
                          disabled={pending}
                          onClick={() => handleStatus(p.id, "closed")}
                          className="text-sm text-neutral-600 underline disabled:opacity-50 dark:text-neutral-400"
                        >
                          Close
                        </button>
                      )}
                      {canWrite && p.status === "closed" && (
                        <button
                          disabled={pending}
                          onClick={() => handleStatus(p.id, "open")}
                          className="text-sm text-neutral-600 underline disabled:opacity-50 dark:text-neutral-400"
                        >
                          Reopen
                        </button>
                      )}
                      {canWrite && (
                        <button
                          disabled={pending}
                          onClick={() => handleDelete(p.id)}
                          className="text-sm text-red-600 underline disabled:opacity-50 dark:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
