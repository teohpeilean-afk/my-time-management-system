"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActiveEmployee } from "@/components/EmployeeContext";
import { createLeaveRequest } from "@/app/actions/leave";
import type { LeaveType } from "@/lib/types";

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "annual", label: "Annual leave" },
  { value: "medical", label: "Medical leave" },
  { value: "hospitalization", label: "Hospitalization leave" },
  { value: "unpaid", label: "Unpaid leave" },
  { value: "absent", label: "Absent" },
  { value: "other", label: "Other" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function LeaveRequestForm() {
  const { activeEmployee } = useActiveEmployee();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await createLeaveRequest({
        employeeId: activeEmployee?.id ?? "",
        leaveType,
        startDate,
        endDate,
        reason,
      });
      if (!result.ok) {
        setMessage(`Failed: ${result.error}`);
        return;
      }
      setMessage("Leave request submitted.");
      setReason("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800"
    >
      <h2 className="col-span-full font-semibold">
        Request leave — {activeEmployee?.full_name ?? "…"}
      </h2>
      <label className="text-xs text-neutral-500">
        Leave type
        <select
          className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value as LeaveType)}
        >
          {LEAVE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-500">
          Start date
          <input
            type="date"
            className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="text-xs text-neutral-500">
          End date
          <input
            type="date"
            className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      <label className="col-span-full text-xs text-neutral-500">
        Reason (optional)
        <textarea
          className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <div className="col-span-full">
        <button
          type="submit"
          disabled={pending || !activeEmployee}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-brand-600 dark:text-white"
        >
          Submit request
        </button>
        {message && <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-400">{message}</span>}
      </div>
    </form>
  );
}
