/**
 * AI 功能的轻量防滥用限流：内存计数，按 IP 每日限额。
 * 单实例部署下足够；阈值可通过 ALLTOOLS_AI_DAILY_LIMIT 调整，默认 20 次/天。
 */

type CreditEntry = { day: string; used: number };

const usage = new Map<string, CreditEntry>();

export class AiRateLimitError extends Error {
  readonly status = 429;
  readonly dailyLimit: number;

  constructor(dailyLimit: number) {
    super("今天的 AI 生成额度已用完，请明天再来。");
    this.name = "AiRateLimitError";
    this.dailyLimit = dailyLimit;
  }
}

export function aiDailyLimit(): number {
  const parsed = Number(process.env.ALLTOOLS_AI_DAILY_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 20;
}

/** 轻量任务（如儿童识字查询）单独的每日额度，默认 100 次。 */
export function cheapAiDailyLimit(): number {
  const parsed = Number(process.env.ALLTOOLS_CHEAP_AI_DAILY_LIMIT);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 100;
}

function todayStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** 消耗一次额度；超过当日限额时抛出 AiRateLimitError。 */
export function consumeAiCredit(ip: string, limit: number = aiDailyLimit()): void {
  const day = todayStamp();

  if (usage.size > 5000) {
    for (const [key, entry] of usage) {
      if (entry.day !== day) usage.delete(key);
    }
  }

  const entry = usage.get(ip);
  if (!entry || entry.day !== day) {
    usage.set(ip, { day, used: 1 });
    return;
  }
  if (entry.used >= limit) throw new AiRateLimitError(limit);
  entry.used += 1;
}

/** 从代理链头中提取客户端 IP（Caddy 会写入 X-Forwarded-For）。 */
export function clientIpOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
