import { describe, expect, it } from "vitest";

import {
  equalPaymentSummary,
  equalPrincipalSummary,
} from "@/lib/mortgage";

describe("equalPaymentSummary (等额本息)", () => {
  it("computes a level monthly payment with compound interest", () => {
    const summary = equalPaymentSummary({ principal: 1_000_000, annualRate: 0.0325, months: 360 });
    expect(summary.monthlyPayment).toBeCloseTo(4352.06, 1);
    expect(summary.totalInterest).toBeCloseTo(summary.monthlyPayment * 360 - 1_000_000, 0);
    expect(summary.totalPayment).toBeCloseTo(summary.monthlyPayment * 360, 2);
  });

  it("charges no interest for a zero-rate loan", () => {
    const summary = equalPaymentSummary({ principal: 120_000, annualRate: 0, months: 12 });
    expect(summary.monthlyPayment).toBeCloseTo(10_000);
    expect(summary.totalInterest).toBe(0);
  });
});

describe("equalPrincipalSummary (等额本金)", () => {
  it("starts higher and totals less interest than 等额本息 at the same rate", () => {
    const summary = equalPrincipalSummary({ principal: 1_000_000, annualRate: 0.0325, months: 360 });
    expect(summary.firstPayment).toBeGreaterThan(summary.lastPayment);
    expect(summary.principalPerMonth).toBeCloseTo(1_000_000 / 360, 6);
    expect(summary.firstPayment).toBeCloseTo(summary.principalPerMonth + 1_000_000 * (0.0325 / 12), 4);
    const expectedTotalInterest = 1_000_000 * (0.0325 / 12) * ((360 + 1) / 2);
    expect(summary.totalInterest).toBeCloseTo(expectedTotalInterest, 4);

    const equal = equalPaymentSummary({ principal: 1_000_000, annualRate: 0.0325, months: 360 });
    expect(summary.totalInterest).toBeLessThan(equal.totalInterest);
  });

  it("rejects invalid inputs in both modes", () => {
    expect(() => equalPaymentSummary({ principal: 0, annualRate: 0.03, months: 12 })).toThrow();
    expect(() => equalPrincipalSummary({ principal: 100, annualRate: 0.03, months: 0 })).toThrow();
    expect(() => equalPaymentSummary({ principal: -5, annualRate: 0.03, months: 12 })).toThrow();
  });
});
