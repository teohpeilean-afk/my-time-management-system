"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActiveEmployee } from "@/components/EmployeeContext";
import { markReviewed, recomputeDay, type AdjustedMinutes } from "@/app/actions/review";
import { formatDate, minutesToHm } from "@/lib/attendance/format";
import type { AttendanceDayWithEmployee } from "@/lib/attendance/review";

function ExceptionTags({ day }: { day: AttendanceDayWithEmployee }) {
  const tags: string[] = [];
  const absent =
    day.worked_minutes === 0 &&
    !day.first_clock_in &&
    !day.leave_type &&
    !day.is_rest_day &&
    !day.is_public_holiday;
  if (absent) tags.push("Absent");
  if (day.missing_punch && !absent) tags.push("Missing punch");
  if (day.late_minutes > 0) tags.push(`Late ${day.late_minutes}m`);
  if (day.early_leave_minutes > 0) tags.push(`Early leave ${day.early_leave_minutes}m`);
  if (day.is_rest_day) tags.push("Rest day");
  if (day.is_public_holiday) tags.push("Public holiday");
  if (day.leave_type) tags.push(`Leave: ${day.leave_type}`);
  if (tags.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ReviewRow({ day, canOverride }: { day: AttendanceDayWithEmployee; canOverride: boolean }) {
  const { activeEmployeeId } = useActiveEmployee();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(day.review_note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<AdjustedMinutes>({
    normal_minutes: day.normal_minutes,
    normal_ot_minutes: day.normal_ot_minutes,
    rest_day_minutes: day.rest_day_minutes,
    rest_day_ot_minutes: day.rest_day_ot_minutes,
    ph_minutes: day.ph_minutes,
    ph_ot_minutes: day.ph_ot_minutes,
  });

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await markReviewed(day.id, activeEmployeeId ?? "", note, fields);
      if (!result.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      router.refresh();
    });
  }

  function handleRecompute() {
    startTransition(async () => {
      await recomputeDay(day.employee_id, day.work_date);
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-neutral-200 align-top dark:border-neutral-800">
      <td className="px-4 py-2">
        <div className="font-medium">{day.employee.full_name}</div>
        <div className="text-xs text-neutral-500">{day.employee.staff_no}</div>
      </td>
      <td className="px-4 py-2">{formatDate(day.work_date)}</td>
      <td className="px-4 py-2">
        {minutesToHm(day.worked_minutes)}
        <ExceptionTags day={day} />
      </td>
      <td className="px-4 py-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm text-blue-600 underline dark:text-blue-400"
        >
          {open ? "Close" : canOverride ? "Review" : "Details"}
        </button>
      </td>
      {open && !canOverride && (
        <td colSpan={4} className="px-4 py-2 text-sm text-neutral-500">
          {day.review_note ? (
            <p>Reviewer note: {day.review_note}</p>
          ) : (
            <p>No reviewer note yet. Only your supervisor or HR can adjust this day.</p>
          )}
        </td>
      )}
      {open && canOverride && (
        <td colSpan={4} className="px-4 py-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ["normal_minutes", "Normal (min)"],
                ["normal_ot_minutes", "Normal OT (min)"],
                ["rest_day_minutes", "Rest day (min)"],
                ["rest_day_ot_minutes", "Rest day OT (min)"],
                ["ph_minutes", "Public holiday (min)"],
                ["ph_ot_minutes", "PH OT (min)"],
              ] as [keyof AdjustedMinutes, string][]
            ).map(([key, label]) => (
              <label key={key} className="text-xs text-neutral-500">
                {label}
                <input
                  type="number"
                  min={0}
                  className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  value={fields[key]}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, [key]: Number(e.target.value) || 0 }))
                  }
                />
              </label>
            ))}
          </div>
          <label className="mt-3 block text-xs text-neutral-500">
            Review note
            <textarea
              className="mt-0.5 block w-full rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              disabled={pending}
              onClick={handleSave}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              Save &amp; mark reviewed
            </button>
            <button
              disabled={pending}
              onClick={handleRecompute}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              Recompute from punches
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export function ReviewTable({
  days,
  canOverride,
}: {
  days: AttendanceDayWithEmployee[];
  canOverride: boolean;
}) {
  if (days.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
        No exceptions pending review. 🎉
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-2 font-medium">Employee</th>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Worked</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <ReviewRow key={day.id} day={day} canOverride={canOverride} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
