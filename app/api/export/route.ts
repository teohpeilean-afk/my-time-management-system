import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/attendance/format";
import type { AttendanceDayWithEmployee } from "@/lib/attendance/review";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_days")
    .select("*, employee:employees(id, full_name, staff_no)")
    .gte("work_date", start)
    .lte("work_date", end)
    .order("work_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const days = (data ?? []) as unknown as AttendanceDayWithEmployee[];

  const rows = days.map((d) => ({
    "Staff No": d.employee.staff_no,
    Name: d.employee.full_name,
    Date: d.work_date,
    "Clock In": formatTime(d.first_clock_in),
    "Clock Out": formatTime(d.last_clock_out),
    "Normal Hours": round2(d.normal_minutes / 60),
    "Normal OT Hours": round2(d.normal_ot_minutes / 60),
    "Rest Day Hours": round2(d.rest_day_minutes / 60),
    "Rest Day OT Hours": round2(d.rest_day_ot_minutes / 60),
    "Public Holiday Hours": round2(d.ph_minutes / 60),
    "Public Holiday OT Hours": round2(d.ph_ot_minutes / 60),
    "Late (min)": d.late_minutes,
    "Early Leave (min)": d.early_leave_minutes,
    "Missing Punch": d.missing_punch ? "Yes" : "",
    "Leave Type": d.leave_type ?? "",
    Reviewed: d.review_status === "reviewed" ? "Yes" : "No",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Summary");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const bytes = new Uint8Array(buffer);

  return new NextResponse(new Blob([bytes]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${start}-to-${end}.xlsx"`,
    },
  });
}
