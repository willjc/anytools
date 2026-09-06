import { describe, expect, it } from "vitest";

import { calculateSeverance, serviceMonths } from "@/lib/severance";

describe("serviceMonths", () => {
  it("counts one month per full year", () => {
    expect(serviceMonths("2020-01-01", "2024-01-01")).toEqual({ years: expect.closeTo(4, 1), months: 4 });
  });

  it("treats 6+ months as a full year and less as half", () => {
    expect(serviceMonths("2020-01-01", "2020-08-01").months).toBe(1);
    expect(serviceMonths("2020-01-01", "2020-04-01").months).toBe(0.5);
  });

  it("handles three and a half years as four months", () => {
    expect(serviceMonths("2020-01-01", "2023-07-15").months).toBe(4);
  });

  it("rejects invalid ranges", () => {
    expect(() => serviceMonths("2024-01-01", "2020-01-01")).toThrow();
  });
});

describe("calculateSeverance", () => {
  it("computes N for negotiated termination", () => {
    const result = calculateSeverance({
      startDate: "2020-01-01",
      endDate: "2023-07-15",
      monthlyWage: 10000,
      scenario: "n",
    });
    expect(result.months).toBe(4);
    expect(result.compensationN).toBe(40000);
    expect(result.total).toBe(40000);
  });

  it("adds one month of wage for N+1", () => {
    const result = calculateSeverance({
      startDate: "2020-01-01",
      endDate: "2023-07-15",
      monthlyWage: 10000,
      scenario: "nPlus1",
    });
    expect(result.total).toBe(50000);
  });

  it("doubles compensation for unlawful termination", () => {
    const result = calculateSeverance({
      startDate: "2020-01-01",
      endDate: "2023-07-15",
      monthlyWage: 10000,
      scenario: "twoN",
    });
    expect(result.total).toBe(80000);
  });

  it("caps base wage at three times social average and limits years to 12", () => {
    const result = calculateSeverance({
      startDate: "2005-01-01",
      endDate: "2024-01-01",
      monthlyWage: 100000,
      socialAverageWage: 10000,
      scenario: "n",
    });
    expect(result.capped).toBe(true);
    expect(result.baseWage).toBe(30000);
    expect(result.months).toBe(12);
    expect(result.total).toBe(360000);
  });

  it("rejects invalid wages", () => {
    expect(() =>
      calculateSeverance({ startDate: "2020-01-01", endDate: "2023-01-01", monthlyWage: 0, scenario: "n" }),
    ).toThrow();
  });
});
