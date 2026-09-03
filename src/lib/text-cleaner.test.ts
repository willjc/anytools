import { describe, expect, it } from "vitest";

import {
  deduplicateLines,
  countChineseWords,
  getTextStats,
  removeBlankLines,
  sortLines,
  trimLineEdges,
} from "@/lib/text-cleaner";

describe("getTextStats", () => {
  it("counts mixed Chinese and English text", () => {
    const stats = getTextStats("你好 世界\nhello world");

    expect(stats).toEqual({
      characters: 17,
      nonWhitespaceCharacters: 14,
      lines: 2,
      chineseWords: 2,
      englishWords: 2,
    });
  });

  it("returns zeroes for empty text", () => {
    expect(getTextStats("")).toEqual({
      characters: 0,
      nonWhitespaceCharacters: 0,
      lines: 0,
      chineseWords: 0,
      englishWords: 0,
    });
  });

  it("falls back to counting Han characters without Intl.Segmenter", () => {
    expect(countChineseWords("你好 world", null)).toBe(2);
  });
});

describe("text cleanup", () => {
  it("trims every line and removes blank lines", () => {
    const source = "  第一行  \r\n   \r\n second line ";
    expect(trimLineEdges(source)).toBe("第一行\n\nsecond line");
    expect(removeBlankLines(source)).toBe("  第一行  \n second line ");
  });

  it("deduplicates lines while preserving the first occurrence", () => {
    expect(deduplicateLines("b\na\nb\nA")).toBe("b\na\nA");
  });

  it("sorts lines with natural numeric ordering", () => {
    expect(sortLines("item10\nitem2\nitem1")).toBe("item1\nitem2\nitem10");
  });
});
