"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActiveEmployee } from "@/components/EmployeeContext";
import { reviewLeaveRequest } from "@/app/actions/leave";
import { formatDate } from "@/lib/attendance/format";
import type { LeaveRequestWithEmployee } from "@/lib/attendance/leave";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function LeaveRequestList({ requests }: { requests: LeaveRequestWithEmployee[] }) {
  const { activeEmployee } = useActiveEmployee();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canReview = activeEmployee?.role === "supervisor" || activeEmployee?.role === "hr";

  function handleReview(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      await reviewLeaveRequest(id, activeEmployee?.id ?? "", status, "");
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
        No leave requests yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-2 font-medium">Employee</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Dates</th>
            <th className="px-4 py-2 font-medium">Reason</th>
            <th className="px-4 py-2 font-medium">Status</th>
            {canReview && <th className="px-4 py-2 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="px-4 py-2">
                <div className="font-medium">{r.employee.full_name}</div>
                <div className="text-xs text-neutral-500">{r.employee.staff_no}</div>
              </td>
              <td className="px-4 py-2 capitalize">{r.leave_type}</td>
              <td className="px-4 py-2">
                {formatDate(r.start_date)}
                {r.end_date !== r.start_date ? ` – ${formatDate(r.end_date)}` : ""}
              </td>
              <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{r.reason ?? "—"}</td>
              <td className="px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                  {r.status}
                </span>
              </td>
              {canReview && (
                <td className="px-4 py-2">
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        disabled={pending}
                        onClick={() => handleReview(r.id, "approved")}
                        className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={pending}
                        onClick={() => handleReview(r.id, "rejected")}
                        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
