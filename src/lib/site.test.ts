import { describe, expect, it } from "vitest";

import { getSiteUrl } from "@/lib/site";

describe("getSiteUrl", () => {
  it("normalizes a configured URL to its origin", () => {
    expect(getSiteUrl("https://tools.example.com/anything?source=test")).toBe(
      "https://tools.example.com",
    );
  });

  it("falls back safely when the configured value is invalid", () => {
    expect(getSiteUrl("not a url")).toBe("http://localhost:3000");
    expect(getSiteUrl("ftp://tools.example.com")).toBe("http://localhost:3000");
    expect(getSiteUrl("https://user:pass@tools.example.com")).toBe(
      "http://localhost:3000",
    );
  });
});
