"use client";

import { useActiveEmployee } from "@/components/EmployeeContext";

export function EmployeeSwitcher() {
  const { employees, activeEmployeeId, setActiveEmployeeId } = useActiveEmployee();

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-neutral-500">Acting as</span>
      <select
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        value={activeEmployeeId ?? ""}
        onChange={(e) => setActiveEmployeeId(e.target.value)}
      >
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.full_name} ({employee.staff_no})
          </option>
        ))}
      </select>
    </label>
  );
}
