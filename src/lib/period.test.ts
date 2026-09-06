import { describe, expect, it } from "vitest";

import { addDays, classifyDate, cycleStats, predictPeriod } from "@/lib/period";

describe("cycleStats", () => {
  it("averages gaps between starts", () => {
    const stats = cycleStats([
      { start: "2026-01-01" },
      { start: "2026-01-29" },
      { start: "2026-02-26" },
    ]);
    expect(stats.averageCycleDays).toBe(28);
    expect(stats.regular).toBe(true);
    expect(stats.cycleRange).toEqual({ min: 28, max: 28 });
  });

  it("flags irregular cycles", () => {
    const stats = cycleStats([
      { start: "2026-01-01" },
      { start: "2026-01-24" },
      { start: "2026-02-26" },
    ]);
    expect(stats.regular).toBe(false);
  });

  it("falls back to defaults with too few records", () => {
    expect(cycleStats([]).averageCycleDays).toBe(28);
    expect(cycleStats([{ start: "2026-01-01" }]).recordCount).toBe(1);
  });
});

describe("predictPeriod", () => {
  it("predicts the next start, ovulation, and fertile window", () => {
    const prediction = predictPeriod([{ start: "2026-03-01" }, { start: "2026-03-29" }]);
    expect(prediction?.nextStart).toBe("2026-04-26");
    expect(prediction?.nextEnd).toBe("2026-04-30");
    expect(prediction?.ovulationDate).toBe("2026-04-12");
    expect(prediction?.fertileStart).toBe("2026-04-07");
    expect(prediction?.fertileEnd).toBe("2026-04-16");
  });

  it("returns null without records", () => {
    expect(predictPeriod([])).toBeNull();
  });

  it("addDays handles month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });
});

describe("classifyDate", () => {
  const records = [{ start: "2026-03-01" }, { start: "2026-03-29" }];

  it("marks recorded period days", () => {
    expect(classifyDate("2026-03-02", records)).toBe("period");
  });

  it("marks predicted, ovulation, and fertile days", () => {
    expect(classifyDate("2026-04-27", records)).toBe("predicted");
    expect(classifyDate("2026-04-12", records)).toBe("ovulation");
    expect(classifyDate("2026-04-10", records)).toBe("fertile");
    expect(classifyDate("2026-04-20", records)).toBe("none");
  });
});
