/**
 * 分期实际年化利率（APR）计算。
 * 分期按「月手续费率」计费时，本金逐月归还而手续费按全额收取，
 * 真实年化远高于「月费率 × 12」。本模块用 IRR（内部收益率）还原真实成本。
 */

export type InstallmentInput = {
  /** 分期本金（元） */
  principal: number;
  /** 期数（月） */
  months: number;
  /** 每月手续费率（如 0.006 表示 0.6%），与 monthlyPayment 二选一 */
  monthlyFeeRate?: number;
  /** 直接指定每月还款额（元），与 monthlyFeeRate 二选一 */
  monthlyPayment?: number;
};

export type InstallmentResult = {
  principal: number;
  months: number;
  monthlyPayment: number;
  totalFee: number;
  totalRepayment: number;
  /** 表面年利率 = 月费率 × 12（费率模式才有意义） */
  nominalAnnualRate: number | null;
  /** 实际年化利率（复利 IRR） */
  effectiveAnnualRate: number;
};

/** 每月还款额推导 */
export function monthlyPaymentOf({ principal, months, monthlyFeeRate, monthlyPayment }: InstallmentInput): { payment: number; totalFee: number } {
  if (monthlyPayment && monthlyPayment > 0) {
    return { payment: monthlyPayment, totalFee: monthlyPayment * months - principal };
  }
  const rate = monthlyFeeRate ?? 0;
  const fee = principal * rate;
  return { payment: principal / months + fee, totalFee: fee * months };
}

/** 净现值：以月利率 i 折现全部还款。 */
export function npv(principal: number, payment: number, months: number, monthlyIrr: number): number {
  let value = -principal;
  for (let k = 1; k <= months; k += 1) {
    value += payment / (1 + monthlyIrr) ** k;
  }
  return value;
}

/** 二分求解月 IRR（NPV 单调递减，月利率范围 0 ~ 1 足够覆盖任何分期）。 */
export function solveMonthlyIrr(principal: number, payment: number, months: number): number {
  if (payment * months <= principal) return 0;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    if (npv(principal, payment, months, mid) > 0) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function calculateInstallmentApr(input: InstallmentInput): InstallmentResult {
  const principal = input.principal;
  const months = Math.max(1, Math.round(input.months));
  if (principal <= 0) throw new Error("请输入有效的分期金额。");

  const { payment, totalFee } = monthlyPaymentOf({ ...input, months });
  const monthlyIrr = solveMonthlyIrr(principal, payment, months);
  const effectiveAnnualRate = (1 + monthlyIrr) ** 12 - 1;

  return {
    principal,
    months,
    monthlyPayment: payment,
    totalFee,
    totalRepayment: payment * months,
    nominalAnnualRate: input.monthlyFeeRate !== undefined ? input.monthlyFeeRate * 12 : null,
    effectiveAnnualRate,
  };
}
