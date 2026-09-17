import { describe, expect, it } from "vitest";

import { clientIpOf } from "@/lib/server/ai-rate-limit";

describe("clientIpOf", () => {
  it("prefers the trusted proxy header written by the gateway", () => {
    const request = new Request("https://tools.duwu.me/api", {
      headers: {
        // 网关可信头存在时，忽略访客可伪造的 X-Forwarded-For
        "x-suishou-client-ip": "198.51.100.23",
        "x-forwarded-for": "1.2.3.4, 10.0.0.1",
      },
    });
    expect(clientIpOf(request)).toBe("198.51.100.23");
  });

  it("falls back to x-forwarded-for first hop when the trusted header is missing", () => {
    const request = new Request("http://localhost:3000/api", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(clientIpOf(request)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip then unknown", () => {
    const request = new Request("http://localhost:3000/api", {
      headers: { "x-real-ip": "198.51.100.9" },
    });
    expect(clientIpOf(request)).toBe("198.51.100.9");
    expect(clientIpOf(new Request("http://localhost:3000/api"))).toBe("unknown");
  });
});
