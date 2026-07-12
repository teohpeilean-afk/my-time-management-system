import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { formatTime, todayInKL } from "@/lib/attendance/format";
import type { AttendanceDayWithEmployee } from "@/lib/attendance/review";
import type { Employee, LeaveRequest, PublicHoliday } from "@/lib/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

interface ExportRow {
  "Staff No": string;
  Name: string;
  Date: string;
  "Clock In": string;
  "Clock Out": string;
  "Normal Hours": number;
  "Normal OT Hours": number;
  "Rest Day Hours": number;
  "Rest Day OT Hours": number;
  "Public Holiday Hours": number;
  "Public Holiday OT Hours": number;
  "Late (min)": number;
  "Early Leave (min)": number;
  "Missing Punch": string;
  Absent: string;
  "Leave Type": string;
  Reviewed: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const [
    { data, error },
    { data: employees },
    { data: holidays },
    { data: leaves },
  ] = await Promise.all([
    supabase
      .from("attendance_days")
      .select("*, employee:employees!attendance_days_employee_id_fkey(id, full_name, staff_no)")
      .gte("work_date", start)
      .lte("work_date", end)
      .order("work_date", { ascending: true }),
    supabase.from("employees").select("*").eq("active", true),
    supabase.from("public_holidays").select("holiday_date").gte("holiday_date", start).lte("holiday_date", end),
    supabase
      .from("leave_requests")
      .select("employee_id, start_date, end_date, leave_type")
      .eq("status", "approved")
      .lte("start_date", end)
      .gte("end_date", start),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const days = (data ?? []) as unknown as AttendanceDayWithEmployee[];

  const rows: ExportRow[] = days.map((d) => ({
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
    Absent:
      d.worked_minutes === 0 &&
      !d.first_clock_in &&
      !d.leave_type &&
      !d.is_rest_day &&
      !d.is_public_holiday &&
      d.work_date < todayInKL()
        ? "Yes"
        : "",
    "Leave Type": d.leave_type ?? "",
    Reviewed: d.review_status === "reviewed" ? "Yes" : "No",
  }));

  // A worker who never punched on a working day has no attendance_days row at
  // all (rows are only materialized by punch/leave/roster triggers), so with
  // no reminder workflow those days would silently vanish from payroll.
  // Synthesize them here as Absent — skipping rest days, public holidays,
  // approved leave, and today/future dates (the day isn't over yet).
  const holidaySet = new Set(((holidays as Pick<PublicHoliday, "holiday_date">[]) ?? []).map((h) => h.holiday_date));
  const leaveList = (leaves as Pick<LeaveRequest, "employee_id" | "start_date" | "end_date">[]) ?? [];
  const existing = new Set(days.map((d) => `${d.employee_id}|${d.work_date}`));
  const today = todayInKL();

  for (const emp of ((employees as Employee[]) ?? [])) {
    for (const date of datesBetween(start, end)) {
      if (date >= today) continue;
      if (existing.has(`${emp.id}|${date}`)) continue;
      if (new Date(`${date}T00:00:00`).getDay() === emp.rest_day_of_week) continue;
      if (holidaySet.has(date)) continue;
      if (leaveList.some((l) => l.employee_id === emp.id && l.start_date <= date && l.end_date >= date)) continue;
      rows.push({
        "Staff No": emp.staff_no,
        Name: emp.full_name,
        Date: date,
        "Clock In": "—",
        "Clock Out": "—",
        "Normal Hours": 0,
        "Normal OT Hours": 0,
        "Rest Day Hours": 0,
        "Rest Day OT Hours": 0,
        "Public Holiday Hours": 0,
        "Public Holiday OT Hours": 0,
        "Late (min)": 0,
        "Early Leave (min)": 0,
        "Missing Punch": "",
        Absent: "Yes",
        "Leave Type": "",
        Reviewed: "No",
      });
    }
  }

  rows.sort((a, b) => a.Date.localeCompare(b.Date) || a.Name.localeCompare(b.Name));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Summary");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const bytes = new Uint8Array(buffer);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    actor: user?.email ?? "anonymous (demo)",
    action: "export_attendance_summary",
    target_table: "attendance_days",
    new_value: { start, end, row_count: rows.length },
  });

  return new NextResponse(new Blob([bytes]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${start}-to-${end}.xlsx"`,
    },
  });
}
