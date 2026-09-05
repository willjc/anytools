import { afterEach, describe, expect, it } from "vitest";

import { consumeAiCredit, AiRateLimitError, aiDailyLimit, clientIpOf } from "@/lib/server/ai-rate-limit";

const originalLimit = process.env.ALLTOOLS_AI_DAILY_LIMIT;

afterEach(() => {
  if (originalLimit === undefined) delete process.env.ALLTOOLS_AI_DAILY_LIMIT;
  else process.env.ALLTOOLS_AI_DAILY_LIMIT = originalLimit;
});

describe("ai rate limit", () => {
  it("defaults to 20 requests per day", () => {
    delete process.env.ALLTOOLS_AI_DAILY_LIMIT;
    expect(aiDailyLimit()).toBe(20);
    process.env.ALLTOOLS_AI_DAILY_LIMIT = "3";
    expect(aiDailyLimit()).toBe(3);
  });

  it("allows usage below the limit and blocks beyond it", () => {
    process.env.ALLTOOLS_AI_DAILY_LIMIT = "3";
    const ip = "203.0.113.7";
    consumeAiCredit(ip);
    consumeAiCredit(ip);
    consumeAiCredit(ip);
    expect(() => consumeAiCredit(ip)).toThrowError(AiRateLimitError);
    expect(() => consumeAiCredit(ip)).toThrowError(/额度已用完/);

    // 其他 IP 不受影响
    expect(() => consumeAiCredit("198.51.100.9")).not.toThrow();
  });

  it("extracts client ip from forwarded headers", () => {
    const request = new Request("https://example.com/api", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(clientIpOf(request)).toBe("203.0.113.5");
    expect(clientIpOf(new Request("https://example.com/api"))).toBe("unknown");
  });
});
