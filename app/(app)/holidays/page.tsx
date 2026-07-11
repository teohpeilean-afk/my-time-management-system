import { createClient } from "@/lib/supabase/server";
import { getCurrentSession } from "@/lib/session";
import { HolidayManager } from "@/components/HolidayManager";
import type { PublicHoliday } from "@/lib/types";

export default async function HolidaysPage() {
  const { employee } = await getCurrentSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_holidays")
    .select("*")
    .order("holiday_date", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Public holidays</h1>
        <p className="text-sm text-neutral-500">
          Drives day-type classification for the punch engine and payroll export. Add the
          gazetted national + state holiday list for the current year.
        </p>
      </div>
      <HolidayManager
        holidays={(data as PublicHoliday[]) ?? []}
        canWrite={employee?.role === "hr"}
      />
    </div>
  );
}
