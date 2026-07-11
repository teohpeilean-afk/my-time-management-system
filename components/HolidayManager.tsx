"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addHoliday, deleteHoliday } from "@/app/actions/holidays";
import { formatDate } from "@/lib/attendance/format";
import type { PublicHoliday } from "@/lib/types";

export function HolidayManager({ holidays }: { holidays: PublicHoliday[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [holidayDate, setHolidayDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addHoliday({ holidayDate, name });
      if (!result.ok) {
        setError(result.error ?? "Could not add holiday.");
        return;
      }
      setHolidayDate("");
      setName("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteHoliday(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <label className="text-xs text-neutral-500">
          Date
          <input
            type="date"
            required
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
            className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex-1 text-xs text-neutral-500">
          Name
          <input
            type="text"
            required
            placeholder="e.g. Merdeka Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          Add holiday
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {holidays.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
          No public holidays configured.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-2">{formatDate(h.holiday_date)}</td>
                  <td className="px-4 py-2">{h.name}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      disabled={pending}
                      onClick={() => handleDelete(h.id)}
                      className="text-sm text-red-600 underline disabled:opacity-50 dark:text-red-400"
                    >
                      Delete
                    </button>
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
