// Malaysia Employment Act 1955 (2022 amendment) pay engine.
//
// Turns the statutory minute buckets that fn_recompute_attendance_day already
// computes into ringgit, per the standard monthly-rated formulas:
//
//   ORP (daily)  = monthly_salary / 26
//   Hourly rate  = ORP / normal_hours_per_day (usually 8)
//
//   Day type        | Within normal hours                      | Overtime
//   ----------------|------------------------------------------|----------
//   Normal day      | covered by monthly salary (RM 0 extra)   | 1.5 x hourly
//   Rest day        | <= half normal hrs -> 0.5 day wage;      | 2.0 x hourly
//                   |  > half            -> 1.0 day wage       |
//   Public holiday  | 2 days' wages (even if under full hours) | 3.0 x hourly
//
// `otEligible` gates only the hourly-multiplier components (statutory OT is
// mandatory only up to RM4,000/month; above that it's contractual). Rest-day
// and PH day-wages are still paid for work done — adjust here if company
// policy differs.
//
// Pure and side-effect free by design: payroll can be re-run for any period,
// and every rule lives in this one tested file.

export interface PayRates {
  monthlySalary: number;
  normalHoursPerDay: number;
  otEligible: boolean;
}

export interface DayHours {
  workDate: string;
  normalMinutes: number;
  normalOtMinutes: number;
  restDayMinutes: number;
  restDayOtMinutes: number;
  phMinutes: number;
  phOtMinutes: number;
}

export interface DayPay {
  workDate: string;
  normalOtPay: number;
  restDayPay: number;
  restDayOtPay: number;
  phPay: number;
  phOtPay: number;
  extraPay: number;
}

export interface PayBreakdown {
  days: DayPay[];
  totalExtraPay: number;
}

function roundRM(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateDayPay(rates: PayRates, day: DayHours): DayPay {
  const orp = rates.monthlySalary / 26;
  const hourly = rates.normalHoursPerDay > 0 ? orp / rates.normalHoursPerDay : 0;
  const halfDayMinutes = (rates.normalHoursPerDay * 60) / 2;

  const normalOtPay = rates.otEligible ? (day.normalOtMinutes / 60) * hourly * 1.5 : 0;

  let restDayPay = 0;
  if (day.restDayMinutes > 0) {
    restDayPay = day.restDayMinutes <= halfDayMinutes ? 0.5 * orp : 1.0 * orp;
  }
  const restDayOtPay = rates.otEligible ? (day.restDayOtMinutes / 60) * hourly * 2.0 : 0;

  const phPay = day.phMinutes > 0 ? 2 * orp : 0;
  const phOtPay = rates.otEligible ? (day.phOtMinutes / 60) * hourly * 3.0 : 0;

  const parts = {
    normalOtPay: roundRM(normalOtPay),
    restDayPay: roundRM(restDayPay),
    restDayOtPay: roundRM(restDayOtPay),
    phPay: roundRM(phPay),
    phOtPay: roundRM(phOtPay),
  };

  return {
    workDate: day.workDate,
    ...parts,
    extraPay: roundRM(
      parts.normalOtPay + parts.restDayPay + parts.restDayOtPay + parts.phPay + parts.phOtPay,
    ),
  };
}

export function calculatePay(rates: PayRates, days: DayHours[]): PayBreakdown {
  const dayPays = days.map((day) => calculateDayPay(rates, day));
  return {
    days: dayPays,
    totalExtraPay: roundRM(dayPays.reduce((sum, d) => sum + d.extraPay, 0)),
  };
}
