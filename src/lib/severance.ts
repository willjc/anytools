/**
 * 经济补偿金（N / N+1 / 2N）计算，依据《劳动合同法》第 40、46、47、87、97 条的通行口径。
 * 仅作参考估算，具体以劳动仲裁与法院认定为准。
 */

export type SeveranceScenario = "n" | "nPlus1" | "twoN" | "expiry";

export const SEVERANCE_SCENARIOS: readonly { id: SeveranceScenario; name: string; description: string }[] = [
  { id: "n", name: "协商解除 / 无过失辞退", description: "单位提出协商一致，或依据第 40 条辞退并提前 30 日书面通知" },
  { id: "nPlus1", name: "无过失辞退未提前通知", description: "依据第 40 条辞退但未提前 30 日书面通知，额外支付一个月工资（代通知金）" },
  { id: "twoN", name: "违法解除", description: "无法定理由辞退、程序违法等，按经济补偿标准的二倍支付赔偿金（第 87 条）" },
  { id: "expiry", name: "合同到期单位不续签", description: "固定期限合同到期，单位降低条件或不续签（第 46 条）" },
] as const;

export type SeveranceInput = {
  /** 入职日期，ISO 格式 yyyy-mm-dd */
  startDate: string;
  /** 离职日期，ISO 格式 yyyy-mm-dd */
  endDate: string;
  /** 离职前 12 个月平均应得工资（元/月，含奖金津贴） */
  monthlyWage: number;
  /** 当地上年度职工月平均工资（元/月，用于三倍封顶判断，可选） */
  socialAverageWage?: number;
  scenario: SeveranceScenario;
};

export type SeveranceResult = {
  years: number;
  /** 折算补偿月数（不满 6 个月 0.5，满 6 个月不满 1 年 1，之后每满一年 1） */
  months: number;
  /** 计算基準月工资（三倍封顶后） */
  baseWage: number;
  /** 是否触发三倍封顶 */
  capped: boolean;
  /** 补偿金 N（元） */
  compensationN: number;
  /** 最终应付总额（N、N+1 或 2N） */
  total: number;
  notes: string[];
};

const MONTHS_PER_YEAR_CAP = 12;

/** 工龄折算为补偿月数：每满一年 1 个月；满 6 个月不满 1 年按 1 年；不满 6 个月 0.5 个月。 */
export function serviceMonths(startDate: string, endDate: string): { years: number; months: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("请检查入职与离职日期。");
  }
  const totalDays = (end.getTime() - start.getTime()) / 86400000;
  const years = totalDays / 365.25;
  const wholeYears = Math.floor(years);
  const remainderMonths = (totalDays - wholeYears * 365.25) / 30.44;
  const extraMonths = remainderMonths >= 6 ? 1 : remainderMonths > 0 ? 0.5 : 0;
  return { years, months: wholeYears + extraMonths };
}

export function calculateSeverance(input: SeveranceInput): SeveranceResult {
  const monthlyWage = input.monthlyWage;
  if (!Number.isFinite(monthlyWage) || monthlyWage <= 0) {
    throw new Error("请输入有效的月平均工资。");
  }

  const { years, months: rawMonths } = serviceMonths(input.startDate, input.endDate);
  const notes: string[] = [];

  let months = rawMonths;
  let baseWage = monthlyWage;
  let capped = false;
  const capWage = input.socialAverageWage && input.socialAverageWage > 0 ? input.socialAverageWage * 3 : null;
  if (capWage && monthlyWage > capWage) {
    baseWage = capWage;
    if (months > MONTHS_PER_YEAR_CAP) months = MONTHS_PER_YEAR_CAP;
    capped = true;
    notes.push(`月工资高于当地社平工资三倍，已按三倍（${capWage.toFixed(2)} 元）封顶，且补偿年限最高按 12 年计算。`);
  }

  const compensationN = baseWage * months;
  let total = compensationN;

  if (input.scenario === "nPlus1") {
    total = compensationN + monthlyWage;
    notes.push("代通知金按离职前一个月工资标准支付，实践中通常不适用三倍封顶。");
  } else if (input.scenario === "twoN") {
    total = compensationN * 2;
    notes.push("违法解除赔偿金为经济补偿标准的二倍，支付后不再另行支付代通知金。");
  } else if (input.scenario === "expiry") {
    notes.push("合同到期续签时，若单位维持或提高条件而劳动者拒绝续签，无经济补偿。");
  }

  if (months < 0.5) notes.push("工作不满 6 个月？注意：应按 0.5 个月计算，若入职极短请核对日期。");
  notes.push("月工资按应得工资计算（含计时/计件工资、奖金、津贴与补贴等货币性收入）。");
  notes.push("本结果仅为参考估算，具体以劳动仲裁与法院认定为准。");

  return { years, months, baseWage, capped, compensationN, total, notes };
}
