import { describe, expect, it } from "vitest";

import { buildIouText, formatChineseAmount } from "@/lib/iou";

describe("formatChineseAmount", () => {
  it("converts common amounts", () => {
    expect(formatChineseAmount(12000)).toBe("壹万贰仟元整");
    expect(formatChineseAmount(100501)).toBe("壹拾万零伍佰零壹元整");
    expect(formatChineseAmount(0.5)).toBe("伍角");
    expect(formatChineseAmount(1.23)).toBe("壹元贰角叁分");
    expect(formatChineseAmount(0)).toBe("零元整");
  });
});

describe("buildIouText", () => {
  const base = {
    lender: "李出借",
    borrower: "王借款",
    amountYuan: 50000,
    annualRatePercent: 8,
    loanDate: "2026-09-06",
    repaymentDate: "2027-03-06",
    purpose: "装修",
    lenderId: "110101199001011234",
    borrowerId: "110101199001015678",
    payMethod: "银行转账",
  };

  it("includes all key legal elements", () => {
    const text = buildIouText(base);
    expect(text).toContain("借　条");
    expect(text).toContain("王借款（身份证号：110101199001015678）");
    expect(text).toContain("伍万元整");
    expect(text).toContain("¥50000.00");
    expect(text).toContain("年利率为 8%");
    expect(text).toContain("LPR）四倍");
    expect(text).toContain("银行转账");
    expect(text).toContain("2026 年 09 月 06 日");
  });

  it("uses interest-free wording when no rate is given", () => {
    const text = buildIouText({ ...base, annualRatePercent: 0 });
    expect(text).toContain("无息借款");
  });

  it("rejects invalid amounts or missing parties", () => {
    expect(() => buildIouText({ ...base, amountYuan: 0 })).toThrow(/金额/);
    expect(() => buildIouText({ ...base, borrower: " " })).toThrow(/姓名/);
  });
});
