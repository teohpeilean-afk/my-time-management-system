import { getPendingReviewDays } from "@/lib/attendance/review";
import { getCurrentSession } from "@/lib/session";
import { ReviewTable } from "@/components/ReviewTable";

export default async function ReviewPage() {
  const [{ ok, days }, { employee }] = await Promise.all([getPendingReviewDays(), getCurrentSession()]);
  const canOverride = employee?.role === "hr" || employee?.role === "supervisor";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Exception review</h1>
        <p className="text-sm text-neutral-500">
          Late arrivals, early departures, missing punches, rest-day and public-holiday work —
          reviewed and adjusted here before payroll export.
        </p>
      </div>
      {ok ? (
        <ReviewTable days={days} canOverride={canOverride} />
      ) : (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Unable to load attendance — try again.
        </p>
      )}
    </div>
  );
}
