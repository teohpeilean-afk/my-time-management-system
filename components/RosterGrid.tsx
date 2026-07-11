"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignRosterShift } from "@/app/actions/roster";
import { formatDate } from "@/lib/attendance/format";
import type { Employee, RosterAssignment, ShiftTemplate } from "@/lib/types";

export function RosterGrid({
  employees,
  assignments,
  templates,
  days,
  prevWeekHref,
  nextWeekHref,
}: {
  employees: Employee[];
  assignments: RosterAssignment[];
  templates: ShiftTemplate[];
  days: string[];
  prevWeekHref: string;
  nextWeekHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const assignmentFor = (employeeId: string, day: string) =>
    assignments.find((a) => a.employee_id === employeeId && a.work_date === day) ?? null;

  function handleChange(employeeId: string, day: string, shiftTemplateId: string) {
    setError(null);
    startTransition(async () => {
      const result = await assignRosterShift(employeeId, day, shiftTemplateId || null);
      if (!result.ok) {
        setError(result.error ?? "Could not update roster.");
        return;
      }
      router.refresh();
    });
  }

  if (employees.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
        No employees to roster.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Week</h2>
        <div className="flex gap-2 text-sm">
          <Link href={prevWeekHref} className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700">
            ← Prev
          </Link>
          <Link href={nextWeekHref} className="rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700">
            Next →
          </Link>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2 font-medium">Employee</th>
              {days.map((d) => (
                <th key={d} className="px-2 py-2 text-center font-medium">
                  {formatDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-4 py-2">
                  <div className="font-medium">{emp.full_name}</div>
                  <div className="text-xs text-neutral-500">{emp.staff_no}</div>
                </td>
                {days.map((day) => {
                  const current = assignmentFor(emp.id, day);
                  return (
                    <td key={day} className="px-1 py-2">
                      <select
                        disabled={pending}
                        value={current?.shift_template_id ?? ""}
                        onChange={(e) => handleChange(emp.id, day, e.target.value)}
                        className="w-full rounded-md border border-neutral-300 bg-white px-1 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="">Default</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
