import { getTeamTodayStatus } from "@/lib/attendance/status";
import { PunchClockCard } from "@/components/PunchClockCard";
import { TeamStatusTable } from "@/components/TeamStatusTable";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function DashboardPage() {
  const statuses = await getTeamTodayStatus();

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
