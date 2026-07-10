import { getPendingReviewDays } from "@/lib/attendance/review";
import { ReviewTable } from "@/components/ReviewTable";

export default async function ReviewPage() {
  const days = await getPendingReviewDays();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Exception review</h1>
        <p className="text-sm text-neutral-500">
          Late arrivals, early departures, missing punches, rest-day and public-holiday work —
          reviewed and adjusted here before payroll export.
        </p>
      </div>
      <ReviewTable days={days} />
    </div>
  );
}
