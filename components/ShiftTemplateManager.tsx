"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addShiftTemplate, deleteShiftTemplate } from "@/app/actions/roster";
import type { ShiftTemplate } from "@/lib/types";

export function ShiftTemplateManager({
  templates,
  canWrite,
}: {
  templates: ShiftTemplate[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addShiftTemplate({ name, startTime, endTime, breakMinutes });
      if (!result.ok) {
        setError(result.error ?? "Could not add shift.");
        return;
      }
      setName("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteShiftTemplate(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Shift templates</h2>
      {canWrite && (
        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <label className="text-xs text-neutral-500">
            Name
            <input
              type="text"
              required
              placeholder="e.g. Night shift"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Start
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            End
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-0.5 block rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Break (min)
            <input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
              className="mt-0.5 block w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            Add shift
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {templates.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
          No shift templates yet — rostered days fall back to each employee's default shift.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs dark:border-neutral-800"
            >
              {t.name} · {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
              {canWrite && (
                <button
                  disabled={pending}
                  onClick={() => handleDelete(t.id)}
                  className="text-red-600 disabled:opacity-50 dark:text-red-400"
                  aria-label={`Delete ${t.name}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
