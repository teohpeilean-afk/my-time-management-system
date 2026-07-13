"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateEmployeeRole,
  updateEmployeeSupervisor,
  toggleEmployeeActive,
  updateEmployeePay,
} from "@/app/actions/team";
import type { Employee, EmployeeRole } from "@/lib/types";

const ROLES: EmployeeRole[] = ["worker", "supervisor", "hr"];

function SalaryCell({
  employee,
  pending,
  onSave,
}: {
  employee: Employee;
  pending: boolean;
  onSave: (salary: number, otEligible: boolean) => void;
}) {
  const [salary, setSalary] = useState(String(employee.monthly_salary ?? 0));

  function commit() {
    const parsed = Number(salary);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setSalary(String(employee.monthly_salary ?? 0));
      return;
    }
    if (parsed !== employee.monthly_salary) {
      onSave(parsed, employee.ot_eligible);
    }
  }

  return (
    <input
      type="number"
      min={0}
      step="0.01"
      disabled={pending}
      value={salary}
      onChange={(ev) => setSalary(ev.target.value)}
      onBlur={commit}
      onKeyDown={(ev) => ev.key === "Enter" && (ev.target as HTMLInputElement).blur()}
      className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
    />
  );
}

export function TeamManager({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRoleChange(id: string, role: EmployeeRole) {
    startTransition(async () => {
      await updateEmployeeRole(id, role);
      router.refresh();
    });
  }

  function handleSupervisorChange(id: string, supervisorId: string) {
    startTransition(async () => {
      await updateEmployeeSupervisor(id, supervisorId || null);
      router.refresh();
    });
  }

  function handleActiveToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleEmployeeActive(id, active);
      router.refresh();
    });
  }

  function handlePayChange(id: string, salary: number, otEligible: boolean) {
    startTransition(async () => {
      await updateEmployeePay(id, salary, otEligible);
      router.refresh();
    });
  }

  if (employees.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
        No employees yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Reports to</th>
            <th className="px-4 py-2 font-medium">Salary (RM/mo)</th>
            <th className="px-4 py-2 font-medium">OT eligible</th>
            <th className="px-4 py-2 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id} className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="px-4 py-2">
                <div className="font-medium">{e.full_name}</div>
                <div className="text-xs text-neutral-500">{e.staff_no}</div>
              </td>
              <td className="px-4 py-2">
                <select
                  disabled={pending}
                  value={e.role}
                  onChange={(ev) => handleRoleChange(e.id, ev.target.value as EmployeeRole)}
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm capitalize dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-2">
                <select
                  disabled={pending}
                  value={e.supervisor_id ?? ""}
                  onChange={(ev) => handleSupervisorChange(e.id, ev.target.value)}
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="">— none —</option>
                  {employees
                    .filter((o) => o.id !== e.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.full_name}
                      </option>
                    ))}
                </select>
              </td>
              <td className="px-4 py-2">
                <SalaryCell
                  employee={e}
                  pending={pending}
                  onSave={(salary, otEligible) => handlePayChange(e.id, salary, otEligible)}
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  disabled={pending}
                  checked={e.ot_eligible}
                  onChange={(ev) => handlePayChange(e.id, e.monthly_salary, ev.target.checked)}
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  disabled={pending}
                  checked={e.active}
                  onChange={(ev) => handleActiveToggle(e.id, ev.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
