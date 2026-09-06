import { describe, expect, it } from "vitest";

import { formatCents, settleAa } from "@/lib/aa-settle";

describe("settleAa", () => {
  it("settles a classic one-payer case in two transfers", () => {
    const result = settleAa([
      { name: "张三", paidYuan: 300 },
      { name: "李四", paidYuan: 0 },
      { name: "王五", paidYuan: 0 },
    ]);
    expect(result.totalCents).toBe(30000);
    expect(result.shareCents).toBe(10000);
    expect(result.transfers).toEqual([
      { from: "李四", to: "张三", cents: 10000 },
      { from: "王五", to: "张三", cents: 10000 },
    ]);
  });

  it("handles uneven payments with cents rounding", () => {
    const result = settleAa([
      { name: "甲", paidYuan: 100.01 },
      { name: "乙", paidYuan: 100 },
      { name: "丙", paidYuan: 100 },
    ]);
    // 总 300.01，人均 100.0033 → 取整到 100.00 分摊
    expect(result.transfers.every((transfer) => transfer.cents > 0)).toBe(true);
    const flow = result.transfers.reduce((sum, transfer) => sum + transfer.cents, 0);
    expect(flow).toBeLessThanOrEqual(2);
  });

  it("produces no transfers when everyone paid the same", () => {
    const result = settleAa([
      { name: "甲", paidYuan: 50 },
      { name: "乙", paidYuan: 50 },
    ]);
    expect(result.transfers).toEqual([]);
  });

  it("handles a debtor paying more than owed to a creditor", () => {
    const result = settleAa([
      { name: "甲", paidYuan: 90 },
      { name: "乙", paidYuan: 0 },
      { name: "丙", paidYuan: 90 },
      { name: "丁", paidYuan: 0 },
    ]);
    // 人均 45；甲丙各收 45，乙丁各付 45
    expect(result.transfers).toHaveLength(2);
    expect(result.transfers.reduce((sum, transfer) => sum + transfer.cents, 0)).toBe(9000);
  });

  it("handles the empty case", () => {
    expect(settleAa([]).transfers).toEqual([]);
  });

  it("formats cents correctly", () => {
    expect(formatCents(12345)).toBe("123.45");
    expect(formatCents(5)).toBe("0.05");
  });
});
