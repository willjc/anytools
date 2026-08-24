export type MortgageInput = {
  principal: number;
  annualRate: number;
  months: number;
};

export type EqualPaymentSummary = {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
};

export type EqualPrincipalSummary = {
  principalPerMonth: number;
  firstPayment: number;
  lastPayment: number;
  totalPayment: number;
  totalInterest: number;
};

function assertValidInput({ principal, annualRate, months }: MortgageInput) {
  if (!Number.isFinite(principal) || principal <= 0) throw new Error("贷款金额必须为正数。");
  if (!Number.isFinite(annualRate) || annualRate < 0) throw new Error("年利率不能为负数。");
  if (!Number.isInteger(months) || months <= 0) throw new Error("还款月数必须为正整数。");
}

export function equalPaymentSummary(input: MortgageInput): EqualPaymentSummary {
  assertValidInput(input);
  const { principal, annualRate, months } = input;

  if (annualRate === 0) {
    const monthlyPayment = principal / months;
    return { monthlyPayment, totalPayment: principal, totalInterest: 0 };
  }

  const monthlyRate = annualRate / 12;
  const factor = (1 + monthlyRate) ** months;
  const monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayment = monthlyPayment * months;
  return { monthlyPayment, totalPayment, totalInterest: totalPayment - principal };
}

export function equalPrincipalSummary(input: MortgageInput): EqualPrincipalSummary {
  assertValidInput(input);
  const { principal, annualRate, months } = input;

  const principalPerMonth = principal / months;
  const monthlyRate = annualRate / 12;
  const firstPayment = principalPerMonth + principal * monthlyRate;
  const remainingAtLastMonth = principal - principalPerMonth * (months - 1);
  const lastPayment = principalPerMonth + remainingAtLastMonth * monthlyRate;
  const totalInterest = (principal * monthlyRate * (months + 1)) / 2;
  return {
    principalPerMonth,
    firstPayment,
    lastPayment,
    totalPayment: principal + totalInterest,
    totalInterest,
  };
}
