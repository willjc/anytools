import { describe, expect, it } from "vitest";

import { toRmbUppercase } from "@/lib/rmb-uppercase";

describe("toRmbUppercase", () => {
  it("converts whole amounts with the 整 suffix", () => {
    expect(toRmbUppercase(0)).toBe("零元整");
    expect(toRmbUppercase(1)).toBe("壹元整");
    expect(toRmbUppercase(10)).toBe("壹拾元整");
    expect(toRmbUppercase(110)).toBe("壹佰壹拾元整");
    expect(toRmbUppercase(1234)).toBe("壹仟贰佰叁拾肆元整");
  });

  it("inserts 零 for interior zeros", () => {
    expect(toRmbUppercase(105)).toBe("壹佰零伍元整");
    expect(toRmbUppercase(1005)).toBe("壹仟零伍元整");
    expect(toRmbUppercase(1034)).toBe("壹仟零叁拾肆元整");
  });

  it("handles 万 and 亿 groups including gaps", () => {
    expect(toRmbUppercase(10000)).toBe("壹万元整");
    expect(toRmbUppercase(123456789)).toBe("壹亿贰仟叁佰肆拾伍万陆仟柒佰捌拾玖元整");
    expect(toRmbUppercase(100000001)).toBe("壹亿零壹元整");
    expect(toRmbUppercase(100010000)).toBe("壹亿零壹万元整");
    expect(toRmbUppercase(100500000)).toBe("壹亿零伍拾万元整");
  });

  it("renders 角 and 分 correctly", () => {
    expect(toRmbUppercase(1.23)).toBe("壹元贰角叁分");
    expect(toRmbUppercase(1.5)).toBe("壹元伍角");
    expect(toRmbUppercase(1.05)).toBe("壹元零伍分");
    expect(toRmbUppercase(0.05)).toBe("伍分");
    expect(toRmbUppercase(0.5)).toBe("伍角");
    expect(toRmbUppercase(123.04)).toBe("壹佰贰拾叁元零肆分");
  });

  it("rejects invalid amounts", () => {
    expect(toRmbUppercase(-1)).toBeNull();
    expect(toRmbUppercase(Number.NaN)).toBeNull();
    expect(toRmbUppercase(10 ** 13)).toBeNull();
  });
});
