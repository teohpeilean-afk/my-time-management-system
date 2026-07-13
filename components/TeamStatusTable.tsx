import { formatTime } from "@/lib/attendance/format";
import type { EmployeeTodayStatus } from "@/lib/attendance/status";

const STATUS_LABELS: Record<string, string> = {
  clock_in: "Clocked in",
  break_start: "On break",
  break_end: "Clocked in",
  clock_out: "Clocked out",
};

const STATUS_COLORS: Record<string, string> = {
  clock_in: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  break_start: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  break_end: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  clock_out: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

export function TeamStatusTable({ statuses }: { statuses: EmployeeTodayStatus[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 text-left text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-2 font-medium">Employee</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Since</th>
            <th className="px-4 py-2 font-medium">Last punch</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map(({ employee, lastPunch, firstClockIn }) => {
            const type = lastPunch?.punch_type ?? null;
            return (
              <tr key={employee.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-4 py-2">
                  <div className="font-medium">{employee.full_name}</div>
                  <div className="text-xs text-neutral-500">{employee.staff_no}</div>
                </td>
                <td className="px-4 py-2 capitalize text-neutral-600 dark:text-neutral-400">
                  {employee.role}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      type ? STATUS_COLORS[type] : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                    }`}
                  >
                    {type ? STATUS_LABELS[type] : "Not clocked in"}
                  </span>
                  {lastPunch && !lastPunch.within_geofence && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">⚠ off-site</span>
                  )}
                  {lastPunch && lastPunch.qr_ok === false && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">⚠ bad QR</span>
                  )}
                  {lastPunch && lastPunch.qr_ok === null && (
                    <span className="ml-2 text-xs text-neutral-400">no QR</span>
                  )}
                </td>
                <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                  {formatTime(firstClockIn?.punch_time ?? null)}
                </td>
                <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                  {formatTime(lastPunch?.punch_time ?? null)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
