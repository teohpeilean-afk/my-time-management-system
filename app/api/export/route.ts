import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { formatTime, todayInKL } from "@/lib/attendance/format";
import { calculateDayPay, type PayRates } from "@/lib/pay/calculatePay";
import type { AttendanceDayWithEmployee } from "@/lib/attendance/review";
import type { Employee, LeaveRequest, PublicHoliday } from "@/lib/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function ratesFor(emp: Employee | undefined): PayRates {
  if (!emp) return { monthlySalary: 0, normalHoursPerDay: 8, otEligible: false };
  const [sh, sm] = emp.shift_start.split(":").map(Number);
  const [eh, em] = emp.shift_end.split(":").map(Number);
  const shiftMinutes = Math.max(0, eh * 60 + em - (sh * 60 + sm) - emp.scheduled_break_minutes);
  return {
    monthlySalary: emp.monthly_salary ?? 0,
    normalHoursPerDay: shiftMinutes > 0 ? shiftMinutes / 60 : 8,
    otEligible: emp.ot_eligible ?? false,
  };
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
  "OT Pay (RM)": number;
  "Rest Day Pay (RM)": number;
  "PH Pay (RM)": number;
  "Extra Pay (RM)": number;
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
    supabase.from("employees").select("*"),
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
  const employeeById = new Map(((employees as Employee[]) ?? []).map((e) => [e.id, e]));

  const rows: ExportRow[] = days.map((d) => {
    const pay = calculateDayPay(ratesFor(employeeById.get(d.employee_id)), {
      workDate: d.work_date,
      normalMinutes: d.normal_minutes,
      normalOtMinutes: d.normal_ot_minutes,
      restDayMinutes: d.rest_day_minutes,
      restDayOtMinutes: d.rest_day_ot_minutes,
      phMinutes: d.ph_minutes,
      phOtMinutes: d.ph_ot_minutes,
    });
    return {
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
      "OT Pay (RM)": pay.normalOtPay,
      "Rest Day Pay (RM)": round2(pay.restDayPay + pay.restDayOtPay),
      "PH Pay (RM)": round2(pay.phPay + pay.phOtPay),
      "Extra Pay (RM)": pay.extraPay,
      Reviewed: d.review_status === "reviewed" ? "Yes" : "No",
    };
  });

  // A worker who never punched on a working day has no attendance_days row at
  // all (rows are only materialized by punch/leave/roster triggers), so with
  // no reminder workflow those days would silently vanish from payroll.
  // Synthesize them here as Absent — skipping rest days, public holidays,
  // approved leave, and today/future dates (the day isn't over yet).
  const holidaySet = new Set(((holidays as Pick<PublicHoliday, "holiday_date">[]) ?? []).map((h) => h.holiday_date));
  const leaveList = (leaves as Pick<LeaveRequest, "employee_id" | "start_date" | "end_date">[]) ?? [];
  const existing = new Set(days.map((d) => `${d.employee_id}|${d.work_date}`));
  const today = todayInKL();

  for (const emp of ((employees as Employee[]) ?? []).filter((e) => e.active)) {
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
        "OT Pay (RM)": 0,
        "Rest Day Pay (RM)": 0,
        "PH Pay (RM)": 0,
        "Extra Pay (RM)": 0,
        Reviewed: "No",
      });
    }
  }

  rows.sort((a, b) => a.Date.localeCompare(b.Date) || a.Name.localeCompare(b.Name));

  // ── Sheet 1: Summary — one row per employee, totals across the range ──
  interface SummaryRow {
    "Staff No": string;
    Name: string;
    "Days Worked": number;
    "Normal Hours": number;
    "Normal OT Hours": number;
    "Rest Day Hours": number;
    "Rest Day OT Hours": number;
    "Public Holiday Hours": number;
    "Public Holiday OT Hours": number;
    "Late (min)": number;
    "Absent Days": number;
    "Leave Days": number;
    "OT Pay (RM)": number;
    "Rest Day Pay (RM)": number;
    "PH Pay (RM)": number;
    "Extra Pay (RM)": number;
  }
  const summaryByStaff = new Map<string, SummaryRow>();
  for (const r of rows) {
    let s = summaryByStaff.get(r["Staff No"]);
    if (!s) {
      s = {
        "Staff No": r["Staff No"],
        Name: r.Name,
        "Days Worked": 0,
        "Normal Hours": 0,
        "Normal OT Hours": 0,
        "Rest Day Hours": 0,
        "Rest Day OT Hours": 0,
        "Public Holiday Hours": 0,
        "Public Holiday OT Hours": 0,
        "Late (min)": 0,
        "Absent Days": 0,
        "Leave Days": 0,
        "OT Pay (RM)": 0,
        "Rest Day Pay (RM)": 0,
        "PH Pay (RM)": 0,
        "Extra Pay (RM)": 0,
      };
      summaryByStaff.set(r["Staff No"], s);
    }
    const workedHours =
      r["Normal Hours"] + r["Normal OT Hours"] + r["Rest Day Hours"] + r["Rest Day OT Hours"] +
      r["Public Holiday Hours"] + r["Public Holiday OT Hours"];
    if (workedHours > 0) s["Days Worked"] += 1;
    s["Normal Hours"] = round2(s["Normal Hours"] + r["Normal Hours"]);
    s["Normal OT Hours"] = round2(s["Normal OT Hours"] + r["Normal OT Hours"]);
    s["Rest Day Hours"] = round2(s["Rest Day Hours"] + r["Rest Day Hours"]);
    s["Rest Day OT Hours"] = round2(s["Rest Day OT Hours"] + r["Rest Day OT Hours"]);
    s["Public Holiday Hours"] = round2(s["Public Holiday Hours"] + r["Public Holiday Hours"]);
    s["Public Holiday OT Hours"] = round2(s["Public Holiday OT Hours"] + r["Public Holiday OT Hours"]);
    s["Late (min)"] += r["Late (min)"];
    if (r.Absent === "Yes") s["Absent Days"] += 1;
    if (r["Leave Type"]) s["Leave Days"] += 1;
    s["OT Pay (RM)"] = round2(s["OT Pay (RM)"] + r["OT Pay (RM)"]);
    s["Rest Day Pay (RM)"] = round2(s["Rest Day Pay (RM)"] + r["Rest Day Pay (RM)"]);
    s["PH Pay (RM)"] = round2(s["PH Pay (RM)"] + r["PH Pay (RM)"]);
    s["Extra Pay (RM)"] = round2(s["Extra Pay (RM)"] + r["Extra Pay (RM)"]);
  }
  const summaryRows = [...summaryByStaff.values()].sort((a, b) =>
    a["Staff No"].localeCompare(b["Staff No"]),
  );

  // ── Sheet 3: Exceptions — anything payroll should eyeball first ──
  const exceptionRows = rows
    .map((r) => {
      const issues: string[] = [];
      if (r.Absent === "Yes") issues.push("Absent");
      if (r["Missing Punch"] === "Yes") issues.push("Missing punch");
      if (r["Late (min)"] > 0) issues.push(`Late ${r["Late (min)"]}m`);
      if (r["Early Leave (min)"] > 0) issues.push(`Early leave ${r["Early Leave (min)"]}m`);
      if (r["Rest Day Hours"] + r["Rest Day OT Hours"] > 0) issues.push("Rest-day work");
      if (r["Public Holiday Hours"] + r["Public Holiday OT Hours"] > 0) issues.push("PH work");
      if (issues.length === 0) return null;
      return {
        "Staff No": r["Staff No"],
        Name: r.Name,
        Date: r.Date,
        "Clock In": r["Clock In"],
        "Clock Out": r["Clock Out"],
        Issues: issues.join(", "),
        Reviewed: r.Reviewed,
      };
    })
    .filter((r) => r !== null);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "Summary");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Detail");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(exceptionRows), "Exceptions");
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
