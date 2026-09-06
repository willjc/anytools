import { describe, expect, it } from "vitest";

import { drawWinners, formatWinnerList, LOTTERY_LIMITS, parseNames } from "@/lib/lottery";

describe("parseNames", () => {
  it("splits on newlines, commas, and enumeration marks", () => {
    expect(parseNames("张三\n李四，王五、赵六;孙七\t周八")).toEqual(["张三", "李四", "王五", "赵六", "孙七", "周八"]);
  });

  it("trims entries and drops empties and duplicates", () => {
    expect(parseNames("张三\n  张三  \n\n李四 ")).toEqual(["张三", "李四"]);
  });

  it("keeps names containing spaces when separated by newlines", () => {
    expect(parseNames("张 三\n李四")).toEqual(["张 三", "李四"]);
  });

  it("caps the list at the limit", () => {
    const text = Array.from({ length: LOTTERY_LIMITS.maxNames + 50 }, (_, i) => `名字${i}`).join("\n");
    expect(parseNames(text)).toHaveLength(LOTTERY_LIMITS.maxNames);
  });
});

describe("drawWinners", () => {
  it("draws without replacement using the injected rng", () => {
    // rng 恒为 0 时 Fisher-Yates 每步选自身，结果即原顺序前 N 个
    expect(drawWinners(["甲", "乙", "丙", "丁"], 2, () => 0)).toEqual(["甲", "乙"]);
  });

  it("returns no duplicates and never exceeds the pool", () => {
    const pool = ["a", "b", "c", "d", "e"];
    const winners = drawWinners(pool, 5, () => 0.999);
    expect(new Set(winners).size).toBe(5);
    expect(drawWinners(pool, 99, () => 0.5)).toHaveLength(5);
  });

  it("handles empty pools and zero draws", () => {
    expect(drawWinners([], 3, () => 0.5)).toEqual([]);
    expect(drawWinners(["a"], 0, () => 0.5)).toEqual([]);
  });

  it("uses each winner exactly once across the whole pool", () => {
    const pool = ["一", "二", "三", "四", "五", "六"];
    const winners = drawWinners(pool, 6, () => 0.42);
    expect([...winners].sort()).toEqual([...pool].sort());
  });
});

describe("formatWinnerList", () => {
  it("joins winners with the enumeration mark", () => {
    expect(formatWinnerList(["张三", "李四"])).toBe("张三、李四");
  });
});
