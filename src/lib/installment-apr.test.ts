import { describe, expect, it } from "vitest";

import { calculateInstallmentApr, npv, solveMonthlyIrr } from "@/lib/installment-apr";

describe("calculateInstallmentApr", () => {
  it("reveals the true APR of a 0.6% monthly fee 12-month plan", () => {
    const result = calculateInstallmentApr({ principal: 12000, months: 12, monthlyFeeRate: 0.006 });
    expect(result.monthlyPayment).toBeCloseTo(1072, 5);
    expect(result.totalFee).toBeCloseTo(864, 5);
    // 0.6% × 12 = 7.2% 只是表面数字
    expect(result.nominalAnnualRate).toBeCloseTo(0.072, 6);
    // 实际年化应远高于表面（约 12%~14%）
    expect(result.effectiveAnnualRate).toBeGreaterThan(0.11);
    expect(result.effectiveAnnualRate).toBeLessThan(0.15);
    // 解出的利率代入 NPV 应约为 0
    const monthlyIrr = (1 + result.effectiveAnnualRate) ** (1 / 12) - 1;
    expect(npv(12000, result.monthlyPayment, 12, monthlyIrr)).toBeCloseTo(0, 4);
  });

  it("returns zero APR for an interest-free plan", () => {
    const result = calculateInstallmentApr({ principal: 1200, months: 12, monthlyFeeRate: 0 });
    expect(result.effectiveAnnualRate).toBe(0);
    expect(result.totalFee).toBe(0);
  });

  it("supports explicit monthly payment", () => {
    const result = calculateInstallmentApr({ principal: 10000, months: 6, monthlyPayment: 1800 });
    expect(result.totalFee).toBe(800);
    expect(result.effectiveAnnualRate).toBeGreaterThan(0.25); // 1800×6=10800，实际年化相当高
  });

  it("rejects non-positive principal", () => {
    expect(() => calculateInstallmentApr({ principal: 0, months: 12, monthlyFeeRate: 0.006 })).toThrow();
  });

  it("solveMonthlyIrr is exact on a known annuity", () => {
    // 12000 本金、12 期、每期 1066.19 → 月利率约 1%
    const irr = solveMonthlyIrr(12000, 1066.19, 12);
    expect(irr).toBeCloseTo(0.01, 3);
  });
});
