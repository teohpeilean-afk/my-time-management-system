"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActiveEmployee } from "@/components/EmployeeContext";
import { recordPunch } from "@/app/actions/punches";
import { formatTime } from "@/lib/attendance/format";
import type { EmployeeTodayStatus } from "@/lib/attendance/status";
import type { PunchType } from "@/lib/types";

const LABELS: Record<PunchType, string> = {
  clock_in: "Clock In",
  clock_out: "Clock Out",
  break_start: "Start Break",
  break_end: "End Break",
};

const STATUS_LABELS: Record<PunchType, string> = {
  clock_in: "Clocked in",
  break_start: "On break",
  break_end: "Clocked in (back from break)",
  clock_out: "Clocked out",
};

function getLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export function PunchClockCard({ statuses }: { statuses: EmployeeTodayStatus[] }) {
  const { activeEmployee } = useActiveEmployee();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const own = statuses.find((s) => s.employee.id === activeEmployee?.id) ?? null;

  if (!activeEmployee || !own) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
        Loading your punch card…
      </div>
    );
  }

  function handlePunch(punchType: PunchType) {
    setMessage(null);
    startTransition(async () => {
      const coords = await getLocation();
      const result = await recordPunch(activeEmployee!.id, punchType, coords);
      if (!result.ok) {
        setMessage(`Failed: ${result.error}`);
        return;
      }
      if (!coords) {
        setMessage(`${LABELS[punchType]} recorded — location unavailable, flagged for review.`);
      } else if (!result.withinGeofence) {
        setMessage(`${LABELS[punchType]} recorded — outside approved location, flagged for review.`);
      } else {
        setMessage(`${LABELS[punchType]} recorded at ${result.locationName}.`);
      }
      router.refresh();
    });
  }

  const statusLabel = own.lastPunch ? STATUS_LABELS[own.lastPunch.punch_type] : "Not clocked in yet";

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">{activeEmployee.full_name}</h2>
        <span className="text-sm text-neutral-500">{statusLabel}</span>
      </div>
      {own.firstClockIn && (
        <p className="mt-1 text-xs text-neutral-500">
          Clocked in since {formatTime(own.firstClockIn.punch_time)}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {own.nextActions.length === 0 && (
          <span className="text-sm text-neutral-500">Day complete — clocked out.</span>
        )}
        {own.nextActions.map((action) => (
          <button
            key={action}
            disabled={pending}
            onClick={() => handlePunch(action)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {LABELS[action]}
          </button>
        ))}
      </div>
      {message && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{message}</p>}
    </div>
  );
}
