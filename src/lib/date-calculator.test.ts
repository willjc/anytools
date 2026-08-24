import { describe, expect, it } from "vitest";

import { addDays, diffInDays } from "@/lib/date-calculator";

describe("diffInDays", () => {
  it("counts whole days between two dates", () => {
    expect(diffInDays("2026-08-24", "2026-09-01")).toBe(8);
    expect(diffInDays("2026-09-01", "2026-08-24")).toBe(-8);
  });

  it("returns 0 for identical dates and spans across years", () => {
    expect(diffInDays("2026-01-01", "2026-01-01")).toBe(0);
    expect(diffInDays("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("rejects malformed input", () => {
    expect(diffInDays("2026-13-01", "2026-12-01")).toBeNull();
    expect(diffInDays("", "2026-12-01")).toBeNull();
    expect(diffInDays("2026/08/24", "2026-12-01")).toBeNull();
  });
});

describe("addDays", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-08-24", 8)).toBe("2026-09-01");
    expect(addDays("2026-08-24", -31)).toBe("2026-07-24");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("rejects malformed input", () => {
    expect(addDays("not-a-date", 1)).toBeNull();
  });
});
