/**
 * 经期周期推算（日历法）。所有数据由前端保存在浏览器本地，本模块只做纯计算。
 * 重要：日历法受周期波动影响大，不可作为避孕依据。
 */

export type PeriodRecord = {
  /** 经期开始日期 yyyy-mm-dd */
  start: string;
};

export type CycleStats = {
  /** 平均周期天数（基于最近记录推算） */
  averageCycleDays: number;
  recordCount: number;
  /** 周期是否规律（最长与最短相差 ≤ 7 天） */
  regular: boolean;
  cycleRange: { min: number; max: number } | null;
};

export type PeriodPrediction = {
  nextStart: string;
  nextEnd: string;
  ovulationDate: string;
  fertileStart: string;
  fertileEnd: string;
};

export const PERIOD_DEFAULTS = {
  cycleDays: 28,
  periodDays: 5,
} as const;

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

export function addDays(date: string, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

/** 由记录推算平均周期：相邻两次开始日期的间隔。周期不在 21~45 天视为异常剔除。 */
export function cycleStats(records: PeriodRecord[]): CycleStats {
  const sorted = records.map((item) => item.start).filter((date) => !Number.isNaN(new Date(date).getTime())).sort();
  if (sorted.length < 2) {
    return { averageCycleDays: PERIOD_DEFAULTS.cycleDays, recordCount: sorted.length, regular: true, cycleRange: null };
  }
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = daysBetween(sorted[i - 1], sorted[i]);
    if (gap >= 15 && gap <= 60) gaps.push(gap);
  }
  if (gaps.length === 0) {
    return { averageCycleDays: PERIOD_DEFAULTS.cycleDays, recordCount: sorted.length, regular: true, cycleRange: null };
  }
  const min = Math.min(...gaps);
  const max = Math.max(...gaps);
  const average = Math.round(gaps.reduce((sum, value) => sum + value, 0) / gaps.length);
  return { averageCycleDays: average, recordCount: sorted.length, regular: max - min <= 7, cycleRange: { min, max } };
}

/** 以最近一次开始日 + 平均周期推算下一次经期、排卵日与易孕窗口。 */
export function predictPeriod(records: PeriodRecord[], periodDays = PERIOD_DEFAULTS.periodDays): (PeriodPrediction & { stats: CycleStats }) | null {
  const sorted = records.map((item) => item.start).filter((date) => !Number.isNaN(new Date(date).getTime())).sort();
  if (sorted.length === 0) return null;
  const stats = cycleStats(records);
  const lastStart = sorted[sorted.length - 1];
  const nextStart = addDays(lastStart, stats.averageCycleDays);
  // 排卵日约为下次月经前 14 天
  const ovulationDate = addDays(nextStart, -14);
  return {
    nextStart,
    nextEnd: addDays(nextStart, periodDays - 1),
    ovulationDate,
    fertileStart: addDays(ovulationDate, -5),
    fertileEnd: addDays(ovulationDate, 4),
    stats,
  };
}

/** 判断某日期落在哪个窗口，用于日历标记。 */
export function classifyDate(
  date: string,
  records: PeriodRecord[],
  periodDays = PERIOD_DEFAULTS.periodDays,
): "period" | "predicted" | "fertile" | "ovulation" | "none" {
  const prediction = predictPeriod(records, periodDays);
  if (!prediction) return "none";
  const sorted = records.map((item) => item.start).filter((value) => !Number.isNaN(new Date(value).getTime())).sort();
  for (const start of sorted) {
    if (daysBetween(start, date) >= 0 && daysBetween(start, date) <= periodDays - 1) return "period";
  }
  if (daysBetween(prediction.nextStart, date) >= 0 && daysBetween(prediction.nextStart, date) <= periodDays - 1) return "predicted";
  if (date === prediction.ovulationDate) return "ovulation";
  if (daysBetween(prediction.fertileStart, date) >= 0 && daysBetween(date, prediction.fertileEnd) >= 0) return "fertile";
  return "none";
}
