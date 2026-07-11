import { getCurrentSession } from "@/lib/session";
import { AccessDenied } from "@/components/AccessDenied";
import { getRosterWeek, weekBoundsFor, shiftWeek } from "@/lib/attendance/roster";
import { todayInKL } from "@/lib/attendance/format";
import { ShiftTemplateManager } from "@/components/ShiftTemplateManager";
import { RosterGrid } from "@/components/RosterGrid";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { employee } = await getCurrentSession();
  if (employee?.role !== "hr" && employee?.role !== "supervisor") {
    return <AccessDenied />;
  }

  const params = await searchParams;
  const anchor = params.week ?? todayInKL();
  const { start, days } = weekBoundsFor(anchor);
  const end = days[6];

  const { ok, employees, assignments, templates } = await getRosterWeek(start, end);

  const prevWeek = shiftWeek(start, -1);
  const nextWeek = shiftWeek(start, 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Roster</h1>
        <p className="text-sm text-neutral-500">
          Assign shift templates per employee per day. Falls back to each employee&apos;s
          default shift when nothing is rostered.
        </p>
      </div>
      <ShiftTemplateManager templates={templates} canWrite={employee.role === "hr"} />
      {ok ? (
        <RosterGrid
          employees={employees}
          assignments={assignments}
          templates={templates}
          days={days}
          prevWeekHref={`/roster?week=${prevWeek}`}
          nextWeekHref={`/roster?week=${nextWeek}`}
        />
      ) : (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Unable to load roster — try again.
        </p>
      )}
    </div>
  );
}
