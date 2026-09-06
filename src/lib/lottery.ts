/**
 * 抽奖 / 随机点名核心：名单解析与无放回抽样。
 * 纯函数；随机源由调用方注入（浏览器端用 crypto.getRandomValues）。
 */

export const LOTTERY_LIMITS = {
  maxNames: 1000,
  maxWinnersPerDraw: 20,
  maxWinnersHistory: 200,
} as const;

/** 解析名单：支持换行、逗号（中英文）、顿号、分号、制表符分隔；去空、去重、保持顺序。 */
export function parseNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of text.split(/[\n\r，,、;；\t]+/)) {
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
    if (names.length >= LOTTERY_LIMITS.maxNames) break;
  }
  return names;
}

/**
 * 无放回抽取 count 个中奖者（Fisher-Yates 部分洗牌）。
 * count 超过池子大小时返回全池的随机排列。
 */
export function drawWinners(pool: string[], count: number, rng: () => number = Math.random): string[] {
  const take = Math.max(0, Math.min(count, pool.length));
  const items = [...pool];
  for (let i = 0; i < take; i += 1) {
    const j = i + Math.floor(rng() * (items.length - i));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, take);
}

export function formatWinnerList(winners: string[]): string {
  return winners.join("、");
}
