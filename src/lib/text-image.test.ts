import { describe, expect, it } from "vitest";

import { normalizeBodyText, tokenizeLine, wrapText } from "@/lib/text-image";

/** 每个字符宽度为 1、ASCII 词整体计宽的测量函数 */
const measure = (value: string) => value.length;

describe("tokenizeLine", () => {
  it("groups ascii words and splits cjk chars", () => {
    expect(tokenizeLine("你好 world 2026")).toEqual(["你", "好", " ", "world", " ", "2026"]);
  });
});

describe("wrapText", () => {
  it("wraps cjk text at the width limit", () => {
    const lines = wrapText("一二三四五六七八九十", measure, 6);
    expect(lines).toEqual(["一二三四五六", "七八九十"]);
  });

  it("keeps paragraph breaks as empty lines", () => {
    const lines = wrapText("第一段\n\n第二段", measure, 10);
    expect(lines).toEqual(["第一段", "", "第二段"]);
  });

  it("never leaves a no-line-start punctuation at line head", () => {
    // 第 6 个字符是句号，应与前面的字一起落到第二行
    const lines = wrapText("一二三四五六。七八", measure, 6);
    expect(lines).toEqual(["一二三四五", "六。七八"]);
  });

  it("moves consecutive kinsoku punctuation together", () => {
    const lines = wrapText("一二三四五。”六", measure, 6);
    expect(lines).toEqual(["一二三四", "五。”六"]);
    for (const line of lines) {
      expect("。，、；：？！”』」》〉】").not.toContain(line[0]);
    }
  });

  it("moves an opening bracket at line end to the next line", () => {
    const lines = wrapText("一二三四五（六七", measure, 6);
    expect(lines[0].endsWith("（")).toBe(false);
    expect(lines[1].startsWith("（")).toBe(true);
  });

  it("keeps ascii words unbroken when they fit on their own line", () => {
    const lines = wrapText("中文 amazing 中文", measure, 8);
    expect(lines.map((line) => line.trim())).toEqual(["中文", "amazing", "中文"]);
  });

  it("hard-splits a single unit wider than the line", () => {
    const lines = wrapText("aaaaaaaaaaaa", measure, 5);
    expect(lines).toEqual(["aaaaa", "aaaaa", "aa"]);
  });

  it("handles crlf line endings", () => {
    expect(wrapText("一二\r\n三四", measure, 10)).toEqual(["一二", "三四"]);
  });
});

describe("normalizeBodyText", () => {
  it("normalizes crlf and truncates", () => {
    expect(normalizeBodyText("a\r\nb")).toBe("a\nb");
    expect(normalizeBodyText("x".repeat(31), 30)).toHaveLength(30);
  });
});
