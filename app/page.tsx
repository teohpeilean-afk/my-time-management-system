import { getTeamTodayStatus } from "@/lib/attendance/status";
import { PunchClockCard } from "@/components/PunchClockCard";
import { TeamStatusTable } from "@/components/TeamStatusTable";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function DashboardPage() {
  const { ok, statuses } = await getTeamTodayStatus();

  if (!ok) {
    return (
      <div className="space-y-6">
        <AutoRefresh />
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Unable to load attendance — try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <PunchClockCard statuses={statuses} />
      <div>
        <h2 className="mb-2 font-semibold">Today — everyone</h2>
        <TeamStatusTable statuses={statuses} />
      </div>
    </div>
  );
}
