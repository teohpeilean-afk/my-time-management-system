export type EmployeeRole = "worker" | "supervisor" | "hr";
export type PunchType = "clock_in" | "clock_out" | "break_start" | "break_end";
export type LeaveType =
  | "annual"
  | "medical"
  | "hospitalization"
  | "unpaid"
  | "absent"
  | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type ReviewStatus = "pending" | "reviewed";

export interface Employee {
  id: string;
  full_name: string;
  staff_no: string;
  role: EmployeeRole;
  supervisor_id: string | null;
  rest_day_of_week: number;
  shift_start: string;
  shift_end: string;
  scheduled_break_minutes: number;
  monthly_salary: number;
  ot_eligible: boolean;
  active: boolean;
  created_at: string;
}

export interface ApprovedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  active: boolean;
}

export interface PublicHoliday {
  id: string;
  holiday_date: string;
  name: string;
}

export interface AttendancePunch {
  id: string;
  employee_id: string;
  punch_type: PunchType;
  punch_time: string;
  location_id: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  within_geofence: boolean;
  note: string | null;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  active: boolean;
}

export interface RosterAssignment {
  id: string;
  employee_id: string;
  work_date: string;
  shift_template_id: string | null;
  custom_start: string | null;
  custom_end: string | null;
  custom_break_minutes: number | null;
  note: string | null;
}

export interface AttendanceDay {
  id: string;
  employee_id: string;
  work_date: string;
  first_clock_in: string | null;
  last_clock_out: string | null;
  break_minutes_taken: number;
  worked_minutes: number;
  normal_minutes: number;
  normal_ot_minutes: number;
  rest_day_minutes: number;
  rest_day_ot_minutes: number;
  ph_minutes: number;
  ph_ot_minutes: number;
  late_minutes: number;
  early_leave_minutes: number;
  missing_punch: boolean;
  is_rest_day: boolean;
  is_public_holiday: boolean;
  leave_type: LeaveType | null;
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  computed_at: string;
}
