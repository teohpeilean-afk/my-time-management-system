import { describe, expect, it } from "vitest";
import { calculateDayPay, calculatePay, type DayHours, type PayRates } from "./calculatePay";

// RM2,600/month, 8h days -> ORP = RM100/day, hourly = RM12.50. Clean numbers
// so every expected value below can be checked by hand.
const rates: PayRates = { monthlySalary: 2600, normalHoursPerDay: 8, otEligible: true };

function day(overrides: Partial<DayHours>): DayHours {
  return {
    workDate: "2026-07-01",
    normalMinutes: 0,
    normalOtMinutes: 0,
    restDayMinutes: 0,
    restDayOtMinutes: 0,
    phMinutes: 0,
    phOtMinutes: 0,
    ...overrides,
  };
}

describe("normal day", () => {
  it("pays nothing extra within normal hours (covered by monthly salary)", () => {
    const pay = calculateDayPay(rates, day({ normalMinutes: 480 }));
    expect(pay.extraPay).toBe(0);
  });

  it("pays overtime at 1.5x hourly", () => {
    // 2h OT x RM12.50 x 1.5 = RM37.50
    const pay = calculateDayPay(rates, day({ normalMinutes: 480, normalOtMinutes: 120 }));
    expect(pay.normalOtPay).toBe(37.5);
    expect(pay.extraPay).toBe(37.5);
  });
});

describe("rest day", () => {
  it("pays half a day's wages when working up to half normal hours", () => {
    // 4h (exactly half) -> 0.5 x ORP = RM50
    const pay = calculateDayPay(rates, day({ restDayMinutes: 240 }));
    expect(pay.restDayPay).toBe(50);
    expect(pay.extraPay).toBe(50);
  });

  it("pays a full day's wages when working more than half normal hours", () => {
    // 4h01m -> 1.0 x ORP = RM100
    const pay = calculateDayPay(rates, day({ restDayMinutes: 241 }));
    expect(pay.restDayPay).toBe(100);
  });

  it("pays overtime beyond normal hours at 2.0x hourly on top of the day wage", () => {
    // 8h + 3h OT -> RM100 + 3 x RM12.50 x 2.0 = RM100 + RM75
    const pay = calculateDayPay(rates, day({ restDayMinutes: 480, restDayOtMinutes: 180 }));
    expect(pay.restDayPay).toBe(100);
    expect(pay.restDayOtPay).toBe(75);
    expect(pay.extraPay).toBe(175);
  });

  it("pays nothing when not worked", () => {
    const pay = calculateDayPay(rates, day({}));
    expect(pay.restDayPay).toBe(0);
  });
});

describe("public holiday", () => {
  it("pays two days' wages even for under a full day's work", () => {
    // 1h on a PH -> 2 x ORP = RM200
    const pay = calculateDayPay(rates, day({ phMinutes: 60 }));
    expect(pay.phPay).toBe(200);
    expect(pay.extraPay).toBe(200);
  });

  it("pays overtime beyond normal hours at 3.0x hourly on top of the two-day wage", () => {
    // 8h + 2h OT -> RM200 + 2 x RM12.50 x 3.0 = RM200 + RM75
    const pay = calculateDayPay(rates, day({ phMinutes: 480, phOtMinutes: 120 }));
    expect(pay.phPay).toBe(200);
    expect(pay.phOtPay).toBe(75);
    expect(pay.extraPay).toBe(275);
  });
});

describe("OT eligibility gate (RM4,000 rule / contract flag)", () => {
  const ineligible: PayRates = { ...rates, otEligible: false };

  it("zeroes all hourly-multiplier components when not OT-eligible", () => {
    const pay = calculateDayPay(
      ineligible,
      day({ normalOtMinutes: 120, restDayOtMinutes: 60, phOtMinutes: 60 }),
    );
    expect(pay.normalOtPay).toBe(0);
    expect(pay.restDayOtPay).toBe(0);
    expect(pay.phOtPay).toBe(0);
  });

  it("still pays rest-day and PH day-wages for work done", () => {
    const pay = calculateDayPay(ineligible, day({ restDayMinutes: 480 }));
    expect(pay.restDayPay).toBe(100);
    const ph = calculateDayPay(ineligible, day({ phMinutes: 240 }));
    expect(ph.phPay).toBe(200);
  });
});

describe("edge cases", () => {
  it("returns all zeros when no salary is configured", () => {
    const noSalary: PayRates = { monthlySalary: 0, normalHoursPerDay: 8, otEligible: true };
    const pay = calculateDayPay(noSalary, day({ normalOtMinutes: 120, restDayMinutes: 480, phMinutes: 480 }));
    expect(pay.extraPay).toBe(0);
  });

  it("does not divide by zero when normal hours is zero", () => {
    const zeroHours: PayRates = { monthlySalary: 2600, normalHoursPerDay: 0, otEligible: true };
    const pay = calculateDayPay(zeroHours, day({ normalOtMinutes: 120 }));
    expect(Number.isFinite(pay.extraPay)).toBe(true);
    expect(pay.normalOtPay).toBe(0);
  });

  it("rounds to sen (2 dp)", () => {
    // RM2,500/26 = 96.153846... -> hourly 12.019230...; 1h OT x 1.5 = 18.028846...
    const odd: PayRates = { monthlySalary: 2500, normalHoursPerDay: 8, otEligible: true };
    const pay = calculateDayPay(odd, day({ normalOtMinutes: 60 }));
    expect(pay.normalOtPay).toBe(18.03);
  });

  it("totals a multi-day period", () => {
    const breakdown = calculatePay(rates, [
      day({ workDate: "2026-07-01", normalOtMinutes: 120 }), // 37.50
      day({ workDate: "2026-07-05", restDayMinutes: 480, restDayOtMinutes: 180 }), // 175
      day({ workDate: "2026-07-16", phMinutes: 480, phOtMinutes: 120 }), // 275
    ]);
    expect(breakdown.days).toHaveLength(3);
    expect(breakdown.totalExtraPay).toBe(487.5);
  });
});
