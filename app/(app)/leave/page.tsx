import { getLeaveRequests } from "@/lib/attendance/leave";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { LeaveRequestList } from "@/components/LeaveRequestList";

export default async function LeavePage() {
  const requests = await getLeaveRequests();

  return (
    <div className="space-y-6">
      <LeaveRequestForm />
      <div>
        <h2 className="mb-2 font-semibold">All leave requests</h2>
        <LeaveRequestList requests={requests} />
      </div>
    </div>
  );
}
