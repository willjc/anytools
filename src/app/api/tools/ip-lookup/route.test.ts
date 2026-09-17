import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/tools/ip-lookup/route";
import { clientIpOf } from "@/lib/server/ai-rate-limit";

const fetchMock = vi.fn();
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("visitor IP endpoint", () => {
  it("uses the same gateway IP as AI rate limiting", async () => {
    vi.stubGlobal("fetch", fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: "fail" }))));
    const request = new Request("https://tools.duwu.me/api/tools/ip-lookup", {
      headers: { "x-suishou-client-ip": "198.51.100.23", "x-forwarded-for": "203.0.113.9" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body.ip).toBe(clientIpOf(request));
    expect(body.ip).toBe("198.51.100.23");
    expect(body.isPrivate).toBe(false);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock.mock.calls[0][0]).toContain("/198.51.100.23?");
  });

  it.each([undefined, "not-an-ip", "127.0.0.1"])("does not geolocate missing, invalid or private addresses: %s", async (ip) => {
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("http://localhost:3000/api/tools/ip-lookup", {
      headers: ip ? { "x-suishou-client-ip": ip } : {},
    });
    const body = await (await GET(request)).json();
    expect(body.isPrivate).toBe(true);
    expect(body.geo).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    if (!ip) expect(body.ip).toBe("");
  });
});
